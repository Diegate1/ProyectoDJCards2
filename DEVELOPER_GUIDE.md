# 📖 DEVELOPER GUIDE - ProyectoDJCards2

**Last Updated:** April 12, 2026  
**For:** Future developers working on ProyectoDJCards2  
**Purpose:** Single source of truth for project structure, setup, and workflow

---

## 🎯 ¿Qué es este proyecto?

**ProyectoDJCards2** es un sistema completo de sincronización y visualización de datos de **Pokémon Trading Card Game** desde múltiples APIs en 3 idiomas (EN, JA, ZH).

**Stack técnico:**
- **Backend:** Node.js + Express (NestJS-style)
- **Frontend:** React + Vite + TypeScript
- **Database:** PostgreSQL 16
- **Deployment:** Render.com (multi-service)
- **Sync:** Cron-like scripts ejecutables manualmente

---

## 🗂️ ESTRUCTURA DEL PROYECTO

### Organización de carpetas

```
ProyectoDJCards2/
│
├── 📦 BACKEND
│   ├── src/
│   │   ├── main.ts                      # 🚀 Entry point - Inicia servidor
│   │   ├── db/
│   │   │   ├── database.ts              # 🔌 Conexión PostgreSQL
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql  # 📋 Esquema inicial
│   │   │
│   │   ├── modules/                     # 📁 Feature modules (cada uno con su lógica)
│   │   │   ├── admin/                   # Debug endpoints
│   │   │   ├── data/                    # 🌐 Public API (/api/*)
│   │   │   ├── pokemon-tcg/             # 🎮 Client de Pokemon TCG API
│   │   │   ├── tcgdex/                  # 🌍 Client multilanguage (TCGdex)
│   │   │   ├── tcgtracking/             # 🇯🇵 Client de Japanese API
│   │   │   ├── tcgcsv/                  # 💰 Client de productos/precios
│   │   │   ├── sync/                    # 🔄 Lógica de sync (9 servicios)
│   │   │   └── scraper/                 # 🕷️ Web scraping (pokeguardian, etc)
│   │   │
│   │   └── common/
│   │       ├── types.ts                 # 📝 DTOs compartidos
│   │       ├── api-log.service.ts       # 📊 Log de API calls
│   │       └── utils.ts                 # 🛠️ Utilidades comunes
│   │
│   ├── package.json                     # 📦 Dependencies
│   └── tsconfig.json                    # ⚙️ TypeScript config
│
├── 🎨 FRONTEND
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx                 # 🚀 React entry point
│   │   │   ├── App.tsx                  # 🔀 Router principal
│   │   │   ├── types.ts                 # 📝 DTOs frontend
│   │   │   │
│   │   │   ├── pages/                   # 📄 Páginas principales
│   │   │   │   ├── DashboardSetsPage.tsx    # 📊 Sets listing
│   │   │   │   ├── CardsPage.tsx            # 🎴 Cards listing
│   │   │   │   └── CardDetailPage.tsx      # 🔍 Card detail view
│   │   │   │
│   │   │   ├── components/              # 🧩 Componentes reutilizables
│   │   │   │   └── PaginationControls.tsx   # ➡️ Pagination
│   │   │   │
│   │   │   ├── services/                # 🔌 API clients
│   │   │   │   └── dataService.ts           # Axios client → /api/*
│   │   │   │
│   │   │   └── utils/                   # 🛠️ Utilities
│   │   │       └── search.ts                # 🔍 Search logic
│   │   │
│   │   ├── index.html                   # 📄 HTML root
│   │   ├── vite.config.ts               # ⚙️ Vite config
│   │   ├── package.json                 # 📦 Dependencies
│   │   └── tsconfig.json                # ⚙️ TypeScript config
│   │
│   └── Dockerfile                       # 🐳 Multi-stage build
│
├── 🔧 SCRIPTS & UTILITIES
│   ├── scripts/
│   │   │
│   │   ├── ✅ ACTIVE SYNC (Raíz)
│   │   │   ├── sync-tcgdex.ts           # Multi-language (EN, JA, etc)
│   │   │   ├── sync-tcgdex-chinese-v2.ts   # Chinese (CN)
│   │   │   ├── sync-tcgtracking-sets.ts    # Japanese sets
│   │   │   ├── sync-tcgtracking-cards.ts   # Japanese cards
│   │   │   ├── full-sync.ts            # Orchestrated sync ALL
│   │   │   ├── sync-set.ts             # Single set sync
│   │   │   ├── migrate.ts              # Database migrations
│   │   │   └── fix-corrupted-refs.ts       # Repair tool
│   │   │
│   │   ├── debug/                       # 🐛 Debug scripts
│   │   │   ├── check-external-refs.ts       # Verify API mappings
│   │   │   ├── check-logos.ts               # Check image URLs
│   │   │   ├── debug-tcgtracking-api.ts     # Test API connections
│   │   │   └── ... (otros 5 debug scripts)
│   │   │
│   │   ├── migration/                   # 📋 Migration tools
│   │   │   ├── fix-corrupted-refs.ts
│   │   │   ├── update-tcgtracking-images.ts
│   │   │   ├── update-tcgtracking-logos-v2.ts
│   │   │   └── *.sql  (migration files)
│   │   │
│   │   ├── analysis/                    # 📊 Data analysis
│   │   │   ├── analyze-pokemontcg-logos.ts
│   │   │   └── analyze-tcgtracking-images.ts
│   │   │
│   │   └── README.md                    # 📘 Scripts documentation
│   │
│   ├── Dockerfile                       # 🐳 Backend image
│   ├── docker-entrypoint.sh             # 🚀 Startup script
│   ├── docker-compose.yml               # 🐳 Multi-container (LOCAL DEV)
│   │
│   └── .env.example                     # 📝 Environment template
│
├── 📃 ROOT CONFIGURATION
│   ├── package.json                     # 📦 Root scripts & deps
│   ├── tsconfig.json                    # ⚙️ TypeScript root config
│   ├── .gitignore                       # 🚫 Git ignore patterns
│   └── Render.md                        # 🚀 Render deployment guide
│
├── 📚 DOCUMENTATION (START HERE)
│   ├── README.md                        # ⭐ Project overview
│   ├── SYNC_METHODS.md                  # 🔄 Detailed sync documentation
│   ├── README_ADMIN.md                  # 🔧 Admin endpoints
│   ├── QUICKSTART.md                    # ⚡ Quick setup
│   └── DEVELOPER_GUIDE.md               # 👨‍💻 THIS FILE
│
└── 🐳 DEPLOYMENT
    └── Render.md                        # 🚀 Production deployment
```

---

## 🚀 QUICK START (5 minutes)

### 1. Install

```bash
# Clone repo
git clone <repo-url>
cd ProyectoDJCards2

# Install dependencies (both backend + frontend)
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Database

```bash
# Start PostgreSQL (Docker)
npm run db:up

# Run migrations
npm run migrate
```

### 3. Run Development

**Terminal 1 - Backend:**
```bash
npm run dev
# Backend running at http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:5173
```

**Open browser:** http://localhost:5173

### 4. Sync Data (Optional)

```bash
# Sync all languages (EN + JA + ZH) - TAKES 5-10 MINUTES FIRST RUN
npm run sync:full

# Or individual syncs:
npm run sync:english      # English + International
npm run sync:japanese     # Japanese
npm run sync:chinese      # Chinese Simplified
```

---

## 📋 NPM SCRIPTS REFERENCE

### ✅ Setup & Database

| Comando | Qué hace |
|---------|----------|
| `npm install` | Instalar todas las dependencias |
| `npm run db:up` | Levantar PostgreSQL en Docker |
| `npm run db:down` | Detener PostgreSQL |
| `npm run db:reset` | 🔥 Limpiar base de datos y reiniciar |
| `npm run migrate` | Ejecutar migraciones SQL |

### 🚀 Development

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Start backend con watch (hot reload) |
| `npm run build` | Compilar backend a JavaScript |
| `npm run start` | Run backend compilado |

### 🔄 Sync (Sincronización de datos)

| Comando | Idioma | Fuente | Tiempo |
|---------|--------|--------|--------|
| `npm run sync:full` | EN + JA + ZH | All APIs | 5-10m |
| `npm run sync:english` | EN | Pokemon TCG + TCGdex | 2-3m |
| `npm run sync:japanese` | JA | TCGTracking + TCGdex | 1-2m |
| `npm run sync:chinese` | ZH | TCGdex | 1-2m |
| `npm run sync:tcgtracking:sets` | JA | TCGTracking only (sets) | <1m |
| `npm run sync:tcgtracking:cards` | JA | TCGTracking only (cards) | 2-3m |

### 📊 Utilities

| Comando | Qué hace |
|---------|----------|
| `npm run fix:refs` | Repair broken API reference IDs |
| `npm run update:tcgtracking:images` | Update Japanese card images |
| `npm run update:tcgtracking:logos` | Update set logos |

### 🐳 Docker (Production-like)

| Comando | Qué hace |
|---------|----------|
| `docker-compose up -d` | Start ALL services (DB + Backend + Frontend) |
| `docker-compose logs -f` | View logs in real-time |
| `docker-compose down` | Stop and remove containers |

---

## 🏗️ ARQUITECTURA & FLUJO

### ¿Cómo llega un dato desde la API hasta la pantalla?

```
1. SINCRONIZACIÓN (Background)
   ├─ npm run sync:full
   └─ scripts/full-sync.ts
      ├─ Calls sync-tcgdex.ts (EN)
      ├─ Calls sync-tcgtracking-*.ts (JA)
      └─ Calls sync-tcgdex-chinese-v2.ts (ZH)
         ↓
      API Clients (modules/pokemon-tcg/, modules/tcgdex/, etc)
         ↓
      Database (PostgreSQL)
         ↓
      [Data persisted in DB]

2. BROWSING (Frontend)
   ├─ User opens http://localhost:5173
   └─ App.tsx renders
      ├─ Routes to CardsPage or DashboardSetsPage
      └─ Components call dataService.ts
         ├─ Makes HTTP GET /api/sets, /api/cards
         ↓
      Backend (src/modules/data/data.controller.ts)
         ├─ Queries PostgreSQL
         └─ Returns JSON
            ↓
         Frontend renders
            ↓
         Browser displays cards / sets
```

### Data Flow Diagram

```
EXTERNAL APIS                DATABASE          BACKEND           FRONTEND
┌─────────────────┐    ┌──────────────┐     ┌──────────┐      ┌────────────┐
│ Pokemon TCG API │────│              │     │          │      │  React App │
│                 │    │              │     │          │──/api│            │
│ TCGdex API      │────│  PostgreSQL  │────│ Express  │      │            │
│                 │    │              │     │ Modules  │      │ Pages:     │
│ TCGTracking API │────│              │     │          │      │ - Sets     │
│                 │    │              │     │          │      │ - Cards    │
│ TCGCSV API      │    │              │     │          │      │ - Details  │
└─────────────────┘    └──────────────┘     └──────────┘      └────────────┘
   (via scripts/)       (SQL queries)      (dataService.ts)   (Vite @ 5173)
   
   Sync happens         Storage layer      API layer          UI layer
   manually (CLI)
```

---

## 🔌 API ENDPOINTS (Backend)

### Public API (`/api/*`)

**Sets:**
```
GET /api/sets                    # List all sets
GET /api/sets/:id                # Get set detail
GET /api/sets/search?q=...       # Search sets
```

**Cards:**
```
GET /api/cards                   # List all cards (paginated)
GET /api/cards/:id               # Get card detail
GET /api/cards/search?q=...      # Search cards
GET /api/cards/set/:setId        # Get cards from set
```

**Stats:**
```
GET /api/stats/db                # Database statistics
GET /api/stats/sync-status       # Sync progress
```

### Admin Endpoints (`/admin/*`)

```
GET /admin/status/db             # Database connection status
GET /admin/apis/all              # All external APIs status
GET /admin/sync-progress         # Current sync progress
```

---

## 🔄 SYNC FLOW DETALLADO

### ¿Cómo funciona la sincronización?

```typescript
// Entry: npm run sync:full
// File: scripts/full-sync.ts

async function fullSync() {
  // 1. ENGLISH (Pokemon TCG + TCGdex EN)
  await syncEnglish()
  
  // 2. JAPANESE (TCGTracking + TCGdex JA)
  await syncJapanese()
  
  // 3. CHINESE (TCGdex ZH)
  await syncChinese()
}

// Each sync:
// 1. Fetch data from external APIs
// 2. Parse & normalize to common schema
// 3. Upsert to PostgreSQL (create or update)
// 4. Log statistics
```

### Data Sources (Orden de Preferencia)

```
Card Images:
  1. Pokemon TCG Official
  2. TCGdex
  3. TCGTracking (JP)
  4. Fallback image

Card Info:
  1. Pokemon TCG (official)
  2. TCGdex (multilanguage)
  3. TCGCSV (prices, rarity)

Language Support:
  - English (EN) → Pokemon TCG + TCGdex
  - Japanese (JA) → TCGTracking + TCGdex
  - Chinese (ZH) → TCGdex only (Simplified)
```

---

## 📊 DATABASE SCHEMA

### Main Tables

```sql
-- Sets (base table)
CREATE TABLE sets (
  id UUID PRIMARY KEY,
  api_id VARCHAR (unique by API),
  name VARCHAR,
  release_date DATE,
  language VARCHAR,
  logo_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Cards (base table)
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  api_id VARCHAR,
  set_id UUID FOREIGN KEY,
  name VARCHAR,
  image_url VARCHAR,
  number VARCHAR,
  rarity VARCHAR,
  language VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- External IDs (mapping)
CREATE TABLE external_ids (
  id UUID PRIMARY KEY,
  card_id UUID FOREIGN KEY,
  api_name VARCHAR ('pokemon-tcg', 'tcgdex', 'tcgtracking'),
  external_id VARCHAR (unique by API + card),
  created_at TIMESTAMP
);
```

### Ver esquema completo

```bash
# SQL file
cat src/db/migrations/001_initial_schema.sql
```

---

## 🛠️ COMMON TASKS

### Task 1: Agregar un nuevo endpoint

**Where:** `src/modules/data/data.controller.ts`

```typescript
@Get('/cards/filter')
async filterCards(@Query() query: FilterQuery) {
  // Tu lógica aquí
  return await this.dataService.findCards(query);
}
```

**Then:** Restart `npm run dev`

### Task 2: Debuggear por qué no sincroniza correctamente

```bash
# Run debug script
ts-node scripts/debug/check-external-refs.ts

# Check logs
ts-node scripts/debug/debug-tcgtracking-api.ts
```

### Task 3: Fix broken references

```bash
npm run fix:refs
```

### Task 4: Actualizar imágenes de una API

```bash
npm run update:tcgtracking:images
npm run update:tcgtracking:logos
```

### Task 5: Full database reset (DEV ONLY!)

```bash
npm run db:reset
npm run migrate
npm run sync:full
```

---

## 🐛 DEBUGGING

### Backend Debugging

**Check logs:**
```bash
npm run dev
# Ver console output directamente
```

**Database query:**
```bash
# Connect to PostgreSQL
psql -U pokemon -d pokemontcg -h localhost

# Common queries
SELECT COUNT(*) FROM cards;
SELECT COUNT(*) FROM sets;
SELECT * FROM cards LIMIT 5;
```

**Health checks:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/status/db
```

### Frontend Debugging

**Browser DevTools:**
- F12 → Network tab → Ver requests a /api/*
- F12 → Console → Ver errors

**Clear cache:**
```bash
# Hard refresh
Ctrl + Shift + R
```

---

## 📁 KEY FILES BY FEATURE

### Synchronization
```
scripts/sync-tcgdex.ts                 # Main sync logic
src/modules/sync/                      # Sync services
src/modules/pokemon-tcg/               # API client
src/modules/tcgtracking/               # JP API client
```

### API / Endpoints
```
src/main.ts                            # Server startup
src/modules/data/data.controller.ts   # Route handlers
```

### Database
```
src/db/database.ts                     # Connection
src/db/migrations/*.sql                # Schema
```

### Frontend
```
frontend/src/App.tsx                   # Routes
frontend/src/pages/                    # Page components
frontend/src/services/dataService.ts  # API client
```

---

## 🚀 DEPLOYMENT (Render.com)

**For production deployment:**
- See: [Render.md](../Render.md)

**Quick checklist:**
1. Push to GitHub
2. Create PostgreSQL database in Render
3. Create Backend Web Service (NestJS)
4. Create Frontend Web Service (React)
5. Set environment variables
6. Deploy!

---

## 🆘 TROUBLESHOOTING

### Problem: "ECONNREFUSED localhost:5432"
**Solution:** Database not running
```bash
npm run db:up
npm run migrate
```

### Problem: Frontend won't connect to backend
**Solution:** CORS issue or backend not running
```bash
# Check backend is running
curl http://localhost:3000/health

# If not, restart:
npm run dev
```

### Problem: Sync is hanging/stuck
**Solution:** API rate limit or network issue
```bash
# Cancel (Ctrl + C)
# Wait 5 minutes
# Try again
npm run sync:full
```

### Problem: Data looks wrong or incomplete
**Solution:** Run debug + repair
```bash
npm run fix:refs
npm run update:tcgtracking:images
```

---

## 📞 GETTING HELP

| Problema | Ver archivo |
|----------|------------|
| ¿Cómo sincronizo datos? | [SYNC_METHODS.md](../SYNC_METHODS.md) |
| ¿Cuáles son los endpoints? | [README_ADMIN.md](../README_ADMIN.md) |
| ¿Cómo deplopo a Render? | [Render.md](../Render.md) |
| ¿Cómo uso los scripts? | [scripts/README.md](../scripts/README.md) |

---

## ✅ BEST PRACTICES

### Code Style
- Use TypeScript strictly (`strict: true` in tsconfig.json)
- Use async/await (no callbacks)
- Document complex sync logic with comments
- Use meaningful variable names

### Database
- Always use migrations (never raw SQL in code)
- Test migrations locally first
- Use transactions for multi-step ops
- Never delete data without backup

### Sync
- Run full sync only when needed (API rate limits!)
- Monitor logs for errors
- Keep error logs for debugging
- Document major schema changes

### Frontend
- Keep components small & reusable
- Use TypeScript for all `.tsx` files
- Test in different browsers
- Optimize images

---

## 🎓 LEARNING PATH

**New to project? Follow this order:**

1. **Week 1:** Read this file + QUICKSTART.md + SYNC_METHODS.md
2. **Week 2:** Run the project locally, explore database
3. **Week 3:** Make a small code change (new API endpoint)
4. **Week 4:** Debug the sync process, run full-sync manually
5. **Week 5:** Deploy to test environment

---

## 📝 CHANGELOG & UPDATES

**April 12, 2026 (Latest):**
- ✅ Optimized for Render.com multi-service deployment
- ✅ Standardized ports (3000 backend, 3000 frontend via nginx)
- ✅ Complete Developer Guide created
- ✅ Cleaned up legacy documentation

**See:** git log for full history

---

**Last updated:** April 12, 2026  
**By:** AI Assistant  
**Status:** ✅ Complete & Ready for developers
