# Dashboard Colegio Juan Velasco

Sistema académico con dos paneles:
- **Admin:** usuarios, estudiantes, secciones, cursos, áreas, periodos, unidades didácticas, asignaciones, matrículas, notas y reportes en Excel/PDF.
- **Profesores:** notas, horarios, recordatorios y asistencia.

Además tiene **asistencia por reconocimiento facial** y **bots de Telegram** para profesores y apoderados.

## Arquitectura

| Pieza | Tecnología | Dónde corre | Carpeta |
|---|---|---|---|
| Dashboard + API | Next.js 16 (App Router), NextAuth, Mongoose | Vercel (región `gru1`) | `src/` |
| Base de datos | MongoDB | Atlas M0 (São Paulo) | — |
| Reconocimiento facial | Python, Flask, face_recognition (dlib) | VPS Contabo (Docker) | `reconocimiento-facial/` |
| Automatizaciones / bots | n8n + Telegram + OpenAI + Gmail | VPS Contabo (Docker) | `n8n/workflows/` |
| Proxy HTTPS | Caddy + sslip.io | VPS Contabo (Docker) | `deploy/contabo/` |

- **El dashboard es un monolito modular.** Cada módulo en `src/modulos/<modulo>/` se divide en capas `dominio/`, `aplicacion/` (casos de uso + interfaces de repositorio), `infraestructura/` (Mongo) y `presentacion/` (server actions y componentes).
- **El reconocimiento facial y n8n son servicios externos** que solo hablan con la API de Next.js (`/api/asistencia/*`, `/api/telegram/*`), autenticados con el header `x-api-key`. Ninguno se conecta a Mongo.

## Desarrollo local

```bash
bun install
cp .env.example .env.local   # completar valores
bun run dev                  # http://localhost:3000
bun run test                 # vitest
```

Scripts de datos (leen `.env.local`):
- `bun run seed`: crea un admin.
- `bun run seed:profesor`: crea un profesor.
- `bun run seed:escolares` y `bun run seed:notas`: generan datos de demo.
- `migrar:*`: migraciones puntuales ya aplicadas.

## Variables de entorno (Vercel)

| Variable | Uso |
|---|---|
| `MONGODB_URI` | Conexión a Atlas |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Sesiones |
| `TELEGRAM_API_SECRET` | `x-api-key` que envía n8n a `/api/telegram/*` |
| `ASISTENCIA_API_SECRET` | `x-api-key` que envía el servicio Python a `/api/asistencia/*` |
| `NEXT_PUBLIC_RECONOCIMIENTO_URL` | URL HTTPS del servicio Python (el navegador le manda los frames); también se agrega a la CSP |
| `N8N_ASISTENCIA_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` | Aviso a n8n cuando un alumno queda presente |

## Despliegue

- **Dashboard:** push a `main`, y Vercel lo despliega solo.
- **VPS (n8n + reconocimiento):** ver [deploy/contabo/README.md](deploy/contabo/README.md).
