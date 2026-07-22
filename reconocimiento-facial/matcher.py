"""Lógica de coincidencia de rostros: umbral de distancia + margen de
confianza entre el mejor y segundo mejor candidato + votación temporal sobre
varios frames. Ver la explicación completa de estas técnicas en la
conversación de diseño — el objetivo es priorizar precisión (no confundir
personas) sobre velocidad de reconocimiento."""

from collections import Counter, deque

import face_recognition
import numpy as np

import config


class BaseDeRostros:
    """Encodings conocidos, descargados de /api/asistencia/rostros/encodings."""

    def __init__(self) -> None:
        self.ids: list[str] = []
        self.encodings: np.ndarray = np.empty((0, 128))

    def actualizar(self, conocidos: list[dict]) -> None:
        self.ids = [c["estudianteId"] for c in conocidos]
        self.encodings = np.array([c["encoding"] for c in conocidos]) if conocidos else np.empty((0, 128))

    def esta_vacia(self) -> bool:
        return len(self.ids) == 0

    def mejor_candidato(self, encoding_detectado: np.ndarray) -> str | None:
        """Devuelve el estudianteId del mejor candidato, o None si no hay
        ninguno suficientemente cercano o si el resultado es ambiguo."""
        if self.esta_vacia():
            return None

        distancias = face_recognition.face_distance(self.encodings, encoding_detectado)
        orden = np.argsort(distancias)
        mejor_idx = orden[0]
        mejor_distancia = distancias[mejor_idx]

        if mejor_distancia > config.TOLERANCIA:
            return None

        if len(orden) > 1:
            segunda_mejor_distancia = distancias[orden[1]]
            if (segunda_mejor_distancia - mejor_distancia) < config.MARGEN_MINIMO:
                return None  # ambiguo entre dos personas: mejor no decidir

        return self.ids[mejor_idx]


class VotanteTemporal:
    """Acumula el resultado de los últimos frames y solo confirma una
    identificación cuando se repite lo suficiente (filtra un frame puntual con
    mal ángulo o iluminación)."""

    def __init__(self) -> None:
        self._votos: deque[str | None] = deque(maxlen=config.VENTANA_FRAMES)

    def votar(self, candidato: str | None) -> str | None:
        """Registra el resultado de este frame. Devuelve el estudianteId
        confirmado si ya hay suficientes votos consistentes, si no None."""
        self._votos.append(candidato)
        conteo = Counter(v for v in self._votos if v is not None)
        if not conteo:
            return None
        ganador, votos = conteo.most_common(1)[0]
        return ganador if votos >= config.VOTOS_MINIMOS else None

    def reiniciar(self) -> None:
        self._votos.clear()
