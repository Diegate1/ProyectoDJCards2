# 📋 ProyectoDJCards2 - Comprehensive Codebase Map

**Project:** Pokémon TCG Data Ingestion System  
**Date:** April 11, 2026  
**Stack:** NestJS/Express Backend + React/Vite Frontend + PostgreSQL

---

## 🎯 Project Overview

A Pokemon Trading Card Game data aggregation system that ingests data from **3 different APIs** into a centralized PostgreSQL database:

1. **Pokémon TCG API** (`api.pokemontcg.io`) - Official sets & playable cards
2. **TCGdex** (`api.tcgdex.net`) - Multi-language enrichment (EN, JA, ZH, FR, ES, etc.)
3. **TCGTracking** (`tcgtracking.com/tcgapi/v1`) - Japanese sets & pricing
4. **TCGCSV** (tcgcsv.com) - Sealed products & marketplace prices

Frontend dashboard for browsing sets, cards, and viewing details. Docker-based deployment.

---

## 📁 Directory Structure

```
ProyectoDJCards2/
├── src/                          # Backend (NestJS-style Express app)
│   ├── main.ts                   # Express app entry point
│   ├── common/
│   │   ├── types.ts              # Shared TypeScript interfaces (DTOs)
│   │   ├── utils.ts              # Common utility functions
│   │   └── api-log.service.ts    # API logging service
│   ├── db/
│   │   ├── database.ts           # PostgreSQL connection pool
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql    # Base tables (sets, cards, etc)
│   │       └── 002_add_language_support.sql # Multi-language support
│   └── modules/
│       ├── admin/                # Debug/sync endpoints
│       ├── data/                 # Public API endpoints (frontend)
│       ├── pokemon-tcg/          # Pokemon TCG API client
│       ├── tcgdex/               # TCGdex multilingual client
│       ├── tcgtracking/          # TCGTracking API client
│       ├── sync/                 # Sync service classes
│       ├── scraper/              # Web scraping utilities
│       └── tcgcsv/               # TCGCSV API client
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx               # Main routing component
│   │   ├── main.tsx              # React entry point
│   │   ├── types.ts              # Frontend TypeScript interfaces
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client service
│   │   └── utils/                # Frontend utilities
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.ts            # Vite build config
│   ├── Dockerfile                # Frontend container
│   └── index.html                # HTML entry point
├── scripts/                      # Data sync & migration scripts (CLI)
│   ├── sync-*.ts                 # Sync scripts (multiple versions)
│   ├── full-sync.ts              # Complete data synchronization
│   ├── migrate.ts                # Run database migrations
│   └── [other utility scripts]
├── docker-compose.yml            # Orchestrates all services
├── Dockerfile                    # Backend container
├── docker-entrypoint.sh          # Startup script for backend
├── package.json                  # Backend dependencies & npm scripts
└── tsconfig.json                 # TypeScript config

**Documentation Files:**
├── README.md                     # Project overview
├── EXECUTIVE_SUMMARY.md          # High-level architecture
├── IMPLEMENTATION_SUMMARY.md     # Feature implementation details
├── DOCKER_SETUP.md               # Docker configuration guide
├── SYNC_STRATEGY.md              # Data sync strategy
├── QUICKSTART.md                 # Quick start guide
└── [various other docs]
```

---

## 🔄 SYNC-RELATED FILES & PURPOSE

### Core Sync Scripts (in `/scripts`)

| File | Purpose | Used By | Status |
|------|---------|---------|--------|
| **sync-set.ts** | Single set sync from Pokemon TCG API (by set ID) | CLI: `npm run sync:set {id}` | ✅ Primary |
| **sync-tcgdex.ts** | TCGdex multi-language sync (EN, JA, FR, ES, etc) | CLI: `npm run sync:tcgdex [lang]` | ✅ Active |
| **sync-tcgdex-chinese-sets.ts** | Sync Chinese (简体) sets from TCGdex | CLI: `npm run sync:tcgdex:zh:sets` | ✅ Active |
| **sync-tcgdex-chinese-cards.ts** | Sync Chinese cards from TCGdex (limited: 829 total) | CLI: `npm run sync:tcgdex:zh:cards` | ✅ Active |
| **sync-tcgdex-chinese-v2.ts** | Alternative Chinese sync implementation | CLI: `npm run sync:tcgdex:zh:v2` | 🟡 Alternative |
| **sync-tcgtracking-sets.ts** | Sync Japanese sets from TCGTracking API | CLI: `npm run sync:tcgtracking:sets` | ✅ Active |
| **sync-tcgtracking-cards.ts** | Sync Japanese cards from TCGTracking API | CLI: `npm run sync:tcgtracking:cards` | ✅ Active |
| **sync-japanese-tcgdex.ts** | TCGdex Japanese sets & cards comprehensive sync | (Deprecated, use sync-tcgdex.ts) | ⚠️ Legacy |
| **sync-japanese-sets-manual.ts** | Manual Japanese set insertion from SQL | (Deprecated) | ⚠️ Legacy |
| **sync-single-set.ts** | Debug script for single TCGTracking set (M4: Ninja Spinner) | Testing only | 🔴 Debug |
| **full-sync.ts** | Complete orchestrated sync (sets → cards → products) | CLI: `npm run sync:full` | ✅ Integrated |

### Data Manipulation Scripts

| File | Purpose |
|------|---------|
| **migrate.ts** | Run database migrations (001, 002) |
| **fix-corrupted-refs.ts** | Fix broken external references in DB |
| **update-tcgtracking-images.ts** | Download/update card images from TCGTracking |
| **update-tcgtracking-logos-v2.ts** | Smart logo selection (Official Collection > Booster > Trainer) |
| **check-card-sync-status.ts** | Verify sync completeness |
| **check-***.ts** | Various DEBUG: check logos, external refs, images |

### Deprecated/Debug Scripts

- **load-m2a-complete.ts** - Legacy M2A booster load
- **load-m2a-manual.ts** - Manual M2A load (deprecated)
- **investigate-chinese-*.ts** - Debug scripts for Chinese data issues
- **debug-tcgtracking-api.ts** - TCGTracking API debugging
- **research-logo-sources.ts** - Logo research (debug)
- **scrape-m2a-tcgcollector.ts** - Web scraping utility

### Backend Sync Services (in `src/modules/sync/`)

| File | Implements | Called By |
|------|-----------|-----------|
| **tcgdex-sync.service.ts** | `TCGdexSyncService` - Multilang sync | sync-tcgdex.ts |
| **tcgdex-chinese-set-sync.service.ts** | `TCGdexChineseSetSyncService` - Chinese sets | sync-tcgdex-chinese-sets.ts |
| **tcgdex-chinese-card-sync.service.ts** | `TCGdexChineseCardSyncService` - Chinese cards (829 limit) | sync-tcgdex-chinese-cards.ts |
| **tcgtracking-set-sync.service.ts** | `TCGTrackingSetSyncService` - Japanese sets | sync-tcgtracking-sets.ts |
| **tcgtracking-card-sync.service.ts** | `TCGTrackingCardSyncService` - Japanese cards | sync-tcgtracking-cards.ts |
| **set-sync.service.ts** | `SetSyncService` - Pokemon TCG sets | full-sync.ts |
| **card-sync.service.ts** | `CardSyncService` - All set cards | full-sync.ts |
| **product-sync.service.ts** | `ProductSyncService` - Sealed products | full-sync.ts |

### Sync Flow Diagram

```
Pokemon TCG API → SetSyncService → full-sync.ts
                ↓
              SETS DB
                ↓
          CardSyncService
                ↓
    CARDS + CARD_EXTERNAL_REFS
                
TCGdex API → TCGdexSyncService → sync-tcgdex.ts {lang}
           ↓
    Multi-language SETS + CARDS

TCGTracking API → TCGTrackingSetSyncService → sync-tcgtracking-sets.ts
               → TCGTrackingCardSyncService → sync-tcgtracking-cards.ts
                ↓
            Japanese SETS + CARDS + PRICES

TCGCSV / TCGPlayer → ProductSyncService → full-sync.ts
                  ↓
              PRODUCTS + PRODUCT_PRICES
```

---

## 🌐 MAIN ENTRY POINTS & API ROUTES

### Backend Entry Point: `src/main.ts`

```typescript
// Express app with JSON middleware
// Routes:
//   /admin/* - Debug & sync endpoints
//   /api/*   - Public data endpoints
//   /health  - Health check
```

### Route Structure

#### **Public API Routes** (`src/modules/data/data.routes.ts`)

Used by frontend dashboard:

```http
GET /api/sets                      # Paginated set list (20/page)
  ?page=1&pageSize=20
  → PaginatedResponse<SetDto>

GET /api/sets/search               # Search sets by name
  ?name=string&page=1&pageSize=20
  → PaginatedResponse<SetDto>

GET /api/cards                     # Paginated card list (with optional set filter)
  ?page=1&pageSize=20&setId={uuid}
  → PaginatedResponse<CardDto>

GET /api/cards/search              # Search cards by name/number
  ?name=string&page=1&pageSize=20&setId={uuid}
  → PaginatedResponse<CardDto>

GET /api/cards/:cardId             # Full card detail with attacks/abilities/prices
  → CardDetailDto

GET /api/sets/:setId/cards         # Legacy: cards by set
  ?page=1&pageSize=20
  → PaginatedResponse<CardDto>

GET /api/prices/card               # Legacy: price history
  ?cardId=uuid
  → [PriceHistory]

GET /api/products/sealed           # Sealed items (boxes, tins)
  → [SealedProductDto]

GET /api/stats                     # General statistics
  → { totalSets, totalCards, totalProducts }
```

#### **Admin/Debug Routes** (`src/modules/admin/admin.routes.ts`)

For manual debugging and sync:

```http
GET /admin/api-debug/pokemontcg/sets    # Raw Pokemon TCG API data
GET /admin/api-debug/pokemontcg/cards   # Raw Pokemon TCG cards
GET /admin/api-debug/tcgdex/sets        # Raw TCGdex data
GET /admin/api-debug/tcgcsv/groups      # Raw TCGCSV groups

POST /admin/sync/sets/pokemontcg        # Trigger Pokemon TCG set sync
POST /admin/sync/cards/:setId           # Sync cards for specific set
POST /admin/sync/cards                  # Sync all cards

GET /admin/logs                         # API call logs
GET /admin/status/db                    # Database status
```

---

## 🗄️ DATABASE STRUCTURE & MODELS

### Core Schema: `src/db/migrations/001_initial_schema.sql`

**Canonical Tables (Single Source of Truth):**

```sql
sources (3 rows)
├── id, code, name
├── Records: pokemontcg, tcgdex, tcgcsv

sets (~250 rows)
├── id (UUID), canonical_code, name, series, release_date
├── printed_total, total, symbol_image_url, logo_image_url
├── language, metadata (JSONB)

cards (~100K rows)
├── id (UUID), set_id (FK), canonical_card_code
├── number, name, supertype, rarity, artist, hp
├── flavor_text, image_small_url, image_large_url
├── metadata (JSONB)

card_attacks (attack list per card)
├── card_id (FK), position, name, text, damage, cost

card_abilities (ability list per card)
├── card_id (FK), name, type, text

card_weaknesses / card_resistances
├── card_id (FK), type, value
```

**Reference Tables (Maps to External APIs):**

```sql
set_external_refs (~500 rows)
├── set_id (FK), source_code, external_id, external_code
├── language, raw_json (JSONB)
├── Maps: 1 internal set → N external API representations

card_external_refs (~200K rows)
├── card_id (FK), source_code, external_id
├── raw_json (JSONB)
├── Maps: 1 card → N external API representations
```

**Product/Pricing:**

```sql
products (~100K rows)
├── product_id, source, group_id, set_id (optional)
├── name, price, quantity, rarity, language

product_prices (~500K rows)
├── product_id (FK), market, mid, low, timestamp
├── Tracks price history over time
```

**Audit:**

```sql
api_logs
├── timestamp, method, endpoint, status, response_time
├── Records every external API call
```

### Language Support: `src/db/migrations/002_add_language_support.sql`

```sql
ALTER TABLE sets ADD COLUMN language VARCHAR(10) DEFAULT 'en';
ALTER TABLE set_external_refs ADD COLUMN language VARCHAR(10) DEFAULT 'en';
-- Supports: en, ja, zh, fr, es, de, it, pt
-- Allows same set in multiple languages as separate canonical records
```

### Schema Relationships

```
sources
    ↓
sets (1) ←→ (N) set_external_refs
    ↓
cards (1) ←→ (N) card_external_refs
    ├─→ card_attacks
    ├─→ card_abilities
    ├─→ card_weaknesses
    └─→ card_resistances

products
    ↓
product_prices (historical tracking)
```

---

## 🎨 FRONTEND ARCHITECTURE

### Frontend Entry Point: `frontend/src/main.tsx`

```typescript
import App from './App.tsx'
// React 18 + React Router v6
```

### Frontend Routing: `frontend/src/App.tsx`

```
/
  ├─ /dashboard               → DashboardSetsPage
  ├─ /dashboard/cards         → CardsPage (filterable by ?setId)
  └─ /dashboard/cards/:cardId → CardDetailPage

NavBar (persistent)
├─ Logo: 🎴 DJ Cards
├─ Links: Dashboard, Catálogo
└─ Dark Mode Toggle
```

### Page Components: `frontend/src/pages/`

| File | Purpose | Features |
|------|---------|----------|
| **DashboardSetsPage.tsx** | Main dashboard - sets grid | 20/page, sorting, filter by language |
| **CardsPage.tsx** | Card listing/search | Pagination, price display, set filter |
| **CardDetailPage.tsx** | Single card detail | Attacks, abilities, weaknesses, prices |

### Services: `frontend/src/services/`

**dataService.ts** - HTTP client wrapper:
```typescript
getSets(page, pageSize)
getCards(page, pageSize, setId?)
searchCards(name, setId?, page, pageSize)
searchSets(name, page, pageSize)
getCardDetail(cardId)
getSealedProducts()
getStats()
```

Uses Axios with:
- Base URL: `/api` (proxies to localhost:3000 in dev)
- Timeout: 10 seconds
- Automatic error handling

### Frontend Types: `frontend/src/types.ts`

Mirror of backend DTOs:
```typescript
PaginatedResponse<T>
SetDto
CardDto
CardDetailDto
CardAttackDto
CardAbilityDto
CurrentPriceDto
```

### Components: `frontend/src/components/`

- **PaginationControls.tsx** - Pagination UI

### Build Config: `vite.config.ts`

```typescript
defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'  // Dev proxy
    }
  }
})
```

---

## 🐳 DOCKER CONFIGURATION

### Docker Services: `docker-compose.yml`

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **postgres** | postgres:16-alpine | 5432 | PostgreSQL database |
| **backend** | build from Dockerfile | 3000 | Express API server |
| **frontend** | build from frontend/Dockerfile | 5173 | React UI (Vite dev server) |
| **adminer** | adminer:latest | 8080 | Database GUI admin |

### Startup Flow

1. PostgreSQL starts (healthcheck: `pg_isready`)
2. Backend waits for PG healthcheck ✅
3. Backend runs migrations automatically (docker-entrypoint.sh)
4. Backend starts on :3000
5. Frontend starts on :5173
6. Adminer starts on :8080

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add postgresql-client bash
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ scripts/ ./docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts ./
RUN npm ci
COPY src/ public/ index.html ./
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

### Environment Variables

**Backend (.env):**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://pokemon:pokemon@postgres:5432/pokemontcg
POKEMON_TCG_BASE_URL=https://api.pokemontcg.io/v2
TCGDEX_BASE_URL=https://api.tcgdex.net/v2
```

**Frontend (.env):**
```
DOCKER_ENVIRONMENT=true
VITE_API_URL=http://backend:3000/api
```

---

## 🔌 API CLIENTS (Module Interfaces)

### Pokemon TCG Client: `src/modules/pokemon-tcg/pokemon-tcg.client.ts`

```typescript
class PokemonTCGClient {
  getAllSets(page, pageSize)     // Paginated sets
  getSet(setId)                  // Single set detail
  getCardsBySet(setId, page, pageSize)  // Cards by set
  getCard(cardId)                // Single card detail
}
```

**Endpoint:** https://api.pokemontcg.io/v2

### TCGdex Client: `src/modules/tcgdex/tcgdex.client.ts`

```typescript
class TCGdexClient {
  getAllSets(lang)               // Language-specific sets
  getSet(setId, lang)            // Set detail
  getAllCards(lang)              // All cards for language
  getCardsBySet(setId, lang)     // Set cards
}
```

**Endpoint:** https://api.tcgdex.net/v2/{lang}/

**Supported Languages:** en, ja, fr, es, de, it, pt, zh-cn

### TCGTracking Client: `src/modules/tcgtracking/tcgtracking.client.ts`

```typescript
class TCGTrackingClient {
  getAllSets()                   // Japanese sets
  getCardsBySet(setId)           // Set cards + prices
  getPricing(setId)              // Price history
}
```

**Endpoint:** https://tcgtracking.com/tcgapi/v1/85/

**Data:** Japanese sets with marketplace pricing

---

## 🚨 DUPLICATED & DEPRECATED CODE

### Code Duplication Issues

| Duplicate | Files | Issue | Recommendation |
|-----------|-------|-------|-----------------|
| **Chinese Sync** | `sync-tcgdex-chinese-*.ts` AND `sync-tcgdex-chinese-v2.ts` | v1 & v2 implementations coexist | **USE v2**, deprecate v1 |
| **Japanese Sync** | `sync-tcgdex.ts {ja}` AND `sync-japanese-tcgdex.ts` | TCGdex JA available in main sync script | **REMOVE** sync-japanese-tcgdex.ts |
| **Image Update** | `update-tcgtracking-images.ts` AND `update-tcgtracking-logos-v2.ts` | v1 & v2 implementations | **USE v2** (smarter selection) |
| **Logo Logos** | Multiple logo research/check scripts | `check-logos.ts`, `research-logo-sources.ts`, `debug-logo-sources.ts` | Consolidate or remove |

### Deprecated Scripts

```
⚠️ DEPRECATED - Consider Removing:
├── sync-japanese-sets-manual.ts    (Use sync-tcgdex.ts ja instead)
├── sync-japanese-tcgdex.ts         (Use sync-tcgdex.ts ja instead)
├── load-m2a-complete.ts            (M2A booster, one-time use)
├── load-m2a-manual.ts              (M2A booster, one-time use)
├── investigate-chinese-cards.ts    (Debug only)
├── investigate-chinese-sets.ts     (Debug only)
├── debug-chinese-structure.ts      (Debug only)
├── debug-logo-sources.ts           (Debug only)
├── debug-tcgtracking-api.ts        (Debug only)
└── research-logo-sources.ts        (Research only)

🔴 DEBUG ONLY - Remove After Testing:
├── sync-single-set.ts              (For M4: Ninja Spinner testing only)
├── check-card-sync-status.ts       (Debug script)
├── check-external-refs.ts          (Debug script)
├── check-set-images.ts             (Debug script)
└── [other check-*.ts]
```

### Legacy/Alternative Implementations

```
🟡 ALTERNATIVE IMPLEMENTATIONS - Choose One:

Chinese Sync:
├── sync-tcgdex-chinese-sets.ts       ← PRIMARY
├── sync-tcgdex-chinese-cards.ts      ← PRIMARY
└── sync-tcgdex-chinese-v2.ts         ← ALTERNATIVE (consolidated)

Logo Update:
├── update-tcgtracking-images.ts      ← v1 (simple)
└── update-tcgtracking-logos-v2.ts    ← v2 (smart selection) ✅ RECOMMENDED
```

---

## 📊 COMMON PATTERNS & CONVENTIONS

### Sync Service Pattern

All sync services follow this pattern:

```typescript
export class ServiceSync {
  async syncAll(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;
    
    // Fetch from API
    const items = await apiClient.getAll();
    
    // Process each item
    for (const item of items) {
      try {
        await this.upsert(item);
        synced++;
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    return { synced, errors };
  }
  
  private async upsert(item: any): Promise<void> {
    // INSERT ON CONFLICT UPDATE pattern
    const sql = `
      INSERT INTO table (...) VALUES (...)
      ON CONFLICT (...) DO UPDATE SET ...
    `;
    await database.query(sql, params);
  }
}
```

### DTO Formatting Pattern

```typescript
// Backend creates DTOs for frontend
export class DataFormatterService {
  static formatSetDto(row: any): SetDto {
    return {
      id: row.id,
      name: row.name,
      releaseDate: row.release_date,
      // ... extract metadata, format fields
    };
  }
}
```

### Frontend Data Fetching

```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  dataService.getData()
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [page]);

// Render: if (loading) show spinner, if (error) show message, else show data
```

---

## 📈 DATA FLOW OVERVIEW

### Complete Data Ingestion Pipeline

```
┌─────────────────────────────────────────────┐
│         EXTERNAL DATA SOURCES               │
├─────────────────────────────────────────────┤
│  • Pokemon TCG API (Official)               │
│  • TCGdex (Multi-language)                  │
│  • TCGTracking (Japanese + Prices)          │
│  • TCGCSV (Sealed Products)                 │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼─────────┐
        │  API CLIENTS   │
        │ (Axios + HTTP) │
        └──────┬─────────┘
               │
        ┌──────▼──────────────────┐
        │  SYNC SERVICES          │
        │ (Data transformation)   │
        └──────┬──────────────────┘
               │
        ┌──────▼────────────────────────┐
        │  DATABASE (PostgreSQL)        │
        ├───────────────────────────────┤
        │  • Canonical Tables (sets,    │
        │    cards, products)           │
        │  • External Refs (mappings)   │
        │  • Price History              │
        │  • API Logs                   │
        └──────┬───────────────────────┘
               │
        ┌──────▼────────────────────┐
        │  Express Backend          │
        │  (/api/* routes)          │
        └──────┬───────────────────┘
               │
        ┌──────▼────────────────────┐
        │  React Frontend           │
        │  (Dashboard UI)           │
        │  • Sets Dashboard         │
        │  • Cards Listing          │
        │  • Card Details + Prices  │
        └───────────────────────────┘
```

### CLI Sync Commands Flow

```
npm run sync:set {id}
  ↓
SetSyncService.syncPokemonTCGSets() → [Sets inserted]
  ↓
CardSyncService.syncAllCardsBySets() → [Cards + References inserted]

npm run sync:tcgdex {lang}
  ↓
TCGdexSyncService.syncAllTCGdexCards({lang}) → [Lang-specific sets + cards]

npm run sync:tcgtracking:sets
  ↓
TCGTrackingSetSyncService.syncTCGTrackingSets() → [Japanese sets]

npm run sync:tcgtracking:cards
  ↓
TCGTrackingCardSyncService → [Japanese cards + prices]

npm run sync:full
  ↓
SetSyncService → CardSyncService → ProductSyncService
```

---

## 🎯 FILE RELATIONSHIP DIAGRAM

### Key Dependencies

```
main.ts (Entry Point)
  ├─→ database.ts (Connection pool)
  ├─→ admin.routes.ts
  │     └─→ admin.controller.ts
  │           ├─→ [All sync services]
  │           └─→ [All API clients]
  └─→ data.routes.ts
        └─→ data.controller.ts
              ├─→ database.ts (Queries)
              └─→ data-formatter.service.ts

scripts/sync-*.ts
  ├─→ database.ts (Connection)
  └─→ /src/modules/sync/*.service.ts
        ├─→ database.ts (Queries)
        ├─→ [API clients]
        └─→ UUID generator

Frontend App.tsx
  └─→ Router (React Router v6)
        ├─→ DashboardSetsPage.tsx
        │     └─→ dataService.ts → /api/sets
        ├─→ CardsPage.tsx
        │     └─→ dataService.ts → /api/cards
        └─→ CardDetailPage.tsx
              └─→ dataService.ts → /api/cards/:id
```

---

## 📦 DEPENDENCY TREE

### Backend Dependencies

```json
{
  "runtime": {
    "@nestjs/*": "NestJS framework (docs only, using Express)",
    "express": "HTTP server",
    "axios": "HTTP client for APIs",
    "pg": "PostgreSQL driver",
    "uuid": "UUID generation",
    "dotenv": "Environment config"
  },
  "dev": {
    "typescript": "Type checking",
    "ts-node": "Run TS directly",
    "ts-loader": "Webpack loader",
    "@types/*": "Type definitions"
  }
}
```

### Frontend Dependencies

```json
{
  "runtime": {
    "react": "UI framework",
    "react-dom": "DOM rendering",
    "react-router-dom": "Routing",
    "axios": "HTTP client",
    "clsx": "CSS class utilities"
  },
  "dev": {
    "vite": "Build tool",
    "typescript": "Type checking",
    "@vitejs/plugin-react": "Vite React plugin",
    "@types/react": "React types"
  }
}
```

---

## 🔍 HOW TO NAVIGATE THIS CODEBASE

### To Understand X, Read These Files

| Goal | Files to Read |
|------|--------------|
| How data flows from API to DB | `sync-tcgdex.ts` → `tcgdex-sync.service.ts` → `database.ts` |
| Frontend layout | `App.tsx` → pages/ → services/dataService.ts |
| Database schema | `src/db/migrations/001_*.sql` |
| What's the API? | `src/modules/*/client.ts` |
| Add new route | `src/modules/{module}/{module}.routes.ts` |
| Understand Docker | `docker-compose.yml` + `Dockerfile` + `docker-entrypoint.sh` |
| Debug sync issues | `scripts/{sync-*}.ts` + `/admin/api-debug/*` endpoints |
| Add new sync source | Create `sync/{source}-sync.service.ts` + client + route |

---

## ✅ CHECKLIST: WHAT'S COMPLETE

- ✅ 3-API data ingestion (Pokemon TCG, TCGdex, TCGTracking)
- ✅ Multi-language support (EN, JA, ZH, FR, ES, DE, IT, PT)
- ✅ Database schema with canonical + external refs pattern
- ✅ React frontend with 3 pages (Dashboard, Cards List, Card Detail)
- ✅ Express API with data formatting DTOs
- ✅ Docker orchestration (4 services)
- ✅ Automatic migration on startup
- ✅ CLI sync scripts for each source
- ✅ Dark mode toggle
- ✅ Pagination everywhere
- ✅ Price tracking

---

## ⚠️ KNOWN ISSUES & GAPS

- 🟡 Chinese sync has limited coverage (829 cards total at TCGdex)
- 🟡 Multiple logo update scripts (consolidate into one)
- 🟡 Duplicate sync script implementations (v1 & v2)
- 🟡 Debug scripts should be removed from production
- 🔴 No authentication/authorization
- 🔴 No rate limiting on APIs
- 🔴 No caching layer
- 🔴 Frontend missing: filters, advanced search, sort options
- 🔴 Backend missing: error recovery, retry logic

---

**End of Codebase Map**

Last Updated: April 11, 2026
