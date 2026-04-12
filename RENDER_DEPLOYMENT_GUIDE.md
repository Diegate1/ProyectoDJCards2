# 🚀 Guía de Deployment Optimizada en Render

**Proyecto:** ProyectoDJCards2  
**Fecha:** Abril 2026  
**Estado:** Proyecto optimizado para Render ✅

---

## 📋 Pre-requisitos

- [ ] Cuenta en [Render.com](https://render.com)
- [ ] GitHub con código actualizado y pusheado
- [ ] Terminal con acceso al repositorio

---

## 🔄 PASO 1: Preparar el Proyecto (YA HECHO ✅)

Los siguientes cambios ya han sido aplicados:

✅ **Dockerfile Backend**: Usa puerto dinámico `PORT` environment variable  
✅ **Dockerfile Frontend**: Multi-stage build + serve estático  
✅ **docker-entrypoint.sh**: Detecta Render vs Docker Compose  
✅ **docker-compose.yml**: Actualizado con puertos correctos  
✅ **.env.example**: Documentado para Render y desarrollo local  
✅ **render.yaml**: Configuración base para servicios  

---

## 🌐 PASO 2: Crear Database en Render

### 2.1: Acceder a Render Dashboard

1. Ir a [https://dashboard.render.com](https://dashboard.render.com)
2. Ingresar o crear cuenta
3. Click **"New +"** en esquina superior derecha

### 2.2: Crear PostgreSQL Database

1. Select **"PostgreSQL"**
2. Configurar:
   - **Name:** `pokemontcg-db`
   - **Database:** `pokemontcg`
   - **User:** `postgres` (cambiar si quieres)
   - **Region:** Same as backend (ej: `N. Virginia` o `EU-Frankfurt`)
   - **Plan:** `Free` (para desarrollo/testing)

3. Click **"Create Database"**
4. **IMPORTANTE:** Esperar 2-3 minutos a que esté "Available" (verde)

### 2.3: Guardar DATABASE_URL

1. Una vez creada, copiar la URL completa:
   ```
   postgresql://user:PASSWORD@dpg-xxxxx.render.com:5432/pokemontcg
   ```
2. **Guardar en lugar seguro** (será usada en backend)

---

## 🏗️ PASO 3: Crear Backend Service

### 3.1: Nueva Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Autorizar GitHub y seleccionar `ProyectoDJCards2`

### 3.2: Configuración Básica

```
Name:              pokemontcg-backend
Environment:       Docker
Branch:            main (o develop)
Build Command:     (dejar vacío)
Start Command:     (dejar vacío)
Root Directory:    (dejar vacío)
```

### 3.3: Variables de Entorno

Click-añadir estas variables una por una:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| PORT | 3000 |
| LOG_LEVEL | info |
| DATABASE_URL | `postgresql://user:PASSWORD@dpg-xxxxx.render.com:5432/pokemontcg` |
| FRONTEND_URL | `https://pokemontcg-frontend.onrender.com` |
| API_BASE_URL | `https://pokemontcg-backend.onrender.com` |

> Reemplazar `pokemontcg-frontend` y `pokemontcg-backend` con nombres de tus servicios

### 3.4: Plan y Región

- **Plan:** Free (ilimitado en repo público)
- **Region:** Mismo que database (ej: `N. Virginia`)
- **Auto-Deploy:** Activado

### 3.5: Crear Servicio

Click **"Create Web Service"**

- Render comenzará a construir la imagen Docker
- Monitor en tab **"Logs"** para ver progreso
- Esperar a que status sea **"Live"** (2-5 minutos)

---

## 🎨 PASO 4: Crear Frontend Service

### 4.1: Nueva Web Service (Repetir PASO 3)

1. **"New +"** → **"Web Service"**
2. Conectar repositorio `ProyectoDJCards2`

### 4.2: Configuración

```
Name:              pokemontcg-frontend
Environment:       Docker
Branch:            main
Build Command:     (dejar vacío)
```

### 4.3: Variables de Entorno

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| VITE_API_BASE_URL | `https://pokemontcg-backend.onrender.com` |

### 4.4: Crear Servicio

Click **"Create Web Service"** y esperar a que esté **"Live"**

---

## ✅ PASO 5: Verificar Deployment

### 5.1: Health Checks

```bash
# Backend
curl https://pokemontcg-backend.onrender.com/health

# Respuesta esperada:
{ "status": "ok" }
```

### 5.2: Abrir en Browser

```
Frontend:  https://pokemontcg-frontend.onrender.com
Backend:   https://pokemontcg-backend.onrender.com/admin/status/db
```

### 5.3: Verificar Logs

En cada servicio (Dashboard):
- Click servicio
- Tab **"Logs"**
- Buscar errores (debe estar limpio)

---

## 🔄 PASO 6: Migración Inicial de Datos (OPCIONAL)

Una vez que backend está Live:

### Opción A: Vía Health Check (recomendado)

```bash
# Verificar que migrations corrieron automáticamente
curl https://pokemontcg-backend.onrender.com/admin/status/db

# Debería responder con estado OK
```

### Opción B: Sincronización de datos (si necesitas datos iniciales)

```bash
# En terminal local con acceso al repo
npm run sync:full
```

Esto sincroniza datos desde APIs externas (Pokemon TCG, TCGDEX, etc)

---

## 🚨 Troubleshooting

### Backend no inicia (Failed to start)?

1. Verificar **Logs** en Dashboard
2. Revisar **DATABASE_URL** está correcta
3. Comprobar que **PORT es 3000**

```bash
# Debug: Ver último log
curl https://pokemontcg-backend.onrender.com/health -v
```

### Frontend muestra error 502?

1. Verificar **VITE_API_BASE_URL** está correcto
2. Revisar que backend esté **Live**
3. Limpiar cache del browser (Ctrl+Shift+Del)

### Database connection timeout?

1. Verificar que **DATABASE_URL copió correctamente** (revisar password)
2. Esperar a que database esté completamente **Available**
3. En Dashboard → PostgreSQL → Settings → Revisar status

---

## 📝 Cambios Realizados en el Proyecto

1. **Dockerfile Backend**
   - Ahora escucha en variable `PORT` (Render asigna dinámicamente)
   - Script entrypoint compatible con Render

2. **Dockerfile Frontend**
   - Multi-stage build (compilation + production)
   - Sirve contenido estático con `serve`
   - Puerto 3000 (Render redirige)

3. **docker-entrypoint.sh**
   - Detecta automáticamente Render vs Docker Compose
   - Migraciones automáticas al iniciar

4. **docker-compose.yml**
   - Puertos estandarizados (backend 3000, frontend 3000)
   - Compatible con entorno local

5. **.env.example**
   - Documentación clara de variables
   - Diferenciación desarrollo vs producción

6. **render.yaml**
   - Configuración declarativa (opcional)
   - Puede ser usada para automatizar setup

---

## 🎯 Recomendaciones Post-Deploy

- ✅ Monitorear **Logs** regularmente
- ✅ Configurar **Alertas** en Render Dashboard
- ✅ Hacer **backups** de database (Settings → Backups)
- ✅ Actualizar credenciales después de cada deploy
- ✅ Usar **custom domain** cuando sea disponible

---

## 📞 Soporte

- Render Docs: [https://render.com/docs](https://render.com/docs)
- Docker Docs: [https://docs.docker.com](https://docs.docker.com)
- Project Issues: Ver `DEPLOYMENT_RENDER.md` (anterior guide)
