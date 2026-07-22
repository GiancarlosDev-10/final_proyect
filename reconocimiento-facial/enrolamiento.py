"""Revisa periódicamente qué alumnos tienen foto pero no encoding, calcula el
encoding con face_recognition (dlib) y lo sube al backend."""

import base64
import io
import logging
import time

import face_recognition
import numpy as np
from PIL import Image

import cliente_api
import config

logger = logging.getLogger(__name__)


def _decodificar_foto(foto_base64: str) -> np.ndarray:
    bytes_imagen = base64.b64decode(foto_base64)
    imagen = Image.open(io.BytesIO(bytes_imagen)).convert("RGB")
    return np.array(imagen)


def procesar_pendientes() -> int:
    """Procesa todos los alumnos pendientes de encoding. Devuelve cuántos se enrolaron."""
    pendientes = cliente_api.listar_pendientes_encoding()
    enrolados = 0

    for pendiente in pendientes:
        estudiante_id = pendiente["estudianteId"]
        try:
            imagen = _decodificar_foto(pendiente["fotoBase64"])
            rostros = face_recognition.face_encodings(imagen)
        except Exception:
            logger.exception("Error procesando la foto de %s", estudiante_id)
            continue

        if len(rostros) == 0:
            logger.warning(
                "No se detectó ningún rostro en la foto de %s — súbela de nuevo con mejor encuadre.", estudiante_id
            )
            continue
        if len(rostros) > 1:
            logger.warning(
                "Se detectó más de un rostro en la foto de %s — usa una foto con una sola persona.", estudiante_id
            )
            continue

        encoding = rostros[0].tolist()
        if cliente_api.guardar_encoding(estudiante_id, encoding):
            logger.info("Encoding calculado y guardado para %s", estudiante_id)
            enrolados += 1

    return enrolados


def bucle_enrolamiento() -> None:
    while True:
        try:
            enrolados = procesar_pendientes()
            if enrolados:
                logger.info("Enrolamiento: %d alumno(s) procesado(s) en esta pasada.", enrolados)
        except Exception:
            logger.exception("Error en el ciclo de enrolamiento")
        time.sleep(config.INTERVALO_ENROLAMIENTO_SEG)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    bucle_enrolamiento()
