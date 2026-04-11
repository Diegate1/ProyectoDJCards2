# 🔧 Configuración de Puertos - Consistencia Garantizada

## ✅ Puertos Configurados

### Desarrollo Local (sin Docker)
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3000`
- **Database**: `localhost:5432` (PostgreSQL)
- **Adminer**: `http://localhost:8080`

### Docker Compose
- **Frontend**: `http://localhost:5173` (servicio `frontend`)
- **Backend**: `http://localhost:3000` (servicio `backend`)
- **Database**: `localhost:5432` (servicio `postgres`)
- **Adminer**: `http://localhost:8080` (servicio `adminer`)

---

## 🚀 Cómo Ejecutar

### Opción 1: Desarrollo Local (RECOMENDADO DURANTE DESARROLLO)

```bash
# Terminal 1: Iniciar DB
npm run db:up

# Terminal 2: Backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

**Acceso**: `http://localhost:5173`

---

### Opción 2: Docker Compose Completo

```bash
docker-compose up -d
```

**Acceso**: `http://localhost:5173`

---

## 📋 Verificación de Servicios

```bash
# Comprobación de disponibilidad

# Frontend
curl http://localhost:5173

# Backend (health check)
curl http://localhost:3000/health

# Base de datos (via adminer)
http://localhost:8080
# User: pokemon | Password: pokemon | Database: pokemontcg

# Cualquier API del backend
curl http://localhost:3000/admin/status/db
```

---

## 🔄 Proxy de API

**Frontend → Backend** está configurado en `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

Las peticiones a `/api/*` desde el frontend se redirigen automáticamente a `http://localhost:3000/api/*`

---

## ⚠️ Importante

**Los puertos son CONSISTENTES en todos los archivos:**
- ✅ `vite.config.ts`: `port: 5173`
- ✅ `src/main.ts`: `PORT = 3000`
- ✅ `docker-compose.yml`: `ports: "5173:5173", "3000:3000"`
- ✅ `.env.example`: `PORT=3000`

**NO CAMBIAR PUERTOS entre archivos. Mantener esta consistencia.**
