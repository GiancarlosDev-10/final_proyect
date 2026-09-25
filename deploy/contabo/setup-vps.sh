#!/usr/bin/env bash
# Prepara un VPS Ubuntu 24.04 recién creado: Docker, firewall, swap y los .env
# con los hosts sslip.io. Se puede volver a correr sin romper nada.
#
# Uso (como root, desde la raíz del repo clonado):
#   bash deploy/contabo/setup-vps.sh

set -euo pipefail

DIR_DEPLOY="$(cd "$(dirname "$0")" && pwd)"
DIR_REPO="$(cd "$DIR_DEPLOY/../.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Ejecuta este script como root (sudo bash $0)." >&2
  exit 1
fi

echo "==> Paquetes base"
apt-get update -y
apt-get install -y ca-certificates curl ufw openssl

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Firewall (22, 80, 443)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Swap de 2 GB (colchón para compilar dlib)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> deploy/contabo/.env"
IP_PUBLICA="$(curl -4 -fsS https://ifconfig.me)"
IP_GUIONES="${IP_PUBLICA//./-}"
ENV_DEPLOY="$DIR_DEPLOY/.env"
if [[ ! -f "$ENV_DEPLOY" ]]; then
  cp "$DIR_DEPLOY/.env.example" "$ENV_DEPLOY"
  sed -i "s|^N8N_HOST=.*|N8N_HOST=n8n.${IP_GUIONES}.sslip.io|" "$ENV_DEPLOY"
  sed -i "s|^RECONOCIMIENTO_HOST=.*|RECONOCIMIENTO_HOST=rostros.${IP_GUIONES}.sslip.io|" "$ENV_DEPLOY"
  sed -i "s|^N8N_ENCRYPTION_KEY=.*|N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)|" "$ENV_DEPLOY"
  chmod 600 "$ENV_DEPLOY"
  echo "    Creado. Completa a mano: TELEGRAM_API_SECRET, N8N_WEBHOOK_SECRET, TELEGRAM_BOT_MANUAL_TOKEN, OPENAI_API_KEY"
else
  echo "    Ya existe, no se toca."
fi

echo "==> reconocimiento-facial/.env"
ENV_RECONOCIMIENTO="$DIR_REPO/reconocimiento-facial/.env"
if [[ ! -f "$ENV_RECONOCIMIENTO" ]]; then
  cp "$DIR_REPO/reconocimiento-facial/.env.example" "$ENV_RECONOCIMIENTO"
  chmod 600 "$ENV_RECONOCIMIENTO"
  echo "    Creado. Completa a mano: ASISTENCIA_API_SECRET"
else
  echo "    Ya existe, no se toca."
fi

cat <<EOF

Listo. IP pública: $IP_PUBLICA
  n8n:            https://n8n.${IP_GUIONES}.sslip.io
  reconocimiento: https://rostros.${IP_GUIONES}.sslip.io

Siguiente paso:
  nano $ENV_DEPLOY
  nano $ENV_RECONOCIMIENTO
  cd $DIR_DEPLOY && docker compose up -d --build
EOF
