"""Servicio HTTP que recibe los frames de la cámara del salón, identifica al
alumno (umbral + margen de confianza + votación temporal, ver matcher.py) y
avisa a /api/asistencia cuando está seguro. Corre en la VPS; el navegador le
habla directo a este servicio (no pasa por Vercel) — ver la decisión de
arquitectura "Opción B" en la memoria del proyecto."""

import io
import logging
import os
import threading
import time

import face_recognition
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

import cliente_api
import config
from enrolamiento import bucle_enrolamiento
from matcher import BaseDeRostros, VotanteTemporal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/frame": {"origins": os.environ.get("ORIGEN_PERMITIDO", "*")}})

base_rostros = BaseDeRostros()
votante = VotanteTemporal()
_ultimo_marcado: dict[str, float] = {}
_bloqueo = threading.Lock()


def _decodificar_frame(bytes_imagen: bytes) -> np.ndarray:
    imagen = Image.open(io.BytesIO(bytes_imagen)).convert("RGB")
    return np.array(imagen)


def _rostro_mas_grande(ubicaciones: list[tuple[int, int, int, int]]) -> int:
    """Si hay varias personas en el frame, nos quedamos con la más cercana a
    la cámara (el rectángulo de rostro más grande) — simplificación razonable
    para una cámara de entrada donde pasa una persona a la vez."""
    areas = [(abajo - arriba) * (derecha - izquierda) for arriba, derecha, abajo, izquierda in ubicaciones]
    return int(np.argmax(areas))


def _refrescar_base_rostros_periodicamente() -> None:
    while True:
        try:
            conocidos = cliente_api.listar_encodings_activos()
            base_rostros.actualizar(conocidos)
            logger.info("Base de rostros conocidos actualizada: %d persona(s).", len(conocidos))
        except Exception:
            logger.exception("Error refrescando la base de rostros conocidos")
        time.sleep(config.INTERVALO_REFRESCO_ENCODINGS_SEG)


@app.get("/")
def estado():
    return jsonify({"ok": True, "personas_conocidas": len(base_rostros.ids)})


@app.post("/frame")
def recibir_frame():
    bytes_imagen = request.get_data()
    if not bytes_imagen:
        return jsonify({"ok": False, "mensaje": "Frame vacío"}), 400

    try:
        imagen = _decodificar_frame(bytes_imagen)
        ubicaciones = face_recognition.face_locations(imagen)
    except Exception:
        logger.exception("Error decodificando/procesando el frame")
        return jsonify({"ok": False, "mensaje": "No se pudo procesar el frame"}), 400

    if not ubicaciones:
        votante.votar(None)
        return jsonify({"ok": True, "reconocido": None})

    idx = _rostro_mas_grande(ubicaciones)
    encoding = face_recognition.face_encodings(imagen, known_face_locations=[ubicaciones[idx]])[0]

    candidato = base_rostros.mejor_candidato(encoding)
    confirmado = votante.votar(candidato)

    if not confirmado:
        return jsonify({"ok": True, "reconocido": None})

    with _bloqueo:
        ahora = time.time()
        ultimo = _ultimo_marcado.get(confirmado, 0)
        if ahora - ultimo < config.COOLDOWN_TRAS_MARCAR_SEG:
            return jsonify({"ok": True, "reconocido": confirmado, "yaRegistrado": True})

    resultado = cliente_api.marcar_asistencia(confirmado)

    # El cooldown y el reinicio de la votación solo aplican si REALMENTE se
    # marcó asistencia — si falló (ej. la sesión no cubre la hora actual
    # todavía), se reintenta en el próximo frame en vez de quedar "atascado"
    # sin reintentar por los próximos COOLDOWN_TRAS_MARCAR_SEG segundos.
    if resultado is None:
        return jsonify({"ok": True, "reconocido": confirmado, "marcado": False})

    votante.reiniciar()
    with _bloqueo:
        _ultimo_marcado[confirmado] = time.time()

    logger.info("Asistencia marcada: %s -> %s", confirmado, resultado["estado"])
    return jsonify({"ok": True, "reconocido": confirmado, "marcado": True, **resultado})


if __name__ == "__main__":
    base_rostros.actualizar(cliente_api.listar_encodings_activos())
    logger.info("Base de rostros conocidos inicial: %d persona(s).", len(base_rostros.ids))

    threading.Thread(target=_refrescar_base_rostros_periodicamente, daemon=True).start()
    threading.Thread(target=bucle_enrolamiento, daemon=True).start()

    app.run(host="0.0.0.0", port=config.PUERTO)
