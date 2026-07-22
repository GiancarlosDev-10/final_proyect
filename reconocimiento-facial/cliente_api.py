"""Llamadas HTTP al backend de Next.js (Vercel) — mismo contrato que
src/app/api/asistencia/rostros/*/route.ts y src/app/api/asistencia/route.ts."""

import logging

import requests

import config

logger = logging.getLogger(__name__)

_HEADERS = {"x-api-key": config.API_SECRET, "Content-Type": "application/json"}


def listar_pendientes_encoding() -> list[dict]:
    """Alumnos con foto subida pero sin encoding calculado todavía."""
    resp = requests.get(f"{config.API_BASE_URL}/api/asistencia/rostros/pendientes", headers=_HEADERS, timeout=15)
    resp.raise_for_status()
    datos = resp.json()
    return datos.get("pendientes", []) if datos.get("ok") else []


def guardar_encoding(estudiante_id: str, encoding: list[float]) -> bool:
    resp = requests.post(
        f"{config.API_BASE_URL}/api/asistencia/rostros/encoding",
        headers=_HEADERS,
        json={"estudianteId": estudiante_id, "encoding": encoding},
        timeout=15,
    )
    datos = resp.json()
    if not datos.get("ok"):
        logger.warning("No se pudo guardar el encoding de %s: %s", estudiante_id, datos.get("mensaje"))
    return bool(datos.get("ok"))


def listar_encodings_activos() -> list[dict]:
    """Base de rostros conocidos: [{estudianteId, encoding}, ...]."""
    resp = requests.get(f"{config.API_BASE_URL}/api/asistencia/rostros/encodings", headers=_HEADERS, timeout=15)
    resp.raise_for_status()
    datos = resp.json()
    return datos.get("encodings", []) if datos.get("ok") else []


def marcar_asistencia(estudiante_id: str) -> dict | None:
    """Llama a /api/asistencia. Devuelve {estado, yaRegistrado} o None si falló/rechazó."""
    resp = requests.post(
        f"{config.API_BASE_URL}/api/asistencia",
        headers=_HEADERS,
        json={"estudianteId": estudiante_id},
        timeout=15,
    )
    datos = resp.json()
    if not datos.get("ok"):
        logger.info("No se marcó asistencia para %s: %s", estudiante_id, datos.get("mensaje"))
        return None
    return {"estado": datos["estado"], "yaRegistrado": datos["yaRegistrado"]}
