# 🚀 RENDER CONFIGURATION GUIDE - ProyectoDJCards2

**Detailed step-by-step deployment guide for Render.com**

**Date:** April 12, 2026  
**Target:** Production deployment with multi-service architecture

---

## 📋 TABLA DE CONTENIDOS

1. [Pre-requisitos](#pre-requisitos)
2. [Conceptos Render](#conceptos-render)
3. [Paso 1: Base de Datos PostgreSQL](#paso-1-base-de-datos-postgresql)
4. [Paso 2: Backend (NestJS/Express)](#paso-2-backend-nestjsexpress)
5. [Paso 3: Frontend (React)](#paso-3-frontend-react)
6. [Paso 4: Configuración de Variables](#paso-4-configuración-de-variables)
7. [Paso 5: Verificación & Testing](#paso-5-verificación--testing)
8. [Paso 6: Sincronización de Datos](#paso-6-sincronización-de-datos)
9. [Troubleshooting](#troubleshooting)
10. [URL Final](#url-final)

---

## ✅ PRE-REQUISITOS

Antes de empezar, necesitas:

```
☑️ Cuenta en Render.com (free tier es suficiente)
☑️ Repo en GitHub con código actualizado
☑️ Código pusheado a rama main/develop
☑️ Git instalado localmente
☑️ Docker instalado (para testing local)
```

### Verificar todo está en GitHub

```bash
# En terminal local, en raíz del proyecto
git log --oneline -3  # Ver últimos commits

# Si no está pusheado:
git push origin main
```

**⚠️ CRÍTICO:** Verify que `package-lock.json` exists en BOTH root AND `frontend/` directory:

```bash
# En terminal local, en raíz del proyecto
ls package-lock.json            # ✅ Root package-lock.json
ls frontend/package-lock.json   # ✅ Frontend package-lock.json

# Si alguno NO existe:
npm install
cd frontend && npm install && cd ..
git add package-lock.json frontend/package-lock.json
git commit -m "Add package-lock.json files"
git push origin main
```

**Por qué es importante?** 
- Docker builds usan `npm ci` (no `npm install`)
- `npm ci` **requiere** `package-lock.json` para reproductibilidad
- Sin él, el build falla con: `npm ERR! The package-lock.json file is missing`

### ✅ Fixes aplicados al repositorio

Este repositorio ya incluye correcciones importantes para Render deployment:

| Fix | Archivo | Descripción |
|-----|---------|------------|
| ✅ Import path correcto | `scripts/migration/migrate.ts` | Changed `../src/db/database` to `../../src/db/database` |
| ✅ BusyBox compatible | `docker-entrypoint.sh` | Removed `grep -P` (Alpine incompatible), using `sed` instead |
| ✅ Port listening | `src/main.ts` | Configured to listen on `0.0.0.0:${process.env.PORT}` |
| ✅ pg_isready for DB check | `docker-entrypoint.sh` | Using standard `pg_isready` command |
| ✅ **TypeScript compilation** | `Dockerfile` | **NUEVO:** Added `npm run build` before `npm run start` |
| ✅ Enhanced debugging | `docker-entrypoint.sh`, `src/main.ts`, `scripts/migration/migrate.ts` | Step-by-step logging with `set -eux` |

**Si ves errores relacionados a estos,** verificar que estás usando la última versión:
```bash
git log --oneline -3  # Ver últimos commits
# Debería incluir: "Fix critical Render deployment issues"

# Si no:
git pull origin main
```

---

## 🔍 CONCEPTOS RENDER

### ¿Cómo funciona Render?

```
GitHub Repository
        ↓
   [Webhook Push]
        ↓
Render Dashboard
        ↓
  [3 servicios independientes]
        ├─ PostgreSQL (Managed)
        ├─ Backend (Web Service)
        └─ Frontend (Web Service)
        ↓
   [Public URLs]
        ├─ backend.onrender.com
        └─ frontend.onrender.com
```

### Puntos clave

- ✅ Cada servicio es **independiente**
- ✅ Database es **managed por Render** (no containerizada)
- ✅ Backend y Frontend tienen sus propios **Dockerfiles**
- ✅ Cada uno escala/redeploya por separado
- ✅ Las URLs son **públicas y HTTPS**

---

## 🗄️ PASO 1: BASE DE DATOS POSTGRESQL

### 1.1 Abrir Render Dashboard

1. Ve a **https://dashboard.render.com**
2. Inicia sesión (crea cuenta si no tienes)
3. Deberías ver un botón **"New +"** en la esquina superior derecha

### 1.2 Crear PostgreSQL Database

1. Click **"New +"**
2. Select **"PostgreSQL"**

```
┌─ New + ─────────────────┐
│ ├─ Web Service          │
│ ├─ Background Worker    │
│ ├─ Cron Job            │
│ ├─ PostgreSQL ◄────────┤ Aquí
│ ├─ Redis               │
│ ├─ Private Service     │
│ └─ Disk                │
└────────────────────────┘
```

### 1.3 Configurar PostgreSQL

**Campos a rellenar:**

```yaml
Name:                 pokemontcg-db
Database:             pokemontcg
User:                 d01j  
Password:             [Render generará random]
Region:               N. Virginia (o EU-Frankfurt según tu zona)
Plan:                 Free Tier
PostgreSQL Version:   16 (recomendado)
```

**Pantalla esperada:**

```
┌──────────────────────────────────┐
│ Create New PostgreSQL            │
├──────────────────────────────────┤
│ Name:             pokemontcg-db  │
│ Database:         pokemontcg     │
│ User:             postgres       │
│ Password:         [auto]         │
│ Region:           N. Virginia    │
│ Plan:             Free           │
│                                  │
│ [Create Database]                │
└──────────────────────────────────┘
```

### 1.4 Guardar CONNECTION STRING

1. Click **"Create Database"**
2. **Esperar 2-3 minutos** a que esté "Available"
3. Cuando esté listo, verás el panel de database
4. **COPIAR la URL completa:**

```
postgresql://postgres:PASSWORD@dpg-xxxxx.render.com:5432/pokemontcg
```

**⚠️ IMPORTANTE:** Guardar esta URL en un lugar seguro (texto, 1password, etc)
Esta será tu `DATABASE_URL`

Internal Database URL: postgresql://d01j:xVRQSjznCxjwphzlorV4BGvaxGicT2YR@dpg-d7ds4ihf9bms738biflg-a/pokemontcg_7wdx
External Database URL: postgresql://d01j:xVRQSjznCxjwphzlorV4BGvaxGicT2YR@dpg-d7ds4ihf9bms738biflg-a.oregon-postgres.render.com/pokemontcg_7wdx
Usarname: d01j
Password: xVRQSjznCxjwphzlorV4BGvaxGicT2YR
port: 5432
Database: pokemontcg_7wdx
Hostname: dpg-d7ds4ihf9bms738biflg-a

---

## 🏗️ PASO 2: BACKEND (NESTJS/EXPRESS)

### 2.1 Crear Web Service para Backend

1. Click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect a repository"** (si es primera vez autorizar GitHub)
4. Buscar y seleccionar **ProyectoDJCards2**

### 2.2 Configuración Básica

**En formulario de creación:**

```yaml
Name:                 pokemontcg-backend
Environment:          Docker
Branch:               main  (o develop, según corresponda)
Build Command:        (dejar VACÍO - Render auto detecta Dockerfile)
Start Command:        (dejar VACÍO)
```

**Visual:**

```
┌─ Web Service Creation ──────────────┐
│ Name:          pokemontcg-backend   │
│ Environment:   Docker ⚫             │
│ Repository:    ProyectoDJCards2     │
│ Branch:        main                 │
│ Build Command: [EMPTY]              │
│ Start Command: [EMPTY]              │
└─────────────────────────────────────┘
```

### 2.3 Agregar Variables de Entorno

En la misma página, scroll down a **"Environment"**

Hacer click **"Add Environment Variable"** y agregar estas variables UNA POR UNA:

| Key | Value | Notas |
|-----|-------|-------|
| `NODE_ENV` | `production` | Modo producción |
| `PORT` | `3000` | Puerto (Render redirige) |
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@dpg-xxxxx...` | ⚠️ De paso anterior |
| `LOG_LEVEL` | `info` | Nivel de logs |
| `FRONTEND_URL` | `https://pokemontcg-frontend.onrender.com` | Frontend URL (llenará después) |
| `API_BASE_URL` | `https://pokemontcg-backend.onrender.com` | Backend URL |

**⚠️ NO dejes valores vacíos. Render necesita todos.**

### 2.4 Configuración de Región

- **Plan:** Free (ilimitado)
- **Region:** Same as database (N. Virginia)
- **Auto-Deploy:** On (default, auto-redeploy con push a GitHub)

### 2.5 Crear Backend Service

Click **"Create Web Service"**

**Render comenzará a:**
1. Buildear Docker image
2. Pushear a registry
3. Iniciar contenedor
4. Runear migrations (docker-entrypoint.sh)

**Monitor en tab "Logs"**

```
Building...
[===     ] 30%
[======= ] 70%
[========] Building complete
Starting service...
Running migrations...
Service running on port 3000
✓ Service Live
```

**Esperar hasta que diga "Live" (verde)** - puede tomar 5-10 minutos

### 2.6 Copiar URL del Backend

Una vez "Live":
- Click en el servicio
- En la parte superior, ver URL tipo: `https://pokemontcg-backend.onrender.com`
- **COPIAR esta URL** - la necesitarás para frontend

---

## 🎨 PASO 3: FRONTEND (REACT)

### 3.1 Crear Web Service para Frontend

1. Click **"New +"**
2. Select **"Web Service"**
3. Select **ProyectoDJCards2** (mismo repo)

### 3.2 Configuración

```yaml
Name:                 pokemontcg-frontend
Environment:          Docker
Branch:               main
Dockerfile:           frontend/Dockerfile  ⚠️ ESPECIFICAR esto
Build Command:        (dejar vacío)
Start Command:        (dejar vacío)
```

**⚠️ IMPORTANTE:** Render necesita saber que el Dockerfile está en `frontend/Dockerfile`

### 3.3 Variables de Entorno

Agregar ESTAS variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `VITE_API_BASE_URL` | `https://pokemontcg-backend.onrender.com` |

**⚠️ IMPORTANTE:** `VITE_API_BASE_URL` debe ser la URL del backend que copiaste en Paso 2.3

### 3.4 Crear Frontend Service

Click **"Create Web Service"**

Esperar a que esté "Live" (5-10 minutos)

### 3.5 Copiar URL del Frontend

Una vez "Live":
- URL: `https://pokemontcg-frontend.onrender.com`
- **GUARDAR para referencia**

---

## ⚙️ PASO 4: CONFIGURACIÓN DE VARIABLES

### 4.1 Actualizar Backend con Frontend URL

Ahora que tienes ambas URLs, actualizar la variable del backend:

1. En Render Dashboard → Backend Service → Settings
2. Find **`FRONTEND_URL`**
3. Update a: `https://pokemontcg-frontend.onrender.com`
4. Save

El backend se redeployará automáticamente.

### 4.2 Verificar All Variables

**Backend debería tener:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
LOG_LEVEL=info
FRONTEND_URL=https://pokemontcg-frontend.onrender.com
API_BASE_URL=https://pokemontcg-backend.onrender.com
```

**Frontend debería tener:**
```
NODE_ENV=production
VITE_API_BASE_URL=https://pokemontcg-backend.onrender.com
```

**Database:**
```
(Managed - no variables)
```

---

## ✅ PASO 5: VERIFICACIÓN & TESTING

### 5.1 Health Check Backend

En terminal o browser:

```bash
curl https://pokemontcg-backend.onrender.com/health
```

**Respuesta esperada:**
```json
{ "status": "ok" }
```

❌ Si falla: Ver sección [Troubleshooting](#troubleshooting)

### 5.2 Test API Endpoint

```bash
curl https://pokemontcg-backend.onrender.com/admin/status/db
```

Debería conectarse a la database.

### 5.3 Abrir Frontend en Browser

1. Abre en browser: **`https://pokemontcg-frontend.onrender.com`**
2. Verifica que carga sin errores
3. Intenta navegar a Cards/Sets
4. Si muestra datos: ✅ **TODO FUNCIONA**

### 5.4 Ver Logs

En caso de problemas:

**Backend Logs:**
- Dashboard → pokemontcg-backend → Logs
- Ver si hay errores

**Frontend Logs:**
- Dashboard → pokemontcg-frontend → Logs
- Chrome DevTools (F12 → Console)

---

## 🔄 PASO 6: SINCRONIZACIÓN DE DATOS

### Opción A: Automática (Recomendado)

Las migraciones corren automáticamente cuando el backend inicia (ver `docker-entrypoint.sh`).

**Para verificar:**
```bash
curl https://pokemontcg-backend.onrender.com/admin/status/db
```

Si dice "OK", las migraciones corrieron.

### Opción B: Manual desde Local

Si necesitas sincronizar datos desde tu máquina local:

```bash
# En terminal local (con DB_URL del Render)
export DATABASE_URL="postgresql://postgres:PASSWORD@dpg-xxxxx..."
npm run sync:full
```

**Nota:** Esto toma 5-10 minutos la primera vez.

### Opción C: Vía Backend Endpoint

```bash
# Si backend tiene endpoint de sync (check README_ADMIN.md)
curl -X POST https://pokemontcg-backend.onrender.com/admin/sync?type=full
```

(Depende de si endpoint está implementado)

---

## � ¿Deployment Fallando? → DEBUGGING GUIDE

**Si el backend no abre puerto o muestra errores:**

👉 Lee: [RENDER_DEBUGGING.md](RENDER_DEBUGGING.md)

Este documento incluye:
- ✅ Test 1: Server Startup (sin base de datos)
- ✅ Test 2: Database Connection
- ✅ Test 3: Migrations (full test)
- 🔍 Debugging variables: `SKIP_DATABASE`, `SKIP_MIGRATIONS`
- 📊 Common issues & fixes
- 📋 Debug checklist

**Uso rápido:**
```
Para testear solo el servidor (sin BD):
  SKIP_DATABASE=true
  SKIP_MIGRATIONS=true

Para testear conexión a BD:
  SKIP_DATABASE=false
  SKIP_MIGRATIONS=true

Para full test (server + DB + migrations):
  SKIP_DATABASE=false
  SKIP_MIGRATIONS=false
```

---

## �🐛 TROUBLESHOOTING

### ❌ Build fails: "npm ERR! The package-lock.json file is missing"

**Razón:** Docker build usa `npm ci` que requiere `package-lock.json` para reproducibilidad

**Solución (LOCAL):**
```bash
# En terminal local, en raíz del proyecto
npm install              # Genera root/package-lock.json
cd frontend
npm install              # Genera frontend/package-lock.json
cd ..
git add package-lock.json frontend/package-lock.json
git commit -m "Add package-lock.json files"
git push origin main
```

**Luego en Render:**
- Dashboard → (Backend o Frontend) → Manual Deploy
- El nuevo build usará los package-lock.json del repositorio

**⚠️ Nota:** Si ves este error, verifica que:
- `.gitignore` NO contiene `package-lock.json` (fue agregado a ese archivo)
- Ambos `package-lock.json` están en el repositorio (`git log --follow package-lock.json`)

### ❌ Backend shows "503 Service Unavailable"

**Razón:** Generalmente database connection error

**Soluciones:**
```bash
# 1. Verificar DATABASE_URL está correcta
# Revisar en Dashboard → Backend → Environment

# 2. Verificar que DATABASE_URL tiene formato correcto
# Debe ser: postgresql://user:pass@host:port/dbname

# 3. Verificar database está "Available" (verde)
# Dashboard → pokemontcg-db → Status

# 4. Si todo ve bien, forzar redeploy
# Dashboard → Backend → Manual Deploy
```

### ❌ Frontend shows blank/error

**Razón:** Backend no accesible o CORS issue

**Soluciones:**
```bash
# 1. Verificar backend está Live
curl https://pokemontcg-backend.onrender.com/health

# 2. Verificar VITE_API_BASE_URL en frontend
# Debe ser exacta: https://pokemontcg-backend.onrender.com

# 3. Check browser console (F12)
# Ver qué URL intenta conectar

# 4. Si cambió backend URL, redeploy frontend
# Dashboard → Frontend → Manual Deploy
```

### ❌ "Dockerfile not found"

**Razón:** Path incorrecto en configuración

**Solución:**
```
Verificar en Backend:
  Dockerfile path: (root)  ✅

Verificar en Frontend:
  Dockerfile path: frontend/Dockerfile  ✅
```

### ❌ Database connection timeout

**Razón:** Database no está lista o firewall issue

**Soluciones:**
1. Esperar 2-3 min más (Render database toma tiempo)
2. Revisar que region matches: N. Virginia
3. Intentar redeploy backend

### ❌ "ERROR: psql: server closed the connection unexpectedly"

**Razón:** Database connection string malformada o password incorrecto

**Solución:**
1. Copiar DATABASE_URL completa desde Render DB panel
2. Revisar que no hay caracteres especiales encoded mal
3. Pegar completa en Backend environment

### ❌ Migration fails: "Cannot find module '../src/db/database'"

**Razón:** Ruta de import relativa incorrecta (común en proyectos monorepo)

**Solución (ya aplicada en repo):**
- El archivo `scripts/migration/migrate.ts` debe usar: `../../src/db/database` (no `../src/db/database`)
- Si ves este error, verifica que la versión en GitHub tiene el fix

```bash
# Verificar que el import es correcto:
grep "from '../../src/db/database'" scripts/migration/migrate.ts
# Debería devolver el import correcto
```

### ❌ "grep: unrecognized option: P" or grep -P not found

**Razón:** Alpine/BusyBox no soporta Perl regex (`-P` flag)

**Solución (ya aplicada en repo):**
- El archivo `docker-entrypoint.sh` debe usar `sed` en lugar de `grep -oP` para extraer hostname
- Si ves este error en logs, verifica que Render está usando la última versión del repo:
  - Dashboard → Backend Service → "Manual Deploy" (fuerza rebuild)

### ❌ "Cannot find module '/app/dist/main'"

**Razón:** TypeScript no fue compilado a JavaScript. `npm run start` busca `dist/main.js` que no existe.

**Causa raíz:** Dockerfile anterior no incluía paso de compilación

**Solución (ya aplicada en repo):**
```bash
# Pull latest Dockerfile con build step
git pull origin main
git push
```

Luego en Render:
- Backend → "Manual Deploy" (fuerza rebuild con Dockerfile actualizado)

**Esperado en logs:**
```
🔨 Building TypeScript...
✓ Build completed
📌 Iniciando servidor: npm run start
✅ SERVER STARTED SUCCESSFULLY
```

Si sigue fallando:
1. Esperar 5-10 minutos (rebuild completo)
2. Si sigue: Backend → "Manual Deploy" nuevamente
3. Verificar que commits llegaron: `git log --oneline -3` debe incluir "Add TypeScript compilation"

### ❌ Backend starts but "No open ports detected"

**Razón:** Backend cae antes de abrir puerto por error en startup

**Causas posibles:**
1. Migration falla (ver arriba: "Cannot find module...")
2. DATABASE_URL malformada
3. Port variable no configurada

**Solución:**
1. Ver Backend Logs en Render Dashboard
2. Si hay error de migrations: revisar DATABASE_URL
3. Asegurarse que PORT=3000 está en variables
4. Hacer Manual Deploy después de revisar variables

---

## 📊 URL FINAL

Una vez todo funciona:

### URLs Públicas

```
Frontend (UI):    https://pokemontcg-frontend.onrender.com
Backend (API):    https://pokemontcg-backend.onrender.com
Database:         Managed by Render (private)
```

### Health Checks

```bash
# Health check backend
curl https://pokemontcg-backend.onrender.com/health

# Health check database via admin endpoint
curl https://pokemontcg-backend.onrender.com/admin/status/db

# Browse frontend
https://pokemontcg-frontend.onrender.com/
```

---

## 📋 CHECKLIST FINAL

Antes de dar por completado:

```
☑️ PostgreSQL database está "Available"
☑️ Backend service está "Live"
☑️ Frontend service está "Live"
☑️ Health check backend responde OK
☑️ Frontend carga en browser sin errores
☑️ Frontend puede mostrar datos
☑️ DATABASE_URL está configurada correctamente
☑️ VITE_API_BASE_URL apunta a backend
☑️ FRONTEND_URL en backend apunta a frontend
☑️ Auto-deploy habilitado (para futuros updates)
```

---

## 🔄 ACTUALIZACIONES FUTURAS

### Cuando hagas cambios en GitHub

```
1. Hacer cambios en código local
2. git commit && git push origin main
3. Esperar 1-2 minutos
4. Render auto-detecta push
5. Auto-rebuild y deploy
6. Ver en Logs cuando esté completo
```

### Manual redeploy si necesario

Dashboard → Select service → "Manual Deploy"

### Ver deployment history

Dashboard → Select service → "Deploys" tab

---

## 🎓 ADVANCED: MONITOREO

### Ver logs en tiempo real

```bash
# From terminal (si tienes Render CLI installed)
render logs pokemontcg-backend

# Or via Dashboard → Logs tab
```

### Configurar alertas

Dashboard → (select service) → Settings → Notifications

---

## 📞 SOPORTE & REFERENCIAS

**Render Official Docs:**
- PostgreSQL: https://render.com/docs/databases
- Docker: https://render.com/docs/docker
- Environment Variables: https://render.com/docs/environment-variables

**Project Docs:**
- Backend setup: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- API endpoints: [README_ADMIN.md](README_ADMIN.md)
- Sync detailed: [SYNC_METHODS.md](SYNC_METHODS.md)

---

## ✅ STATUS

| Step | Status | Time | Notes |
|------|--------|------|-------|
| 1. Database | ✅ Required | 2-3m | Leer paso 1 |
| 2. Backend | ✅ Required | 5-10m | Leer paso 2 |
| 3. Frontend | ✅ Required | 5-10m | Leer paso 3 |
| 4. Variables | ✅ Required | 2m | Leer paso 4 |
| 5. Testing | ✅ Critical | 5m | Leer paso 5 |
| 6. Sync Data | 🟡 Optional | 5-60m | Leer paso 6 |

**Total Time:** 25-45 minutos

---

## 🎉 DEPLOYMENT COMPLETE!

Una vez completados todos los pasos y pasadas las verificaciones:

```
✅ Backend en Render: https://pokemontcg-backend.onrender.com
✅ Frontend en Render: https://pokemontcg-frontend.onrender.com
✅ Database en Render (managed)
✅ Auto-deploy configurado
✅ Listo para producción
```

---

**Last updated:** April 12, 2026  
**Version:** 1.0  
**Status:** Complete & Ready
