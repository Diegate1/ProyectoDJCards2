# 🔄 Métodos de Sincronización de Datos

**Proyecto:** ProyectoDJCards2  
**Última actualización:** Abril 11, 2026  
**Stack:** NestJS/Express + PostgreSQL + Docker

---

## 📋 Resumen Ejecutivo

Este documento describe los **3 métodos principales de sincronización** de datos de Pokémon TCG en diferentes idiomas: **INGLÉS**, **JAPONÉS** y **CHINO**.

Cada método consume datos de diferentes APIs, procesa la información y la almacena en la base de datos PostgreSQL centralizada.

| Método | Idioma | Fuentes API | Script Principal | Estado |
|--------|--------|-------------|------------------|--------|
| **Sync English** | 🇬🇧 English | Pokemon TCG API + TCGdex | `sync-tcgdex.ts` | ✅ Active |
| **Sync Japanese** | 🇯🇵 Japanese | TCGTracking + TCGdex | `sync-tcgtracking-*.ts` | ✅ Active |
| **Sync Chinese** | 🇨🇳 Simplified Chinese | TCGdex | `sync-tcgdex-chinese-v2.ts` | ✅ Active |
| **Full Sync** | 🌍 All Languages | Todas las anteriores | `full-sync.ts` | ✅ Orchestrated |

---

## 🔄 Sincronización en Detalle

### ✨ MÉTODO 1: ENGLISH SYNC (Inglés)

**Comando CLI:**
```bash
# Sync solo sets y cartas en inglés
npm run sync:english

# O ejecutar directamente:
ts-node scripts/sync-tcgdex.ts en
```

**Fuentes API:**
- **Primary:** Pokemon TCG API (`api.pokemontcg.io`)
  - Endpoint: `/v2/sets` y `/v2/sets/{id/cards`
  - Autorización: Sin requerimientos
  - Rate Limit: 120 requests/minuto

- **Secondary:** TCGdex API (`api.tcgdex.net`)
  - Endpoint: `/v1/sets?lang=en`
  - Datos: Información enriquecida, imágenes, rareza
  - Rate Limit: No especificado

**Flujo de Datos:**
```
Pokemon TCG API
    ↓
[Fetch Sets]
    ↓
[Process Each Set]
    ├─→ TCGdex EN (enriquecimiento)
    ├─→ Download images
    └─→ Store in PostgreSQL
    ↓
[Fetch Cards]
    ├─→ Parse card data
    ├─→ TCGdex EN mapping
    └─→ Store in PostgreSQL
    ↓
✅ Base de datos actualizada (English)
```

**Datos Almacenados:**
- Sets table: `id`, `name`, `series`, `total`, `official_url`, `images` (en)
- Cards table: `id`, `name`, `hp`, `type`, `rarity`, `description` (en)
- External References: `pokemon_tcg_id`, `tcgdex_id`

**Ejemplo de Ejecución:**
```bash
# Terminal
$ npm run sync:english

> ProyectoDJCards2@1.0.0 sync:english
> ts-node scripts/sync-tcgdex.ts en

✅ Starting TCGdex sync for language: en
📥 Fetching sets from Pokemon TCG API...
📊 Found 50 sets
⏳ Processing set sv1pt5 - Scarlet & Violet: Paldea's Peril...
📸 Downloading images...
💾 Storing in database...
✅ English sync completed! 50 sets, 5000+ cards
```

**Tiempo Estimado:** 2-5 minutos (depend de internet)  
**Storage:** ~50 MB JSON

---

### 🇯🇵 MÉTODO 2: JAPANESE SYNC (Japonés)

**Comando CLI:**
```bash
# Ejecutar Japanese sync completo
npm run sync:japanese

# O ejecutar componentes por separado:
npm run sync:tcgtracking:sets    # Solo sets
npm run sync:tcgtracking:cards   # Solo cartas
```

**Fuentes API:**
- **Primary:** TCGTracking API (`tcgtracking.com/tcgapi/v1`)
  - Endpoint: `/sets` (filtro country=JP)
  - Datos: Conjuntos japoneses exclusivos
  - Rate Limit: No especificado

- **Secondary:** TCGdex API (`api.tcgdex.net`)
  - Endpoint: `/v1/sets?lang=ja`
  - Datos: Traducciones y enriquecimiento en japonés
  - Rate Limit: No especificado

**Flujo de Datos:**
```
TCGTracking API
    ↓
[Fetch Japanese Sets]
    ├─→ Filter: country=JP
    ├─→ Extract: name_ja, release_date, series_ja
    └─→ Store in PostgreSQL
    ↓
[Fetch Japanese Cards]
    ├─→ For each set:
    ├─── TCGTracking cards endpoint
    ├─── Parse: name_ja, hp, type_ja, rarity_ja
    └─── Store in PostgreSQL
    ↓
[Enrich with TCGdex]
    ├─→ Match sets by ID
    ├─→ Add: translations, images, descriptions_ja
    └─→ Update PostgreSQL
    ↓
✅ Base de datos actualizada (Japanese)
```

**Datos Almacenados:**
- Sets table: `id`, `name_ja`, `series_ja`, `release_date`, `tcgtracking_id`
- Cards table: `id`, `name_ja`, `hp`, `type_ja`, `rarity_ja`, `description_ja`
- Pricing: `market_price_jpy`, `last_updated` (desde TCGTracking)

**Caracteres Adicionales:**
- 🔤 Soporte completo para kanji, hiragana y katakana
- 📍 Mapping automático de IDs entre Pokemon TCG ↔ TCGTracking

**Ejemplo de Ejecución:**
```bash
$ npm run sync:japanese

> ProyectoDJCards2@1.0.0 sync:japanese
> ts-node scripts/sync-tcgtracking-sets.ts && ts-node scripts/sync-tcgtracking-cards.ts

✅ Starting TCGTracking Japanese sync...
📥 Fetching Japanese sets from TCGTracking...
📊 Found 15 Japanese exclusive sets
💾 Storing sets in database...

📥 Fetching Japanese cards...
📊 Found 2,340 Japanese cards
⏳ Processing batches (500 cards at a time)...
💾 Storing cards in database...

✅ Japanese sync completed! 15 sets, 2,340 cards
```

**Tiempo Estimado:** 3-8 minutos  
**Storage:** ~30 MB JSON

---

### 🇨🇳 MÉTODO 3: CHINESE SYNC (Chino Simplificado)

**Comando CLI:**
```bash
# Ejecutar Chinese sync
npm run sync:chinese

# O ejecutar directamente:
ts-node scripts/sync-tcgdex-chinese-v2.ts
```

**Fuentes API:**
- **Primary & Only:** TCGdex API (`api.tcgdex.net`)
  - Endpoint: `/v1/sets?lang=zh` (Simplified Chinese)
  - Datos: Conjuntos y cartas en chino simplificado
  - Rate Limit: No especificado
  - Coverage: ~50 sets, ~829 cartas totales

**Flujo de Datos:**
```
TCGdex API (lang=zh)
    ↓
[Fetch Chinese Sets]
    ├─→ language parameter: zh
    ├─→ Extract: name_zh, description_zh, images
    └─→ Store in PostgreSQL
    ↓
[Fetch Chinese Cards]
    ├─→ For each set:
    ├─── Fetch cards endpoint
    ├─── Parse: name_zh, type_zh, rarity_zh
    └─── Store in PostgreSQL
    ↓
[v2 Improvements]
    ├─→ Batch processing (1000+ requests)
    ├─→ Automatic retry on failure
    ├─→ Better error handling
    ├─→ Rate limiting compliance
    └─→ Transaction support
    ↓
✅ Base de datos actualizada (Chinese)
```

**Datos Almacenados:**
- Sets table: `id`, `name_zh`, `series_zh`, `images_zh`, `tcgdex_id_zh`
- Cards table: `id`, `name_zh`, `type_zh`, `hp`, `rarity_zh`, `description_zh`
- Metadata: `sync_date`, `total_cards`, `language_code='zh'`

**Características de v2:**
- ✅ Better retry logic (exponential backoff)
- ✅ Transaction-based inserts
- ✅ Progress tracking con timestamps
- ✅ Duplicate prevention
- ✅ Rate limit aware (delays entre requests)

**Ejemplo de Ejecución:**
```bash
$ npm run sync:chinese

> ProyectoDJCards2@1.0.0 sync:chinese
> ts-node scripts/sync-tcgdex-chinese-v2.ts

✅ Starting TCGdex Chinese (ZH) sync - v2...
📥 Fetching Chinese sets from TCGdex...
📊 Found 50 sets in Simplified Chinese
⏳ Processing with batch optimization...

📥 Processing sets with card data...
📊 Found 829 Chinese cards
💾 Storing with transaction support...
✅ Retry logic: 2 retries needed, all successful

✅ Chinese sync completed! 50 sets, 829 cards
⏱️ Time: 2.5 minutes
```

**Tiempo Estimado:** 2-4 minutos  
**Storage:** ~15 MB JSON  
**Limitación Actual:** Solo 829 cartas disponibles en TCGdex ZH

---

### 🔄 MÉTODO 4 (BONUS): FULL SYNC - Sincronización Orquestada

**Comando CLI:**
```bash
# Ejecutar sincronización completa de todas las fuentes
npm run sync:full
```

**Descripción:**
Script maestro que ejecuta todos los métodos de sincronización en el orden correcto:
1. **English** (establece baseline)
2. **Japanese** (agrega datos exclusivos JP)
3. **Chinese** (agrega datos exclusivos ZH)

**Flujo Orquestado:**
```
[START Full Sync]
    ↓
├─→ ENGLISH SYNC
│   ├─→ Pokemon TCG API
│   ├─→ TCGdex EN
│   └─→ ✅ Base sets + English data
│
├─→ JAPANESE SYNC
│   ├─→ TCGTracking
│   ├─→ TCGdex JA
│   └─→ ✅ Japanese exclusive sets + pricing
│
├─→ CHINESE SYNC
│   ├─→ TCGdex ZH
│   └─→ ✅ Chinese simplified content
│
└─→ [POST-SYNC]
    ├─→ Validate data integrity
    ├─→ Check for orphaned records
    ├─→ Generate sync report
    └─→ ✅ Complete!
```

**Ejemplo de Ejecución:**
```bash
$ npm run sync:full

> ProyectoDJCards2@1.0.0 sync:full
> ts-node scripts/full-sync.ts

🚀 Starting FULL synchronization...
⏱️ [1/3] English Sync...
    ✅ 50 sets | 5000 cards | Time: 4m 32s

⏱️ [2/3] Japanese Sync...
    ✅ 15 sets (exclusive) | 2,340 cards | Time: 5m 18s

⏱️ [3/3] Chinese Sync...
    ✅ 50 sets | 829 cards | Time: 2m 45s

📊 SYNC REPORT:
    Total Sets: 115+ (with overlaps)
    Total Cards: 8,169+
    Languages: 3 (EN, JA, ZH)
    Duration: 12m 35s
    Status: ✅ SUCCESS

✨ Database is now fully populated with all 3 languages!
```

**Tiempo Estimado:** 12-15 minutos  
**Cuándo Usar:** 
- Setup inicial del proyecto
- Refresco completo de datos
- Después de actualizaciones mayores

---

## 🔗 MAPEO DE DATOS ENTRE IDIOMAS

### Estructura de Tablas (Multi-idioma)

```sql
-- Tabla canonical: SETS
CREATE TABLE sets (
  id UUID PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ja TEXT,
  name_zh TEXT,
  series_en TEXT,
  series_ja TEXT,
  series_zh TEXT,
  release_date DATE,
  total INT,
  images_en JSONB,
  images_ja JSONB,
  images_zh JSONB
);

-- Tabla de referencias externas
CREATE TABLE external_references (
  id UUID PRIMARY KEY,
  set_id UUID REFERENCES sets(id),
  pokemon_tcg_id TEXT UNIQUE,
  tcgdex_id_en TEXT,
  tcgdex_id_ja TEXT,
  tcgdex_id_zh TEXT,
  tcgtracking_id TEXT
);

-- Tabla: CARDS
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  set_id UUID REFERENCES sets(id),
  name_en TEXT NOT NULL,
  name_ja TEXT,
  name_zh TEXT,
  hp INT,
  type_en TEXT,
  type_ja TEXT,
  type_zh TEXT,
  rarity_en TEXT,
  rarity_ja TEXT,
  rarity_zh TEXT,
  description_en TEXT,
  description_ja TEXT,
  description_zh TEXT
);
```

### Ejemplo: Single Card (3 idiomas)

```json
{
  "id": "825e7f0a-9e1e-4a8e-8b7d-2c4e6f1a3d9b",
  "name": {
    "en": "Pikachu",
    "ja": "ピカチュウ",
    "zh": "皮卡丘"
  },
  "type": {
    "en": "Electric",
    "ja": "電気",
    "zh": "电系"
  },
  "rarity": {
    "en": "Common",
    "ja": "一般",
    "zh": "普通"
  },
  "hp": 40,
  "images": {
    "en": "https://images.pokemontcg.io/...",
    "ja": "https://...",
    "zh": "https://..."
  }
}
```

---

## ⏸️ CONSIDERACIONES Y LIMITACIONES

### Inglés
- ✅ Coverage: 100% de sets officiales
- ✅ Cobertura: 5000+ cards
- ⚠️ Requiere Pokemon TCG API key (opcional)

### Japonés  
- ✅ Coverage: ~15 sets exclusivos JP
- ✅ Pricing data desde TCGTracking
- ⚠️ Limitado a datos en tcgtracking.com
- ⚠️ Actualización frecuente recomendada (cada 2 semanas)

### Chino
- ✅ Coverage: 50 sets
- ⚠️ **Limitación:** Solo 829 cartas en TCGdex ZH (v2 está optimizado)
- ⚠️ Algunos sets pueden no tener completa cobertura de cartas

---

## 🚀 CASOS DE USO

| Escenario | Comando | Frecuencia | Notas |
|-----------|---------|-----------|-------|
| Setup inicial | `npm run sync:full` | Una vez | Llena base de datos completamente |
| Actualizaciones regulares | `npm run sync:english` | Semanal | Datos más frescos |
| Agregar sets JP | `npm run sync:japanese` | Mensual | Exclusivos de JP |
| Agregar sets ZH | `npm run sync:chinese` | Trimestral | Cobertura limitada |
| Refresco completo | `npm run sync:full` | Mensual | Todas las fuentes |

---

## 🔧 ENVIRONMENT VARIABLES

Los scripts respetan estas variables de entorno:

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/pokemontcg

# Rate limiting
SYNC_BATCH_SIZE=100         # Cartas por batch
SYNC_RETRY_ATTEMPTS=3       # Reintentos en error
SYNC_TIMEOUT_MS=30000       # Timeout por request

# TCG API keys (opcional)
POKEMON_TCG_API_KEY=        # Si requerido en futuro
TCGDEX_API_URL=https://api.tcgdex.net/v1
TCGTRACKING_API_URL=https://tcgtracking.com/tcgapi/v1

# Logging
LOG_LEVEL=info              # debug, info, warn, error
SYNC_VERBOSE=true           # Salida detallada
```

---

## 📊 DATA INTEGRITY & VALIDATION

Cada sync realiza validaciones:

```typescript
// Ejemplo de validaciones (en código)
✅ Duplicate check (no inserts duplicados)
✅ Reference integrity (foreign keys válidas)
✅ Data type validation (tipos correctos)
✅ Image URL validation (URLs accesibles)
✅ Language code validation (iso-639-1 codes)
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Connection refused" en PostgreSQL
```bash
# Solución: Verificar que DB container está corriendo
docker ps | grep postgres
npm run db:up
```

### Problema: Rate limit hit (429 errors)
```bash
# Solución: Aumentar delays entre requests
SYNC_BATCH_SIZE=10 SYNC_RETRY_ATTEMPTS=5 npm run sync:english
```

### Problema: Partial Chinese sync (solo X de 829 cartas)
```bash
# Solución: Usar v2 con retry mejorado
npm run sync:chinese  # Ya usa v2
```

---

## 📝 CHANGELOG

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 2.0 | Abr 2026 | Chinese v2: better retry + batching |
| 1.5 | Mar 2026 | Full sync orchestration |
| 1.0 | Ene 2026 | Initial 3 sync methods |

---

**Para más detalles técnicos:** Revisar código en `/scripts/sync-*.ts`  
**Para API docs:** Revisar `/README_ADMIN.md`  
**Para deployment:** Revisar `/DEPLOYMENT_RENDER.md`
