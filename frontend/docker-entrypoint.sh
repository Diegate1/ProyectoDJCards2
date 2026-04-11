#!/bin/sh
set -e

echo "🎨 Iniciando Frontend"

# Set default values
BACKEND_HOST="${VITE_API_BACKEND_HOST:-backend}"
BACKEND_PORT="${VITE_API_BACKEND_PORT:-3000}"

echo "📡 Backend configurado en: http://${BACKEND_HOST}:${BACKEND_PORT}"

# Iniciar Vite
exec npx vite --host 0.0.0.0
