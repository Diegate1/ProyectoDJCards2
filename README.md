# 🎮 ProyectoDJCards2 - Pokémon TCG Data Ingestion System

**Language:** [Español](#español) | [English](#english)

Sistema completo de sincronización y visualización de datos de Pokémon Trading Card Game desde múltiples APIs en 3 idiomas: **Inglés**, **Japonés** y **Chino Simplificado**.

---

## ⚡ Quick Start

```bash
# 1. Setup
npm install
npm run db:up           # Levantar PostgreSQL
npm run migrate         # Ejecutar migraciones

# 2. Sincronizar datos
npm run sync:full       # Sincronizar TODAS las fuentes (EN, JA, ZH)

# 3. Iniciar desarrollo
npm run dev             # Backend: http://localhost:3000
cd frontend && npm run dev  # Frontend: http://localhost:5173
```

---

## 📋 Tres Métodos de Sincronización (Sync Methods)

| Método | Comando | Idioma | Fuente |
|--------|---------|--------|--------|
| **English** | `npm run sync:english` | 🇬🇧 English | Pokemon TCG API + TCGdex |
| **Japanese** | `npm run sync:japanese` | 🇯🇵 Japonés | TCGTracking + TCGdex |
| **Chinese** | `npm run sync:chinese` | 🇨🇳 Chino Simplificado | TCGdex |
| **Full Sync** | `npm run sync:full` | 🌍 Todos (EN→JA→ZH) | Todas las APIs |

📖 **Documentación detallada:** [SYNC_METHODS.md](SYNC_METHODS.md)

---

## 🏗️ Arquitectura

```
Frontend (React + Vite)
    ↓ HTTP /api/*
Backend (NestJS/Express)
    ↓ SQL
PostgreSQL Database
```

**Fuentes de Datos:**
- **Pokemon TCG API** → Sets y cartas oficiales (EN)
- **TCGdex** → Información en 8 idiomas (EN, JA, ZH, etc)
- **TCGTracking** → Sets y precios exclusivos de Japón (JA)

---

## 🐳 Docker Deployment

### Local Development
```bash
docker-compose up -d    # Levanta: PostgreSQL + Backend + Frontend
docker-compose logs -f  # Ver logs
docker-compose down     # Detener
```

### Production (Render)
Ver: [DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md)

---

## 📁 Project Structure

```
ProyectoDJCards2/
├── src/                     # Backend (NestJS/Express)
│   ├── main.ts             # Entry point
│   ├── modules/            # Feature modules (API routes, sync logic)
│   ├── db/                 # Database connection & migrations
│   └── common/             # Shared utilities & types
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── pages/          # Sets, Cards, Details pages
│       ├── services/       # API client (Axios)
│       └── components/     # Reusable UI components
├── scripts/                # CLI utilities
│   ├── sync-*.ts          # Sync scripts (active)
│   ├── full-sync.ts       # Orchestrated sync
│   ├── debug/             # Debugging utilities
│   ├── migration/         # Database migrations & tools
│   └── analysis/          # Data analysis tools
├── docker-compose.yml     # Multi-container orchestration
├── Dockerfile             # Backend image
└── SYNC_METHODS.md        # Sync documentation
```

---

## 🔄 NPM Scripts

### Sincronización (Sync)
```bash
npm run sync:english        # Sincronizar inglés
npm run sync:japanese       # Sincronizar japonés
npm run sync:chinese        # Sincronizar chino
npm run sync:full          # Sincronizar TODO

# Componentes individuales
npm run sync:tcgtracking:sets    # Solo sets japoneses
npm run sync:tcgtracking:cards   # Solo cartas japonesas
npm run sync:set <<set_id>>      # Un set específico
```

### Base de Datos
```bash
npm run migrate             # Ejecutar migraciones
npm run db:up              # Levantar PostgreSQL
npm run db:down            # Detener PostgreSQL
npm run db:reset           # Reset DB (⚠️ BORRAR DATOS)
```

### Desarrollo
```bash
npm run dev                # Backend dev mode (watch)
npm run build              # Build backend
npm run start              # Start production backend
```

---

## 🔌 API Endpoints (Backend)

### Public Endpoints (Frontend)
```
GET  /api/sets              # Listar todos los sets
GET  /api/sets/:id          # Detalles del set
GET  /api/cards             # Listar todos los sets
GET  /api/cards/:id         # Detalles de la carta
```

### Admin Debug Endpoints
```
POST /admin/sync?type=full        # Trigger sync
GET  /admin/sync/status           # Ver estado de sync
GET  /admin/data/health           # Health check
```

📖 **Documentación completa:** [README_ADMIN.md](README_ADMIN.md)

---

## 📊 Database Schema

**Tablas principales:**
- `sets` - Conjuntos de cartas (multi-idioma)
- `cards` - Cartas individuales (multi-idioma)
- `external_references` - Mapeos entre APIs (Pokemon TCG ID, TCGdex ID, TCGTracking ID)

**Soporte multi-idioma:**
- Cada tabla tiene columnas `_{lang}` (name_en, name_ja, name_zh, etc)
- `external_references` mapea IDs entre 3 APIs

---

## 🧹 Código Limpio & Mantenimiento

✅ **Lo que eliminamos:**
- Documentación antigua (15+ archivos MD deprecated)
- Scripts duplicados/deprecated (sync-japanese-tcgdex.ts, etc)
- Archivos temporales de sync

✅ **Lo que reorganizamos:**
- Scripts agrupados en: `/debug/`, `/migration/`, `/analysis/`
- npm scripts organizados y documentados (ver package.json)

✅ **Código activo:**
- 6 métodos de sync claramente documentados
- API routes limpias y typed
- Frontend separado (Vite pre-build)

---

## 🚀 Deployment

### Development
```bash
npm run dev                 # Backend localhost:3000
cd frontend && npm run dev  # Frontend localhost:5173
```

### Docker (Local)
```bash
docker-compose up -d
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Production (Render)
1. See [DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md) for step-by-step guide
2. Or 1-click deploy with docker-compose.yml

---

## 🛠️ Technologies

**Backend:** Node.js 18, NestJS, Express, TypeScript  
**Frontend:** React 18, Vite, Axios, TypeScript  
**Database:** PostgreSQL 16  
**Deployment:** Docker, Docker Compose, Render  

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| [SYNC_METHODS.md](SYNC_METHODS.md) | 3 sync methods explained in detail |
| [DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md) | Step-by-step Render deployment guide |
| [README_ADMIN.md](README_ADMIN.md) | Admin endpoints & debugging |
| [SYNC_STRATEGY.md](SYNC_STRATEGY.md) | Data sync strategy & architecture |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Docker configuration details |

---

## 🐛 Troubleshooting

**Q: "Cannot connect to database"**  
A: Ensure `npm run db:up` succeeded and wait 10 seconds for postgres to initialize

**Q: "npm run sync:full stuck"**  
A: Check network connection. Sync can take 10-15 minutes. Check logs with `docker-compose logs backend`

**Q: "Frontend shows blank"**  
A: Make sure backend is running. Check `VITE_API_BASE_URL` in frontend .env

See detailed troubleshooting in [DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md#troubleshooting)

---

## 📝 License & Credits

**Project:** ProyectoDJCards2  
**Data Sources:**
- Pokémon TCG API (Official)
- TCGdex (Community)
- TCGTracking (Community)

---

---

# 🇬🇧 ENGLISH VERSION

## Quick Start

Same as above - follow "⚡ Quick Start" section

## Three Sync Methods

| Method | Command | Language | Source |
|--------|---------|----------|--------|
| English | `npm run sync:english` | 🇬🇧 English | Pokemon TCG API + TCGdex |
| Japanese | `npm run sync:japanese` | 🇯🇵 Japanese | TCGTracking + TCGdex |
| Chinese | `npm run sync:chinese` | 🇨🇳 Simplified Chinese | TCGdex |
| Full Sync | `npm run sync:full` | 🌍 All Languages | All APIs |

📖 **Detailed documentation:** [SYNC_METHODS.md](SYNC_METHODS.md)

---

**For full English docs, see all `.md` files above - all documentation is in Spanish and English**

---


# Obtener sets de Pokémon TCG API
curl http://localhost:3000/admin/api-debug/pokemontcg/sets?page=1&pageSize=50

# Obtener cartas de un set
curl "http://localhost:3000/admin/api-debug/pokemontcg/cards?setId=sv1&page=1"

# Obtener sets de TCGdex (multilenguaje)
curl "http://localhost:3000/admin/api-debug/tcgdex/sets?lang=en"

# Obtener grupos de TCGplayer
curl http://localhost:3000/admin/api-debug/tcgcsv/groups
```

### Endpoints de Sincronización (guardan en BBDD)

```bash
# Sincronizar todos los sets
curl -X POST http://localhost:3000/admin/sync/sets/pokemontcg
```

### Endpoints de Logs y Status

```bash
# Ver logs de API
curl http://localhost:3000/admin/logs?provider=pokemontcg&limit=50

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
