# 🐳 Configuración 100% Dockerizada - ProyectoDJCards2

## 🚀 Inicio Rápido

### Arrancar todo con un comando:

```bash
docker-compose up -d
```

Eso es todo. El sistema se inicia con:
- ✅ PostgreSQL
- ✅ Backend (con migraciones automáticas)
- ✅ Frontend (React + Vite)
- ✅ Adminer (GUI de BD)

---

## 📍 Acceso

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Dashboard** | http://localhost:5173/dashboard |
| **Backend API** | http://localhost:3000 |
| **Health Check** | http://localhost:3000/health |
| **Base de Datos** | http://localhost:8080 |
| | User: `pokemon` |
| | Pass: `pokemon` |
| | DB: `pokemontcg` |

---

## 🔍 Monitorear Logs

```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend

# Ver logs solo de PostgreSQL
docker-compose logs -f postgres
```

---

## 🛑 Detener Todo

```bash
docker-compose down

# Con eliminación de volúmenes (BD se borra)
docker-compose down -v
```

---

## 🔄 Reiniciar Limpio

```bash
# Eliminar todo y reiniciar
docker-compose down -v
docker-compose up -d

# Verá algo como:
# ⏳ Esperando a PostgreSQL...
# ✓ PostgreSQL está listo
# 🔄 Ejecutando migraciones...
# ✓ Migration executed: 001_initial_schema.sql
# ✓ Migration executed: 002_add_language_support.sql
# ✓ Migraciones completadas
# 🎉 Backend listo
```

---

## ✅ Verificar Estado

```bash
# Ver estado de servicios
docker-compose ps

# Esperado:
# NAME                  STATUS
# pokemon_postgres      Up (healthy)
# pokemon_backend       Up
# pokemon_frontend      Up
# pokemon_adminer       Up
```

---

## 🔧 Comandos Útiles

```bash
# Ejecutar comando en un contenedor
docker-compose exec backend npx ts-node scripts/sync-set.ts sv1

# Acceder a la BD via CLI
docker-compose exec postgres psql -U pokemon pokemontcg

# Ver variables de entorno en un servicio
docker-compose exec backend env

# Forzar rebuild de imágenes
docker-compose up -d --build

# Limpiar todo (imágenes, volúmenes, redes)
docker-compose down -v --remove-orphans
docker system prune -a
```

---

## ⚙️ Variables de Entorno

### Backend
- `NODE_ENV`: `production` (configurado en docker-compose.yml)
- `PORT`: `3000`
- `DATABASE_URL`: `postgresql://pokemon:pokemon@postgres:5432/pokemontcg`

### Frontend
- `VITE_API_URL`: `http://backend:3000` (apunta al backend dentro de Docker)

---

## 📝 Estructura de Servicios

```yaml
docker-compose.yml:
├── postgres (5432)
│   ├── healthcheck ✓
│   └── volumes: postgres_data
├── backend (3000)
│   ├── depends_on: postgres (healthy)
│   ├── migrations: automáticas
│   └── entrypoint: docker-entrypoint.sh
├── frontend (5173)
│   ├── depends_on: backend
│   └── proxy: /api → backend:3000
├── adminer (8080)
│   └── depends_on: postgres
└── network: pokemon_network (bridge)
```

---

## 🐛 Troubleshooting

### Frontend no puede conectar con Backend
**Problema**: `Error: Cannot GET /api/...`

**Solución**: Verificar que `docker-compose logs frontend` muestre:
```
VITE_API_URL=http://backend:3000
```

Si no, reconstruir:
```bash
docker-compose down
docker-compose up -d --build
```

### Migraciones no se ejecutan
**Problema**: Backend inicia pero no ve las migraciones

**Solución**:
```bash
# Ver logs del backend
docker-compose logs backend

# Debería mostrar:
# ✓ Migration executed: 001_initial_schema.sql
# ✓ Migration executed: 002_add_language_support.sql
```

Si falta, verificar que las carpetas estén correctamente copiadas:
```bash
docker-compose exec backend ls -la /app/db/migrations/
```

### PostgreSQL no inicia
**Problema**: `Error: pod network is misconfigured`

**Solución**:
```bash
docker-compose down -v
docker-compose up -d --remove-orphans
```

---

## 📚 Documentación Completa

- **README.md** - Setup detallado
- **QUICKSTART.md** - Guía rápida
- **README_ADMIN.md** - Endpoints disponibles
- **PORTS_CONFIG.md** - Configuración de puertos

