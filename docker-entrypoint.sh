#!/bin/bash
set -e

echo "🚀 Iniciando backend..."

# Detectar si estamos en Docker Compose (postgres) o en Render (DATABASE_URL)
if [ -n "$DATABASE_URL" ]; then
  echo "✓ Modo Render detectado (DATABASE_URL configurada)"
  echo "  Esperando a que la base de datos sea accesible..."
  
  # Para Render, esperar con pg_isready sin hostname específico
  for i in {1..30}; do
    if timeout 5 bash -c "</dev/tcp/$(echo $DATABASE_URL | grep -oP '(?<=@)[^:]+' | head -1)/5432" 2>/dev/null; then
      echo "✓ Base de datos accesible"
      break
    fi
    echo "  Intento $i/30..."
    sleep 1
  done
else
  echo "✓ Modo Docker Compose detectado"
  echo "⏳ Esperando a PostgreSQL..."
  for i in {1..30}; do
    if pg_isready -h postgres -U ${POSTGRES_USER:-pokemon} > /dev/null 2>&1; then
      echo "✓ PostgreSQL está listo"
      break
    fi
    echo "  Intento $i/30..."
    sleep 1
  done
fi

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
npx ts-node scripts/migration/migrate.ts

echo "✓ Migraciones completadas"
echo "🎉 Backend listo"

# Continuar con el comando
exec "$@"
