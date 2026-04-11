# 📋 Resumen Ejecutivo - ProyectoDJCards2

## ¿Qué es?

Sistema de ingestión y sincronización de datos de **Pokémon Trading Card Game** desde 3 APIs diferentes a una base de datos centralizada PostgreSQL, con pantalla admin para debug y sincronización manual.

---

## 📊 Datos que Ingiere

| Fuente | De dónde | Qué Trae |
|--------|----------|---------|
| **Pokémon TCG API** | api.pokemontcg.io | Sets oficiales + Cartas jugables |
| **TCGdex** | api.tcgdex.net | Multilenguaje (EN, ES, JA, etc.) + Enriquecimiento |
| **TCGCSV** | tcgcsv.com | Productos sellados (Boxes, Tins) + Precios de marketplace |

---

## 🗄️ Estructura de BD

### Tablas Principales

| Tabla | Rows | Propósito |
|-------|------|----------|
| `sources` | 3 | Catálogo de fuentes de datos |
| `sets` | ~250 | Sets canónicos internos |
| `set_external_refs` | ~500 | Mapeo entre sets de diferentes APIs |
| `cards` | ~100K | Cartas canónicas |
| `card_external_refs` | ~200K | Mapeo entre cartas de diferentes APIs |
| `card_attacks` | ~300K | Ataques de cartas |
| `card_abilities` | ~50K | Habilidades de cartas |
| `products` | ~100K | Productos de marketplace (single + sealed) |
| `product_prices` | ~500K | Histórico de precios (con timestamp) |
| `api_logs` | ∞ | Auditoría de todas las llamadas API |

**Total estimado**: ~1-2M de registros

---

## 🏗️ Arquitectura

```
ProyectoDJCards2/
├── src/
│   ├── main.ts                    # Punto de entrada
│   ├── common/
│   │   ├── types.ts              # Interfaces de APIs
│   │   ├── utils.ts              # Helpers comunes
│   │   └── api-log.service.ts    # Servicio de logs
│   ├── db/
│   │   ├── database.ts           # Cliente PostgreSQL
│   │   └── migrations/           # Migraciones SQL
│   └── modules/
│       ├── pokemon-tcg/          # 📟 Cliente API
│       ├── tcgdex/               # 📟 Cliente API
│       ├── tcgcsv/               # 📟 Cliente API
│       ├── sync/                 # 🔄 Sincronización
│       │   ├── set-sync.service.ts
│       │   ├── card-sync.service.ts
│       │   └── product-sync.service.ts
│       └── admin/                # 🎛️ Dashboard
│           ├── admin.controller.ts
│           └── admin.routes.ts
├── scripts/
│   ├── migrate.ts                # Ejecutar migraciones
│   ├── full-sync.ts              # Sync completo
│   └── sync-set.ts               # Sync de set individual
├── docker-compose.yml            # BD + GUI
├── package.json                  # Dependencias
└── README*.md                    # Documentación
```

---

## 🔌 Endpoints Admin

### 🔍 Debug (Sin guardar)

```
GET  /admin/api-debug/pokemontcg/sets        # Ver sets raw
GET  /admin/api-debug/pokemontcg/cards       # Ver cartas raw
GET  /admin/api-debug/tcgdex/sets            # Ver sets TCGdex
GET  /admin/api-debug/tcgcsv/groups          # Ver grupos marketplace
```

### 💾 Sync (Guardar en BD)

```
POST /admin/sync/sets/pokemontcg             # Sincronizar todos los sets
POST /admin/sync/cards/:setId                # Sincronizar cartas de un set
POST /admin/sync/cards                       # Sincronizar TODAS las cartas
POST /admin/sync/products/:groupId           # Sincronizar productos de un grupo
POST /admin/sync/products                    # Sincronizar TODOS los productos
```

### 📊 Logs y Status

```
GET  /admin/logs?provider=pokemontcg         # Ver logs de APIs
GET  /admin/status/db                        # Conteos de tablas
```

---

## 🚀 Flows Típicos

### First Run (Sincronización Completa)

```
npm run db:up      → PostgreSQL + Adminer en localhost:5432
npm run migrate    → Crear tablas y esquema
npm run sync:full  → Sincronizar: sets → cartas → productos
curl /admin/status/db  → Verificar resultado
```

**Tiempo estimado**: 2-6 horas (depende de rate limits)

### Development Run

```
npm run dev                    → Servidor en localhost:3000
curl /admin/api-debug/...     → Debug sin guardar
curl -X POST /admin/sync/...  → Sincronizar bajo demanda
```

### Sincronizar Solo Un Set

```
npm run sync:set sv1           → Sincroniza set sv1 + todas sus cartas
npm run sync:set sv2           → Sincroniza set sv2 + todas sus cartas
```

---

## 🔑 Características Principales

✅ **3 fuentes de datos integradas**
- Pokémon TCG API (oficial)
- TCGdex (multilenguaje)
- TCGCSV (productos y precios)

✅ **Sincronización inteligente**
- Upserts idempotentes (seguro ejecutar 2 veces)
- Rate limiting respetado
- Reintentos exponenciales

✅ **Auditoría completa**
- Raw JSON guardado de cada API
- Logs de todas las llamadas HTTP
- Timestamps en precios

✅ **Admin Dashboard**
- Debug endpoints (ver datos sin guardar)
- Sync endpoints (guardar en BD)
- Logs y status de BD

✅ **TypeScript + PostgreSQL**
- Tipado completo
- Migraciones automáticas
- Índices optimizados

---

## 📈 Escalabilidad

| Métrica | Capacidad |
|---------|-----------|
| **Sets** | ~200-250 |
| **Cartas por set** | 50-1000 |
| **Cartas totales** | ~100-150K |
| **Productos** | ~500K |
| **Precios históricos** | ∞ (con timestamp) |

**BD Size**: ~5-10 GB después de sync completo

---

## 🔐 Rate Limits

| API | Sin Key | Con Key |
|-----|---------|---------|
| Pokémon TCG | 1000/día, 30/min | 20000/día, depende |
| TCGdex | Sin límite | Sin límite |
| TCGCSV | Sin límite | Sin límite |

**Respetados**: Sí, con delays automáticos

---

## 📦 Dependencias Principales

- `express` - Web framework
- `@nestjs/common` - Módulos
- `pg` - Cliente PostgreSQL
- `axios` - Cliente HTTP
- `dotenv` - Config
- `uuid` - Identificadores únicos
- `typescript` - Type system

---

## 🔄 Estados de Sincronización

### ✅ Completado
- [x] Docker + PostgreSQL
- [x] Migraciones SQL
- [x] Clientes de 3 APIs
- [x] Servicios de sync (sets, cartas, productos)
- [x] Admin endpoints
- [x] Sistema de logs
- [x] Scripts de sincronización
- [x] Documentación

### 🚧 En Progreso
- [ ] UI web dashboard (React/Vue)
- [ ] Mapeo avanzado entre APIs
- [ ] Validaciones de data quality

### 📋 Futuros
- [ ] GraphQL API
- [ ] WebSockets para sincronización en vivo
- [ ] Cache Redis
- [ ] Email alerts
- [ ] ML para predicción de precios

---

## 📚 Documentación

| Archivo | Para |
|---------|------|
| **QUICKSTART.md** | Empezar en 5 minutos |
| **README.md** | Setup y architecture |
| **README_ADMIN.md** | Endpoints y ejemplos cURL |
| **pokemontcg_api_guide.md** | Detalle técnico de APIs |

---

## ❓ FAQ

**¿Cuánto tarda sincronizar todo?**
- Sets: 30 segundos
- Cartas: 2-6 horas (depende de rate limits)
- Productos: 1-3 horas

**¿Puedo sincronizar de nuevo sin borrar?**
- Sí, los upserts son idempotentes

**¿Necesito API key?**
- No es obligatorio, pero recomendado (aumenta límites)

**¿Se sincroniza continu­amente?**
- No, es manual. Los scripts son puntuales.

**¿Puedo agregar más APIs?**
- Sí, el arquitecto está preparado para extensión

---

## 🎯 Próximo Paso

Lee **QUICKSTART.md** para empezar en 5 minutos.

```bash
npm install
npm run db:up
npm run migrate
npm run dev
curl "http://localhost:3000/admin/status/db"
```

¡Listo! 🚀
