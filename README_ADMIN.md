# Admin Dashboard - Documentación

## Endpoints Disponibles

### 🔍 Debug - Ver datos sin guardar

Estos endpoints obtienen datos en bruto de las APIs sin guardar nada en BD.

#### Pokémon TCG API

```bash
# Ver todos los sets (paginado)
curl "http://localhost:3000/admin/api-debug/pokemontcg/sets?page=1&pageSize=50"

# Ver cartas de un set específico
curl "http://localhost:3000/admin/api-debug/pokemontcg/cards?setId=sv1&page=1&pageSize=50"
```

#### TCGdex

```bash
# Ver sets en inglés
curl "http://localhost:3000/admin/api-debug/tcgdex/sets?lang=en"

# Ver sets en español
curl "http://localhost:3000/admin/api-debug/tcgdex/sets?lang=es"

# Ver sets en japonés
curl "http://localhost:3000/admin/api-debug/tcgdex/sets?lang=ja"
```

#### TCGCSV / TCGplayer

```bash
# Ver todos los grupos (sets comerciales)
curl "http://localhost:3000/admin/api-debug/tcgcsv/groups"
```

---

### 💾 Sync - Guardar datos en BD

Estos endpoints realmente guardan los datos en la base de datos.

#### Sincronizar Sets

```bash
# Sincronizar todos los sets (única vez completa, luego incremental)
curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"

# Respuesta esperada
{
  "status": "completed",
  "synced": 123,
  "errors": []
}
```

#### Sincronizar Cartas

```bash
# Sincronizar cartas de un set específico
curl -X POST "http://localhost:3000/admin/sync/cards/sv1"

# Sincronizar cartas de TODOS los sets
curl -X POST "http://localhost:3000/admin/sync/cards"

# Respuesta esperada
{
  "status": "completed",
  "setId": "sv1",
  "synced": 215,
  "errors": []
}
```

#### Sincronizar Productos

```bash
# Sincronizar productos de un grupo específico
curl -X POST "http://localhost:3000/admin/sync/products/3170"

# Sincronizar productos de TODOS los grupos
curl -X POST "http://localhost:3000/admin/sync/products"

# Respuesta esperada
{
  "status": "completed",
  "groupId": 3170,
  "synced": 524,
  "errors": []
}
```

---

### 📊 Logs y Status

#### Ver Logs de APIs

```bash
# Ver últimos 100 logs de todas las providers
curl "http://localhost:3000/admin/logs"

# Ver últimos 50 logs de Pokémon TCG API
curl "http://localhost:3000/admin/logs?provider=pokemontcg&limit=50"

# Ver logs de TCGdex
curl "http://localhost:3000/admin/logs?provider=tcgdex&limit=100"

# Ver logs de TCGCSV
curl "http://localhost:3000/admin/logs?provider=tcgcsv&limit=100"

# Respuesta esperada
{
  "logs": [
    {
      "id": 1,
      "provider": "pokemontcg",
      "method": "GET",
      "url": "https://api.pokemontcg.io/v2/sets?page=1&pageSize=50",
      "status_code": 200,
      "duration_ms": 421,
      "created_at": "2026-04-09T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

#### Ver Status de BD

```bash
curl "http://localhost:3000/admin/status/db"

# Respuesta esperada
{
  "sets": 123,
  "cards": 45821,
  "products": 12450
}
```

---

## Flujo Recomendado

### Primera Sincronización (Completa)

1. **Verificar conexión a BD:**
   ```bash
   curl "http://localhost:3000/admin/status/db"
   ```
   Debería leer sets=0, cards=0, products=0

2. **Sincronizar todos los sets:**
   ```bash
   curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"
   ```
   ✓ Esto tarda ~30 segundos y sincroniza ~200+ sets

3. **Sincronizar todas las cartas:**
   ```bash
   curl -X POST "http://localhost:3000/admin/sync/cards"
   ```
   ⚠️ Esto tarda horas (depende de rate limits y # de sets)
   Alternativo: sincronizar set por set
   ```bash
   curl -X POST "http://localhost:3000/admin/sync/cards/sv1"
   curl -X POST "http://localhost:3000/admin/sync/cards/sv2"
   ```

4. **Sincronizar productos:**
   ```bash
   curl -X POST "http://localhost:3000/admin/sync/products"
   ```
   ⚠️ Tarda bastante. Alternativo: por grupo
   ```bash
   curl -X POST "http://localhost:3000/admin/sync/products/3170"
   ```

5. **Verificar resultado:**
   ```bash
   curl "http://localhost:3000/admin/status/db"
   ```

### Re-sincronización (Incremental)

Una vez completada la sincronización inicial:

```bash
# Solo re-run esto si quieres actualizar datos
curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"
# Será más rápido porque hace upserts inteligentes
```

---

## Scripts de Terminal

### Sincronización Completa (recomendado para primera vez)

```bash
npm run migrate    # Crear tablas si no existen
npm run sync:full  # Sincronizar todo en orden: sets → cartas → productos
```

### Sincronizar Solo Un Set

```bash
npm run sync:set sv1    # Sincronizar set "sv1" con todas sus cartas
npm run sync:set sv2
```

---

## Troubleshooting

### Error: "Set XYZ not found"

**Causa**: Las cartas necesitan que el set esté sincronizado primero.

**Solución**:
```bash
curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"
# Luego intentar sincronizar cartas de nuevo
```

### Error: "Connection refused"

**Causa**: PostgreSQL no está corriendo.

**Solución**:
```bash
npm run db:up
npm run migrate
```

### Error: Timeout en sync de cartas

**Causa**: Rate limiting de API.

**Solución**: Las peticiones están configuradas con reintentos. Si sigue failing:
- Agregar API key en `.env` (aumenta límite de 1K a 20K requests/día)
- Hacer sync por set individual en lugar de completo

### BD llena / quiero empezar de cero

```bash
npm run db:reset   # Dropping BD por completo
npm run migrate    # Recrear tablas
npm run sync:full  # Re-sincronizar todo
```

---

## Monitoreo

### Ver logs en tiempo real

```bash
curl "http://localhost:3000/admin/logs?limit=200" | jq '.logs[] | "\(.created_at) - \(.provider) - \(.status_code)"'
```

### Contar datos por tipo

```bash
# Sets
curl "http://localhost:3000/admin/status/db" | jq '.sets'

# Cartas
curl "http://localhost:3000/admin/status/db" | jq '.cards'

# Productos
curl "http://localhost:3000/admin/status/db" | jq '.products'
```

---

## Notas Importantes

- 🔐 La API key de Pokémon TCG (si la tienes) aumenta límites
- ⏱️ Sin API key: 30 req/min, 1000/día
- 💾 Raw JSON siempre se guarda para auditoría
- 🔄 Los upserts son idempotentes (seguro ejecutar 2 veces)
- 📊 Los precios guardan histórico con timestamp
