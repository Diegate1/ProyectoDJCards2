# 🚀 ProyectoDJCards2 - Quick Start Guide

## ⚡ 5 Minutos para Empezar

### 1. Clonar repo y dependencias

```bash
cd ProyectoDJCards2
npm install
```

### 2. Levantar base de datos

```bash
npm run db:up
# Esperar ~10 segundos a que esté lista
```

### 3. Migrar esquema

```bash
npm run migrate
# Verá: "✓ Migration executed: 001_initial_schema.sql"
```

### 4. Iniciar servidor

```bash
npm run dev
```

Verá algo como:

```
[Nest] 1234  - 04/09/2026, 10:30:00 AM   [NestFactory] Starting Nest application...
✓ Server running on http://localhost:3000
```

✅ **¡Listo!** El servidor está corriendo.

---

## 📊 Pruebas Rápidas

### Ver sets disponibles (sin guardar)

```bash
curl "http://localhost:3000/admin/api-debug/pokemontcg/sets?page=1&pageSize=5"
```

### Sincronizar sets (guardar en BD)

```bash
curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"
```

### Ver estado de BD

```bash
curl "http://localhost:3000/admin/status/db"
```

Respuesta esperada:
```json
{
  "sets": 123,
  "cards": 0,
  "products": 0
}
```

---

## 🔧 Otros Comandos Útiles

```bash
# Ver BD con GUI web
open http://localhost:8080
# User: pokemon | Pass: pokemon | DB: pokemontcg

# Sincronizar solo un set
npm run sync:set sv1

# Sincronización completa (sets → cards → products)
npm run sync:full

# Recrear BD desde cero
npm run db:reset
```

---

## 📚 Documentación Completa

- **README.md** - Setup detallado y architecture
- **README_ADMIN.md** - Todos los endpoints disponibles
- **pokemontcg_api_guide.md** - Guía técnica de las APIs

---

## 🎯 Primeros Pasos Recomendados

```bash
# 1. Verificar conexión
curl "http://localhost:3000/admin/status/db"

# 2. Sincronizar sets (5-30 segundos)
curl -X POST "http://localhost:3000/admin/sync/sets/pokemontcg"

# 3. Ver cuántos sets se sincronizaron
curl "http://localhost:3000/admin/status/db"

# 4. Sincronizar cartas de ejemplo (set sv1)
npm run sync:set sv1

# 5. Verificar resultado
curl "http://localhost:3000/admin/status/db"
```

---

## 💡 Tips

- **Sin API key**: 1000 requests/día, 30/min
- **Con API key**: 20000 requests/día (agregaloen `.env`)
- **Rate limits respetados**: No rebientan las APIs
- **Datos guardados crudo**: Siempre en JSON para auditoría

---

## ❓ Problemas Comunes

**Error: "Connection refused"**
```bash
npm run db:up
```

**Error: "Cannot find module"**
```bash
npm install
```

**Quiero empezar limpio**
```bash
npm run db:reset && npm run migrate
```

---

📞 Para más info: Ver README.md y README_ADMIN.md
