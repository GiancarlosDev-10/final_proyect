# Despliegue en Contabo (n8n + reconocimiento facial)

En el VPS corren **n8n** (bots de Telegram) y el **servicio Python de reconocimiento facial**, los dos detrás de **Caddy**, que pone HTTPS automático.

El dashboard sigue en **Vercel** y la base de datos en **MongoDB Atlas**. Nada del VPS se conecta a Mongo: todo pasa por la API de Vercel.

```
Navegador ──frames──► rostros.<ip>.sslip.io (Python) ──► Vercel /api/asistencia ──► Atlas
Telegram  ──────────► n8n.<ip>.sslip.io     (n8n)    ──► Vercel /api/telegram/* ──► Atlas
Vercel ── aviso "presente" ──► n8n.<ip>.sslip.io/webhook/asistencia-apoderado ──► Telegram (padres)
```

No hace falta dominio. [sslip.io](https://sslip.io) resuelve `n8n.1-2-3-4.sslip.io` a la IP `1.2.3.4`, y con eso Caddy obtiene el certificado de Let's Encrypt. Se necesita HTTPS por dos motivos: la cámara del navegador lo exige y Telegram solo acepta webhooks HTTPS.

---

## Antes de empezar, ten a mano

| Dato | De dónde sale |
|---|---|
| `TELEGRAM_API_SECRET`, `N8N_WEBHOOK_SECRET`, `ASISTENCIA_API_SECRET` | `.env.local` del proyecto, o Vercel → Settings → Environment Variables |
| Token de los 3 bots (Profesores, Padres, Manual) | Telegram → @BotFather → `/mybots` → bot → *API Token* |
| API key de OpenAI | platform.openai.com → API keys |
| Acceso a Google Cloud Console | Para la credencial OAuth de Gmail del bot de padres |

## 1. Comprar y entrar al VPS

- Contabo **Cloud VPS 4** (4 vCPU / 8 GB), con **Ubuntu 24.04**.
- Entra por SSH: `ssh root@<IP>`

## 2. Clonar y preparar

```bash
apt-get update && apt-get install -y git
git clone <url-del-repo> /opt/dashboard-final
cd /opt/dashboard-final
bash deploy/contabo/setup-vps.sh
```

El script hace lo siguiente:
- instala Docker;
- abre los puertos 22, 80 y 443;
- crea 2 GB de swap;
- genera `deploy/contabo/.env` y `reconocimiento-facial/.env`.

Al final muestra las URLs `n8n.<ip>.sslip.io` y `rostros.<ip>.sslip.io`.

## 3. Completar los secretos

```bash
nano deploy/contabo/.env                 # TELEGRAM_API_SECRET, N8N_WEBHOOK_SECRET, TELEGRAM_BOT_MANUAL_TOKEN, OPENAI_API_KEY
nano reconocimiento-facial/.env          # ASISTENCIA_API_SECRET
```

## 4. Levantar

```bash
cd deploy/contabo
docker compose up -d --build     # la 1ra vez tarda: compila dlib (varios minutos)
docker compose logs -f caddy     # esperar "certificate obtained successfully" para ambos hosts
```

Comprobaciones:
- `curl https://rostros.<ip>.sslip.io/` debe devolver `{"ok":true,"personas_conocidas":N}`, con N > 0 si hay alumnos enrolados.
- `docker compose logs -f reconocimiento` debe decir "Base de rostros conocidos inicial: N persona(s)".

> Si Caddy no consigue certificado por rate-limit de Let's Encrypt sobre sslip.io, crea un subdominio gratis en [duckdns.org](https://www.duckdns.org) apuntando a la IP. Cambia `N8N_HOST` y `RECONOCIMIENTO_HOST` en `.env` y ejecuta `docker compose up -d`.

## 5. Configurar n8n

1. Abre `https://n8n.<ip>.sslip.io` y crea el usuario owner.
2. **Credenciales** (Overview → Credentials → Create). Los nombres deben ser exactamente estos:

   | Nombre | Tipo | Valor |
   |---|---|---|
   | `Bot Profesores` | Telegram API | token del bot de profesores |
   | `Bot Padres` | Telegram API | token del bot de padres |
   | `Bot Manual` | Telegram API | token del bot manual |
   | `OpenAI account` | OpenAI | API key |
   | `Gmail account` | Gmail OAuth2 | ver el paso 3 |

3. **Gmail OAuth2:**
   - En Google Cloud Console → APIs & Services → Credentials → tu cliente OAuth, agrega en *Authorized redirect URIs*: `https://n8n.<ip>.sslip.io/rest/oauth2-credential/callback`
   - Luego, en n8n, pega el Client ID y el Secret y pulsa *Sign in with Google*.
4. **Importar los workflows.** Ya están montados dentro del contenedor en `/workflows`:
   ```bash
   docker compose exec -u node n8n n8n import:workflow --separate --input=/workflows
   ```
   También puedes importarlos por la UI: *Import from file* con cada JSON de `n8n/workflows/`.
5. Abre cada workflow. En los nodos con credencial en rojo, elige la credencial del mismo nombre y guarda.
6. **Activa** los 4 workflows. Al activarlos, cada Telegram Trigger registra su webhook con la URL nueva.

| Workflow | Qué hace | Bot |
|---|---|---|
| `bot-profesores-notas` | Profesor ingresa su PIN y consulta notas (agente con OpenAI) | Bot Profesores |
| `bot-manual-ayuda` | Ayuda sobre el sistema, acepta audio (Whisper) | Bot Manual |
| `bot-padres-vinculacion` | Apoderado se vincula con DNI + código enviado por Gmail | Bot Padres |
| `bot-padres-notificacion-asistencia` | Webhook `asistencia-apoderado`: avisa al apoderado cuando el alumno queda presente | Bot Padres |

## 6. Vercel y Atlas

**Vercel → proyecto → Settings:**
- **Functions → Function Region → São Paulo (gru1).** Deja las funciones al lado de Atlas; sin esto, cada consulta cruza hasta EE. UU. y las acciones tardan segundos.
- **Environment Variables:**
  - `NEXT_PUBLIC_RECONOCIMIENTO_URL=https://rostros.<ip>.sslip.io`
  - `N8N_ASISTENCIA_WEBHOOK_URL=https://n8n.<ip>.sslip.io/webhook/asistencia-apoderado`
  - Revisa que `TELEGRAM_API_SECRET`, `N8N_WEBHOOK_SECRET` y `ASISTENCIA_API_SECRET` sean iguales a los del VPS.
- **Redeploy.** Es obligatorio: `NEXT_PUBLIC_*` y la CSP se fijan al compilar.

**MongoDB Atlas → Network Access:** debe estar `0.0.0.0/0`, porque Vercel no tiene IP fija.

## 7. Verificación final

- [ ] Bot Profesores: `/start` → PIN → nombre de alumno → responde con notas.
- [ ] Bot Manual responde a texto y a un audio.
- [ ] Bot Padres: DNI → llega el código por Gmail → se vincula.
- [ ] Dashboard → `/asistencia/camara`: reconoce a un alumno, lo marca presente y **al apoderado vinculado le llega el Telegram**.
- [ ] `reboot` del VPS: al volver, `docker compose ps` muestra todo arriba.
- [ ] Contabo → tomar **snapshot** con todo funcionando.

## Operación

```bash
cd /opt/dashboard-final/deploy/contabo
docker compose ps                         # estado
docker compose logs -f n8n                # logs
docker compose restart reconocimiento     # reiniciar un servicio
git pull && docker compose up -d --build  # actualizar tras cambios en el repo
```

Si se exportan de nuevo los workflows desde n8n:
1. Copia los JSON a `n8n/originales/` (ignorado por git).
2. Ejecuta `node n8n/sanear-workflows.mjs`.
3. Commitea `n8n/workflows/`.

Plan B, si un nodo *Code Tool* del agente no puede leer `$env`: importa el original de `n8n/originales/`, que tiene los valores escritos (no lo subas al repo).
