# 🎮 ProyectoDJCards2 - Pokémon TCG Data Ingestion System

Sistema completo de sincronización y visualización de datos de Pokémon Trading Card Game desde múltiples APIs en 3 idiomas: **Inglés**, **Japonés** y **Chino Simplificado**.

---

## ⚡ Quick Start (5 min)

```bash
# 1. Setup inicial
npm install
npm run db:up           # Levantar PostgreSQL
npm run migrate         # Ejecutar migraciones

# 2. Sincronizar datos (opcional)
npm run sync:full       # Sincronizar TODAS las fuentes (EN, JA, ZH)

# 3. Iniciar desarrollo
npm run dev             # Backend: http://localhost:3000
cd frontend && npm run dev  # Frontend: http://localhost:5173
```

👉 **Para desarrolladores nuevos:** Lee [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) primero

---

## 🚀 START HERE

| Necesitas... | Leer... |
|---|---|
| 👨‍💻 **Comenzar con el proyecto** | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) ⭐ |
| ⚡ **Quick setup (5 min)** | [QUICKSTART.md](QUICKSTART.md) |
| 🔄 **Sincronizar datos** | [SYNC_METHODS.md](SYNC_METHODS.md) |
| 🚀 **Deploy a Render** | [renderConfig.md](renderConfig.md) (detallado) o [RENDER_QUICK_REFERENCE.md](RENDER_QUICK_REFERENCE.md) (rápido) |
| 🔧 **Admin endpoints** | [README_ADMIN.md](README_ADMIN.md) |
| 🧹 **Qué se limpió** | [CLEANUP_LOG.md](CLEANUP_LOG.md) |

---

## 📋 Tres Métodos de Sincronización

| Método | Comando | Idioma | Fuente | Tiempo |
|--------|---------|--------|--------|--------|
| **English** | `npm run sync:english` | 🇬🇧 EN | Pokemon TCG + TCGdex | 2-3m |
| **Japanese** | `npm run sync:japanese` | 🇯🇵 JA | TCGTracking + TCGdex | 1-2m |
| **Chinese** | `npm run sync:chinese` | 🇨🇳 ZH | TCGdex | 1-2m |
| **Full Sync** | `npm run sync:full` | 🌍 ALL | Todas las APIs | 5-10m |

---

## 📁 Estructura del Proyecto

```
ProyectoDJCards2/
├── src/                     # Backend (Express + TypeScript)
│   ├── main.ts             # 🚀 Entry point
│   ├── modules/            # Feature modules
│   │   ├── admin/          # Debug endpoints
│   │   ├── data/           # Public API (/api/*)
│   │   ├── pokemon-tcg/    # API client
│   │   ├── tcgdex/         # Multilanguage client
│   │   ├── tcgtracking/    # Japanese API client
│   │   ├── sync/           # Sync services
│   │   └── scraper/        # Web scraping
│   ├── db/
│   │   ├── database.ts     # 🔌 PostgreSQL connection
│   │   └── migrations/     # 📋 SQL migrations
│   └── common/             # Shared utilities
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/          # 📄 Sets, Cards, Details
│   │   ├── services/       # 🔌 API client
│   │   ├── components/     # 🧩 UI components
│   │   └── types.ts        # 📝 DTO types
│   ├── Dockerfile          # 🐳 Multi-stage build
│   └── vite.config.ts      # ⚙️ Vite config
│
├── scripts/                # 🔧 CLI utilities
│   ├── sync-tcgdex.ts           # Active ✅
│   ├── sync-tcgtracking-*.ts    # Active ✅
│   ├── full-sync.ts             # Active ✅
│   ├── debug/               # 🐛 Debug scripts
│   ├── migration/           # 📋 DB tools
│   ├── analysis/            # 📊 Data analysis
│   └── README.md            # 📘 Scripts guide
│
├── 🐳 Docker & Deployment
│   ├── docker-compose.yml   # Multi-container (LOCAL)
│   ├── Dockerfile           # Backend image
│   ├── frontend/Dockerfile  # Frontend image  
│   └── docker-entrypoint.sh # 🚀 Startup script
│
└── 📚 Documentation (Consolidated)
    ├── DEVELOPER_GUIDE.md       # 👨‍💻 THIS IS YOUR START
    ├── README.md               # THIS FILE
    ├── QUICKSTART.md
    ├── SYNC_METHODS.md
    ├── README_ADMIN.md
    ├── Render.md
    ├── CLEANUP_LOG.md
    └── scripts/README.md
```

---

## 🔄 NPM Scripts - Common Tasks

### 🔄 Sincronización (Sync)

```bash
npm run sync:full               # Sincronizar TODO (EN + JA + ZH)
npm run sync:english            # Inglés + Internacional
npm run sync:japanese           # Japonés
npm run sync:chinese            # Chino Simplificado
npm run sync:tcgtracking:sets   # Sets japoneses solo
npm run sync:tcgtracking:cards  # Cartas japonesas solo
```

### 📊 Base de Datos

```bash
npm run migrate                 # Ejecutar migraciones
npm run db:up                   # Levantar PostgreSQL
npm run db:down                 # Detener PostgreSQL
npm run db:reset                # ⚠️ Reset DB (borrar datos)
```

### 👨‍💻 Desarrollo

```bash
npm run dev                     # Backend dev (watch mode)
npm run build                   # Compilar TypeScript
npm run start                   # Producción backend
npm run fix:refs                # Reparar referencias rotas
```

---

## 🏗️ Arquitectura

```
┌─────────────────┐        ┌──────────────┐      ┌──────────────┐
│ External APIs   │        │ PostgreSQL   │      │ Browser      │
│ - Pokemon TCG   │───────▶│ Database     │◀─────│ React + Vite │
│ - TCGdex        │        │              │      │              │
│ - TCGTracking   │        └──────────────┘      └──────────────┘
│ - TCGCSV        │               ▲                     ▲
└─────────────────┘               │                     │ /api/*
                            Backend                     │
                            Express.js          HTTP Requests
                            (src/modules)

DATA FLOW:
1. Manual: npm run sync:* → Fetch from APIs → Parse → PostgreSQL
2. User: Browser → Frontend → /api/* endpoints → Backend → SQL
```

---

## 🔌 API Endpoints

### Public (Frontend)

```bash
GET  /api/sets              # Listar sets (paginated)
GET  /api/sets/:id          # Detalles del set
GET  /api/cards             # Listar cartas (paginated)
GET  /api/cards/:id         # Detalles de la carta
GET  /api/cards/set/:setId  # Cartas de un set
```

### Admin / Debug

```bash
GET  /health                        # Health check
GET  /admin/status/db               # Database status
GET  /admin/apis/all                # APIs availability
```

📖 Complete list: [README_ADMIN.md](README_ADMIN.md)

---

## 🐳 Deployment

### Local Development

```bash
# Option 1: Native (separate terminals)
npm run dev                 # Terminal 1 - Backend
cd frontend && npm run dev  # Terminal 2 - Frontend

# Option 2: Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Production (Render.com)

**Three deployment guides available:**

| Necesitas... | Lee... | Tiempo |
|---|---|---|
| Referencia rápida | [RENDER_QUICK_REFERENCE.md](RENDER_QUICK_REFERENCE.md) | 5m |
| **Guía paso-a-paso completa** | **[renderConfig.md](renderConfig.md)** | **20m** |
| Overview conceptual | [Render.md](Render.md) | 10m |

**Quick start:**
```bash
1. Create PostgreSQL database in Render
2. Create Backend Web Service
3. Create Frontend Web Service
4. Set environment variables
5. Deploy!
```

👉 **Recomendación:** Lee [renderConfig.md](renderConfig.md) para guía completa con paso-a-paso

---

## 🧹 Project Maintenance

✅ **April 12, 2026 Cleanup:**
- Removed 14+ obsolete .md files (documentation consolidated)
- Archived legacy scripts in `/debug/` and `/migration/`
- Verified all npm scripts are functional
- Created **DEVELOPER_GUIDE.md** as single source of truth

📖 See: [CLEANUP_LOG.md](CLEANUP_LOG.md)

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + Vite + TypeScript + Axios |
| **Backend** | Node.js 18 + Express + TypeScript |
| **Database** | PostgreSQL 16 + SQL migrations |
| **DevOps** | Docker + Docker Compose + Render |

---

## 🐛 Quick Troubleshooting

| Problema | Solución |
|----------|----------|
| "ECONNREFUSED localhost:5432" | Run: `npm run db:up` |
| Frontend doesn't load | Check: `npm run dev` running + `VITE_API_BASE_URL` set |
| Sync stuck/hanging | Network issue or rate limit - wait 5 min, retry |
| Data looks wrong | Run: `npm run fix:refs` + `npm run update:tcgtracking:images` |

📖 Full troubleshooting: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#-debugging) + [Render.md](Render.md)

---

## 📞 Getting Help

Need help? Check:

1. **Setup issues?** → [QUICKSTART.md](QUICKSTART.md)
2. **Sync issues?** → [SYNC_METHODS.md](SYNC_METHODS.md)
3. **API questions?** → [README_ADMIN.md](README_ADMIN.md)
4. **Render deployment?** → [renderConfig.md](renderConfig.md) (step-by-step) o [RENDER_QUICK_REFERENCE.md](RENDER_QUICK_REFERENCE.md) (quick)
5. **Project structure?** → [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) ⭐
6. **Everything else?** → [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) (comprehensive!)

---

## 📝 Data Sources

- **Pokemon TCG API** - Official Pokémon card database  
- **TCGdex** - Community multilanguage database (EN, JA, ZH, etc)
- **TCGTracking** - Japanese exclusive pricing & data
- **TCGCSV / TCGPlayer** - Product & pricing data

---

## ✅ Status

| Category | Status | Last Updated |
|----------|--------|--------------|
| Functionality | ✅ All working | April 12, 2026 |
| Documentation | ✅ Complete & consolidated | April 12, 2026 |
| Code quality | ✅ Clean, no dead code | April 12, 2026 |
| Deployment | ✅ Render-ready | April 12, 2026 |

---

**👉 NEW DEVELOPERS: Start with [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**

# Ver status de BBDD
curl http://localhost:3000/admin/status/db
```

## Interfaz Adminer

PostgreSQL GUI en `http://localhost:8080`

- **Server**: postgres
- **User**: pokemon
- **Password**: pokemon
- **Database**: pokemontcg

## Estructura del Proyecto

```
src/
├── main.ts                           # Punto de entrada
├── db/
│   ├── database.ts                  # Cliente PostgreSQL
│   └── migrations/
│       └── 001_initial_schema.sql   # Schema inicial
├── modules/
│   ├── pokemon-tcg/                 # Cliente de Pokémon TCG API
│   │   └── pokemon-tcg.client.ts
│   ├── tcgdex/                      # Cliente de TCGdex
│   │   └── tcgdex.client.ts
│   ├── tcgcsv/                      # Cliente de TCGCSV
│   │   └── tcgcsv.client.ts
│   ├── sync/                        # Servicios de sincronización
│   │   └── set-sync.service.ts
│   └── admin/                       # Endpoints admin
│       ├── admin.controller.ts
│       └── admin.routes.ts
└── common/
    ├── types.ts                     # Interfaces de las APIs
    └── api-log.service.ts           # Servicio de logs
```

## Fases del Desarrollo

- ✅ **FASE 1**: Infra y BBDD
- ✅ **FASE 2**: Clientes API (Pokemon TCG, TCGdex, TCGCSV)
- 🚧 **FASE 3**: Servicios de Sincronización (en progreso)
- 📋 **FASE 4**: Admin Dashboard (básico completado)
- 📋 **FASE 5**: Integración y Testing

## Próximos Pasos

1. Completar sincronización de cartas (card-sync.service.ts)
2. Completar sincronización de productos (product-sync.service.ts)
3. Implementar mapeo entre sets de diferentes APIs
4. UI mejorada para admin dashboard
5. Scripts de sincronización completa

## Notas Importantes

- Los `raw_json` se guardan siempre para auditoría
- Los upserts son inteligentes: no borran datos antiguos
- Los rate limits de las APIs se respetan (logs para monitoring)
- Las referencias externas están normalizadas por `(source_code, external_id)`

## Troubleshooting

### Error de conexión a BD
```bash
npm run db:reset  # Recrear BD desde cero
```

### API Key de Pokémon TCG
Si necesitas usar la API key:
```
POKEMON_TCG_API_KEY=tu_clave_aqui npm run dev
```

Sin API key tienes límites: 1000 requests/día y 30/min.

## Guía Completa

Ver `pokemontcg_api_guide.md` para detalles sobre:
- Endpoints específicos de cada API
- Formatos de respuesta
- Rate limits
- Recomendaciones de modelado
