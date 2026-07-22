import os

API_BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
API_SECRET = os.environ["ASISTENCIA_API_SECRET"]

# Distancia máxima para considerar una coincidencia (más bajo = más estricto).
TOLERANCIA = float(os.environ.get("TOLERANCIA", "0.5"))

# El mejor candidato debe ganarle al segundo mejor por al menos este margen de
# distancia, si no, se considera ambiguo y se rechaza (evita confundir personas
# de rasgos parecidos).
MARGEN_MINIMO = float(os.environ.get("MARGEN_MINIMO", "0.05"))

# Votación temporal: de los últimos VENTANA_FRAMES frames, se necesitan al
# menos VOTOS_MINIMOS coincidiendo con la misma persona para dar por buena la
# identificación (un solo frame con mal ángulo no basta).
VENTANA_FRAMES = int(os.environ.get("VENTANA_FRAMES", "4"))
VOTOS_MINIMOS = int(os.environ.get("VOTOS_MINIMOS", "3"))

INTERVALO_ENROLAMIENTO_SEG = int(os.environ.get("INTERVALO_ENROLAMIENTO_SEG", "30"))
INTERVALO_REFRESCO_ENCODINGS_SEG = int(os.environ.get("INTERVALO_REFRESCO_ENCODINGS_SEG", "60"))

# Tras marcar a alguien presente con éxito, no lo volvemos a intentar durante
# este tiempo — el backend ya es idempotente (yaRegistrado:true), esto solo
# evita llamadas de red innecesarias en cada frame siguiente.
COOLDOWN_TRAS_MARCAR_SEG = int(os.environ.get("COOLDOWN_TRAS_MARCAR_SEG", "120"))

PUERTO = int(os.environ.get("PUERTO", "5000"))
