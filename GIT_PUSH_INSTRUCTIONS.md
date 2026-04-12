# 📤 Instrucciones para Subir Cambios a Git

## 🎯 Objetivo
Subir todos los cambios de optimización para Render al repositorio Git

---

## 📊 Resumen de Cambios

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `Dockerfile` | Escucha en `PORT` variable | Render asigna dinámicamente |
| `docker-entrypoint.sh` | Detecta Render vs Docker | Compatible con ambos |
| `frontend/Dockerfile` | Multi-stage + serve | Mejor build para producción |
| `docker-compose.yml` | Puertos estandarizados (3000) | Consistencia |
| `.env.example` | Actualizado | Guía para variables |
| `render.yaml` | Nuevo | Configuración Render |
| `RENDER_DEPLOYMENT_GUIDE.md` | Nuevo | Guía paso-a-paso |

---

## ⚙️ PASO 1: Verificar cambios

Abre una terminal en la raíz del proyecto:

```bash
# Ver archivos modificados
git status

# Debería mostrar:
# Modified: Dockerfile
# Modified: docker-entrypoint.sh
# Modified: frontend/Dockerfile
# Modified: docker-compose.yml
# Modified: .env.example
# Untracked: render.yaml
# Untracked: RENDER_DEPLOYMENT_GUIDE.md
```

---

## ⚙️ PASO 2: Revisar cambios (IMPORTANTE)

Antes de hacer commit, verifica los cambios:

```bash
# Ver diferencias detalladas
git diff Dockerfile
git diff docker-entrypoint.sh
git diff frontend/Dockerfile
git diff docker-compose.yml
git diff .env.example

# Ver archivos nuevos
git status
```

**✅ Todo debe verse bien** - Verifica que:
- Scripts de entrypoint sean válidos
- Puertos sean consistentes (3000)
- Variables de entorno sean correctas

---

## 📝 PASO 3: Agregar todos los cambios

```bash
# Opción A: Agregar archivos individuales (RECOMENDADO)
git add Dockerfile
git add docker-entrypoint.sh
git add frontend/Dockerfile
git add docker-compose.yml
git add .env.example
git add render.yaml
git add RENDER_DEPLOYMENT_GUIDE.md

# O Opción B: Agregar todo de una vez
git add .
```

---

## 💾 PASO 4: Crear commit descriptivo

```bash
git commit -m "🚀 Optimizar proyecto para despliegue en Render

- Estandarizar puertos (backend 3000, frontend 3000)
- Dockerfile backend escucha en PORT env variable
- Dockerfile frontend con multi-stage build
- docker-entrypoint.sh compatible con Render y Docker Compose
- Actualizar .env.example con variables Render
- Agregar render.yaml configuración
- Agregar RENDER_DEPLOYMENT_GUIDE.md paso-a-paso

BREAKING: Cambio puerto backend de 10000 a 3000
MIGRATION: Revisar .env variables antes de iniciar"
```

**Explicación del commit:**
- 🚀 Emoji acción principal
- Descripción clara y concisa
- BREAKING: si hay cambios incompatibles
- MIGRATION: si requiere acciones adicionales

---

## 🚀 PASO 5: Subir a GitHub

### Opción A: Branch actual (main/develop)

```bash
# Ver branch actual
git branch

# Subir cambios
git push origin HEAD
# O simplemente:
git push
```

### Opción B: Crear rama de feature (RECOMENDADO)

```bash
# Crear rama nueva
git checkout -b feature/render-optimization

# Subir rama
git push -u origin feature/render-optimization

# Luego: Crear Pull Request en GitHub
# Ir a https://github.com/tu-user/ProyectoDJCards2
# Click "Compare & Pull Request"
```

---

## ✅ PASO 6: Verificar en GitHub

1. Ir a [GitHub repo](https://github.com/tu-user/ProyectoDJCards2)
2. Verificar que cambios aparecen en **Commits**
3. Si usaste branch: Ver **Pull Request** creado
4. Revisar que los archivos muestren cambios correctos

---

## 🔗 PASO 7: Después del Push

### Si todo está correcto:

Una vez en GitHub, puedes proceder con Render deployment:

```bash
# 1. Verificar que repositorio está actualizado
git log --oneline -5

# 2. Ver README para instrucciones finales
cat RENDER_DEPLOYMENT_GUIDE.md

# 3. Proceder a Render Dashboard para crear servicios
```

### Si hay problemas:

```bash
# Ver último commit
git show HEAD

# Deshacer último commit (si necesitas)
git reset --soft HEAD~1

# Hacer cambios y re-commit
git add .
git commit -m "mensaje"
git push
```

---

## 📋 Checklist Final

Antes de dar por terminado, verifica:

- [ ] `git status` muestra todo limpio
- [ ] Todos los commits están en GitHub
- [ ] `.env.example` NO contiene credenciales reales
- [ ] `render.yaml` tiene nombres correctos de servicios
- [ ] `RENDER_DEPLOYMENT_GUIDE.md` es claro y preciso
- [ ] Archivos `.env`, `*.pem`, `node_modules` están en `.gitignore`

---

## 📝 Comando Rápido (Resume de Todo)

```bash
# Todo en uno
git add Dockerfile docker-entrypoint.sh frontend/Dockerfile docker-compose.yml .env.example render.yaml RENDER_DEPLOYMENT_GUIDE.md && \
git commit -m "🚀 Optimizar para Render: puertos 3000, Dockerfiles dinámicos, deployment guide" && \
git push
```

---

## 🎯 Próximos Pasos

Después de subir a Git:

1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Seguir `RENDER_DEPLOYMENT_GUIDE.md` paso-a-paso
3. Crear services (Database, Backend, Frontend)
4. Monitorear logs hasta que estén "Live"
5. Probar en browser

---

## 💡 Tips Adicionales

### Si cambias puertos después:
```bash
# Recuerda actualizar consistentemente en:
# 1. Dockerfile
# 2. docker-compose.yml
# 3. PORTS_CONFIG.md
# 4. .env.example
# 5. render.yaml

find . -type f -name "*.yml" -o -name "*.yaml" -o -name "Dockerfile" -o -name "*.md" | \
xargs grep -l "3000\|5173\|10000"
```

### Ver histórico de cambios:
```bash
# Commits recientes
git log --oneline -10

# Cambios entre ramas
git log --oneline main..feature/render-optimization
```

---

**🎉 ¡Listo! Después de estos pasos, el proyecto estará en GitHub optimizado para Render.**
