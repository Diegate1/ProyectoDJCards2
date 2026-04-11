#!/bin/bash
# Script simple para sincronizar sets/cartas en japonés desde TCGdex

echo "🌐 Fetching Japanese sets from TCGdex API..."

# Obtener todos los sets en japonés
curl -s "https://api.tcgdex.net/v2/ja/sets" | \
  sqlite3 /tmp/ja_sets.db ".mode json" "CREATE TABLE IF NOT EXISTS sets (id TEXT PRIMARY KEY, name TEXT, cardCount TEXT); INSERT INTO sets VALUES (json_extract(value, '$.id'), json_extract(value, '$.name'), json_extract(value, '$.cardCount')); SELECT * FROM sets LIMIT 5;"

echo "✓ Fetched sets"

# Obtener cartas del primer set
curl -s "https://api.tcgdex.net/v2/ja/sets/PMCG1" > /tmp/first_set.json

echo "✓ Sample response saved to /tmp/first_set.json"

# Mostrar estructura
echo ""
echo "📊 First set structure:"
cat /tmp/first_set.json | grep -o '"[^"]*":[^,}]*' | head -20
