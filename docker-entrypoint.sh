#!/bin/bash
set -eux

echo "════════════════════════════════════════════════════════"
echo "🚀 INICIANDO BACKEND - RENDER ENTRYPOINT"
echo "════════════════════════════════════════════════════════"
echo ""

# Debug: Variables de entorno
echo "📋 VARIABLES DE ENTORNO:"
echo "   NODE_ENV: ${NODE_ENV:-undefined}"
echo "   PORT: ${PORT:-undefined}"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}... (truncado)"
echo "   SKIP_MIGRATIONS: ${SKIP_MIGRATIONS:-false}"
echo ""

# Detector de modo
if [ -n "${DATABASE_URL:-}" ]; then
  echo "✓ Modo RENDER detectado (DATABASE_URL configurada)"
  MODE="render"
else
  echo "✓ Modo DOCKER COMPOSE detectado"
  MODE="compose"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "⏳ ESPERA A POSTGRESQL"
echo "════════════════════════════════════════════════════════"
echo ""

if [ "$MODE" = "render" ]; then
  echo "🔍 Parseando DATABASE_URL..."
  
  # Extraer componentes de la URL: postgresql://user:pass@host:port/db
  # Format: postgresql://USERNAME:PASSWORD@HOSTNAME:PORT/DATABASE
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
  DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\).*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\):.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  echo "   User: $DB_USER"
  echo "   Host: $DB_HOST"
  echo "   Port: $DB_PORT"
  echo "   Database: $DB_NAME"
  echo ""
  
  # Esperar a que PostgreSQL esté listo
  DB_READY=0
  for i in {1..30}; do
    echo "   Intento $i/30..."
    if pg_isready -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" > /dev/null 2>&1; then
      echo "✓ PostgreSQL LISTO"
      DB_READY=1
      break
    fi
    sleep 2
  done
  
  if [ $DB_READY -eq 0 ]; then
    echo "❌ PostgreSQL NO ACCESIBLE después de 30 intentos"
    echo "   Continuando de todas formas (esperando que se conecte después)..."
  fi
else
  echo "🔍 Esperando postgres (Docker Compose)..."
  for i in {1..30}; do
    echo "   Intento $i/30..."
    if pg_isready -h postgres -U ${POSTGRES_USER:-pokemon} -p 5432 > /dev/null 2>&1; then
      echo "✓ PostgreSQL LISTO"
      break
    fi
    sleep 2
  done
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "🔄 MIGRACIONES DE BASE DE DATOS"
echo "════════════════════════════════════════════════════════"
echo ""

# Opción de skip migraciones para debugging
if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "⏭️  SKIP_MIGRATIONS=true, saltando migraciones"
else
  echo "Ejecutando migraciones..."
  
  # Mostrar comando que se va a ejecutar
  echo "  Comando: npx ts-node scripts/migration/migrate.ts"
  echo ""
  
  # Ejecutar con manejo de errores
  if npx ts-node scripts/migration/migrate.ts; then
    echo ""
    echo "✓ Migraciones COMPLETADAS EXITOSAMENTE"
  else
    MIGRATION_EXIT_CODE=$?
    echo ""
    echo "❌ Migraciones FALLARON (exit code: $MIGRATION_EXIT_CODE)"
    echo "⚠️  Continuando de todas formas para permitir debugging..."
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 INICIALIZACION COMPLETADA"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📌 Iniciando servidor con comando: $@"
echo "   Escuchando en puerto: ${PORT:-3000}"
echo "   Host: 0.0.0.0"
echo ""

# El contenedor seguirá vivo mientras el servidor esté corriendo
exec "$@"
