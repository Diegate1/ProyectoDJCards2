#!/bin/bash
set -e

echo "🚀 Iniciando backend..."

# Esperar a que PostgreSQL esté listo (máximo 30 segundos)
echo "⏳ Esperando a PostgreSQL..."
for i in {1..30}; do
  if pg_isready -h postgres -U pokemon > /dev/null 2>&1; then
    echo "✓ PostgreSQL está listo"
    break
  fi
  echo "  Intento $i/30..."
  sleep 1
done

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
npx ts-node scripts/migrate.ts

echo "✓ Migraciones completadas"
echo "🎉 Backend listo"

# Continuar con el comando
exec "$@"
