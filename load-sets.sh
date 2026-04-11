#!/bin/bash

# Script para cargar sets populares en batch
# Uso: ./load-sets.sh

echo "🚀 Iniciando carga de sets populares..."
echo "Método: Pokemon TCG API sync:set por set"
echo ""

SETS=(
  "sv4pt5"      # Paldean Fates (Crown Zenith variant)
  "sv5"         # Temporal Forces
  "sv6"         # Twilight Masquerade
  "sv7"         # Stellar Crown
  "sv8"         # Surging Sparks
  "bw1"         # Black & White (clásico)
  "xy1"         # XY (clásico)
  "swsh1"       # Sword & Shield (clásico)
  "sm1"         # Sun & Moon (clásico)
  "base1"       # Base Set (el original)
)

echo "📝 Sets a cargar:"
for SET in "${SETS[@]}"; do
  echo "  - $SET"
done
echo ""

# Contador
COUNT=1
TOTAL=${#SETS[@]}

for SET in "${SETS[@]}"; do
  echo "[$COUNT/$TOTAL] 📥 Cargando set: $SET"
  docker-compose exec backend npm run sync:set -- "$SET" 2>&1 | grep -E "✓|✗|Error|Critical" | head -5
  echo ""
  
  # Mostrar progreso
  CARD_COUNT=$(docker-compose exec postgres psql -U pokemon -d pokemontcg -t -c "SELECT COUNT(*) FROM cards;")
  echo "  Cards en BD: $CARD_COUNT"
  echo ""
  
  COUNT=$((COUNT + 1))
done

echo "✅ Carga de sets completada!"
docker-compose exec postgres psql -U pokemon -d pokemontcg -c "SELECT COUNT(DISTINCT s.id) as total_sets, COUNT(c.id) as total_cards FROM sets s LEFT JOIN cards c ON s.id = c.set_id WHERE c.id IS NOT NULL;"
