# 🚀 Deployment Guide: Render

**Proyecto:** ProyectoDJCards2  
**Plataforma:** Render.com (Docker)  
**Última actualización:** Abril 11, 2026

---

## 📋 Pre-requisitos

- [ ] Cuenta en [Render.com](https://render.com)
- [ ] Repositorio GitHub con código actualizado
- [ ] Docker configured locally (verificado con `docker --version`)
- [ ] Variables de entorno documentadas

---

## 🏗️ ARQUITECTURA EN RENDER

```
GitHub Repository
       ↓
   [Push]
       ↓
Render Native Runtime (Docker)
    ├── PostgreSQL Database (Render Managed)
    ├── Backend Service (NestJS on Node)
    ├── Frontend Service (React/Vite on Node)
    └── Adminer (optional, for DB debugging)
       ↓
   [Public URLs]
       ├── https://your-app.onrender.com (backend)
       ├── https://your-frontend.onrender.com (frontend)
       └── https://your-db-admin.onrender.com (adminer)
```

---

## 1️⃣ CREAR DATABASE EN RENDER

### Paso 1.1: Crear PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configurar:
   - **Name:** `pokemontcg-db` (o similar)
   - **Database:** `pokemontcg`
   - **User:** `postgres` (default, cambiar)
   - **Region:** Same as backend (ej: N. Virginia, EU-Frankfurt)
   - **Plan:** Free tier para desarrollo

4. Click **"Create Database"**
5. **⚠️ SAVE:** Copiar la DATABASE_URL completa (incluye password) a un lugar seguro

```
// Ejemplo de DATABASE_URL (GUARDAR EN SEGURO)
postgresql://postgres:SECURE_PASSWORD@dpg-xxx.render.com:5432/pokemontcg
```

### Paso 1.2: Verificar conexión

- Esperar 2-3 minutos a que database esté ready
- Status debe ser "Available" (verde)
- No hacer nada hasta que esté listo

---

## 2️⃣ CREAR BACKEND SERVICE EN RENDER

### Paso 2.1: Conectar repositorio GitHub

1. En Render Dashboard: **"New +"** → **"Web Service"**
2. **"Connect a repository"** → Autorizar GitHub → Seleccionar `ProyectoDJCards2`
3. Configurar:
   - **Name:** `pokemontcg-backend`
   - **Environment:** `Docker`
   - **Branch:** `main` (o `develop`, como corresponda)
   - **Build Command:** (dejar en blanco, usa Dockerfile)
   - **Start Command:** (dejar en blanco)

### Paso 2.2: Variables de Entorno

Agregar en Render:

```bash
# Environment Variables (en Render dashboard)
NODE_ENV=production
PORT=10000  # Render asigna puerto dinámico, app debe escuchar aquí

# Database
DATABASE_URL=postgresql://postgres:PASSWORD@dpg-xxx.render.com:5432/pokemontcg

# Logging
LOG_LEVEL=info
SYNC_VERBOSE=false

# API URLs (si necesario)
FRONTEND_URL=https://your-frontend.onrender.com
API_BASE_URL=https://your-backend.onrender.com
```

### Paso 2.3: Configuración de Deploy

Editar `Dockerfile` (si es necesario):

```dockerfile
# Dockerfile - VERIFICAR QUE ESTÁ ACTUALIZADO

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build (si es necesario)
# Pueden compilar TypeScript a JS acá

# Expose port (Render asigna dinámicamente)
EXPOSE 10000

# Start
CMD ["node", "-r", "ts-node/register", "src/main.ts"]
# O si precompilan:
# CMD ["node", "dist/main.js"]
```

**⚠️ IMPORTANTE:** El Dockerfile debe:
- Escuchar en `process.env.PORT` (NO hardcoded 3000)
- No tener `npm install -g ts-node` (usar como dev dependency)
- Establecer `NODE_ENV=production`

### Paso 2.4: Migrations automáticas al iniciar

En `docker-entrypoint.sh`:

```bash
#!/bin/bash

# Run migrations automatically
echo "Running database migrations..."
npm run migrate

# Start the application
echo "Starting backend..."
npm run start:prod
```

Updates el CMD en Dockerfile:
```dockerfile
ENTRYPOINT ["./docker-entrypoint.sh"]
```

### Paso 2.5: Deploy inicial

- Click **"Create Web Service"**
- Render automáticamente:
  - Ve cambios en GitHub
  - Construye Docker image
  - Inicia servicio
- Monitor en **"Logs"** tab (verificar no hay errores)
- Esperar hasta que status sea "Live" (verde)

---

## 3️⃣ CREAR FRONTEND SERVICE EN RENDER

### Paso 3.1: Web Service para Frontend

1. **New** → **Web Service**
2. Conectar GitHub, seleccionar repo
3. Configurar:
   - **Name:** `pokemontcg-frontend`
   - **Environment:** `Docker`
   - **Runtime:** Node

### Paso 3.2: Variables de Entorno

```bash
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend.onrender.com/api
DOCKER_ENVIRONMENT=true
```

### Paso 3.3: Dockerfile Frontend

Verificar `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build Vite app
RUN npm run build

# Serve with Node (usamos small-http-server)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**Alternativa: Usar Express estático:**
```javascript
// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Paso 3.4: Deploy

Click **"Create Web Service"** y esperar a que esté Live

---

## 4️⃣ CONFIGURAR REDIS (Opcional, para caché)

Si necesitan caché o sesiones:

1. **New** → **Redis**
2. Configurar plan (Free or Starter)
3. Copiar **Redis URL** a variables de entorno del backend

```bash
REDIS_URL=redis://default:password@redis-hostname:port
```

---

## 5️⃣ VERIFICAR DEPLOYMENT

### 5.1: Health Checks

En backend, agregar health endpoint:

```typescript
// src/main.ts o routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
```

### 5.2: Test de Conectividad

```bash
# Desde terminal local
curl https://your-backend.onrender.com/health

# Debería responder:
{ "status": "OK", "timestamp": "2026-04-11T..." }
```

### 5.3: Verificar API endpoints

```bash
curl https://your-backend.onrender.com/api/sets/health
curl https://your-backend.onrender.com/api/cards
```

### 5.4: Verificar Frontend

Abrir en browser: `https://your-frontend.onrender.com`

---

## 6️⃣ SYNC INICIAL DE DATOS

Una vez deployer está vivo, ejecutar sync:

### Opción A: Via API Admin Endpoint

```bash
# SSH a backend container O usar curl
curl -X POST https://your-backend.onrender.com/admin/sync?type=full
```

### Opción B: Via Manual Script en Render Shell

1. Backend service → **"Shell"** tab
2. ```bash
   npm run sync:full
   ```

### Opción C: Via Render Job (Recommended)

Crear **Render Cron Job**:
1. **New** → **Background Job**
2. **Schedule:** `0 0 * * 0` (weekly on Sunday)
3. **Command:** `npm run sync:full`
4. **Environment:** Same como backend

---

## 7️⃣ CONFIGURAR DOMINIO PERSONALIZADO (Opcional)

1. Backend service → **"Settings"** → **"Custom Domain"**
2. Ingresar dominio (ej: `api.mysite.com`)
3. Seguir instrucciones DNS (actualizar CNAME)
4. Repeat para frontend

---

## 🔍 TROUBLESHOOTING

### Problema: "Port already in use"
**Causa:** App hardcoded a puerto 3000  
**Solución:** Cambiar a `process.env.PORT || 3000`

### Problema: "Cannot find module 'ts-node'"
**Causa:** ts-node no está en dependencies  
**Solución:** ```bash
npm install --save-dev ts-node ts-node/esm
```

### Problema: "Cannot connect to database"
**Causa:** DATABASE_URL inválida o red issues  
**Solución:**
- Verificar DATABASE_URL en env vars
- Asegurar same region para backend + database
- Verificar IP whitelisting (Render maneja automáticamente)

### Problema: "Frontend shows blank or 404"
**Causa:** Vite build no fue exitoso  
**Solución:**
- Revisar logs: Frontend service → Logs
- Verificar `npm run build` funciona localmente
- ```bash
  npm install
  npm run build
  # Revisar que `dist/` tiene archivos
  ```

### Problema: "Sync endpoint returns 504 Gateway Timeout"
**Causa:** Operación toma > 30 segundos  
**Solución:**
- Usar Render Background Job en lugar de API call
- Configurar retry mechanism
- Split sync en chunks más pequeños

---

## 📊 MONITORING & LOGGING

### 1. Ver Logs en Render

- Dashboard → Service → **"Logs"** tab
- Filtrar por:
  - **Duration:** Last hour, day, week
  - **Level:** Error, Warning, Info

### 2. Alertas

Settings → **"Notification"** → Configurar:
- Email on deploy failure
- Email on service crash

### 3. Métricas

Dashboard: CPU, Memory, Network usage

---

## 💾 BACKUPS & DISASTER RECOVERY

### Database Backups

Render automáticamente:
- ✅ Backups diarios (7 días retención)
- ✅ Point-in-time recovery
- ✅ Manual backup en settings

Para reproducir completamente:
1. Si database se daña → Restore from backup
2. Re-run migrations (`npm run migrate`)
3. Re-run sync (`npm run sync:full`)

### Code Recovery

- Código está en GitHub (source of truth)
- Render auto-deploys en push
- Siempre tener rama estable en main/master

---

## 🔐 SECURITY CHECKLIST

- [ ] DATABASE_URL no está en código (usa env vars)
- [ ] NODE_ENV=production en Render
- [ ] API keys NO están en Dockerfile
- [ ] Cors configurado para dominio frontend
- [ ] Validación de inputs en API endpoints
- [ ] Rate limiting activado (opcional)
- [ ] HTTPS enforced (Render lo hace automático)

---

## 📝 CHECKLISTA DE DEPLOYMENT FINAL

- [ ] Código limpio y probado localmente
- [ ] docker-compose.yml revisado
- [ ] Dockerfile actualizado (no hardcode ports)
- [ ] package.json scripts funcionales
- [ ] database/migrations ejecutadas
- [ ] .env.render creado con variables seguras
- [ ] GitHub repo actualizado
- [ ] PostgreSQL database en Render creada
- [ ] Backend service configurado y desplegado
- [ ] Frontend service configurado y desplegado
- [ ] Health endpoints funcionando
- [ ] Sync inicial completado
- [ ] Dominios personalizados configurados (opcional)
- [ ] Backups verificados
- [ ] Monitoring activo
- [ ] Team notificado de URLs de producción

---

## 🎯 RESUMEN DE URLS

Después de deployment, tendrán:

```
Backend API:       https://pokemontcg-backend.onrender.com
Frontend:          https://pokemontcg-frontend.onrender.com
Database Admin:    postgresql://user:pass@dpg-xxx.render.com
Health Check:      https://pokemontcg-backend.onrender.com/health
API Sets:          https://pokemontcg-backend.onrender.com/api/sets
API Cards:         https://pokemontcg-backend.onrender.com/api/cards
Admin Debug:       https://pokemontcg-backend.onrender.com/admin
```

---

## 📞 SOPORTE

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Our GitHub Issues:** [Project Repo/Issues]

---

**Última actualización:** 11 Abril 2026  
**Version:** 1.0  
**Status:** 🟢 Production Ready
