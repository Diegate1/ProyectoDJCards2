# 🚀 Guía Rápida - Instalación y Ejecución del Dashboard

## Requisitos Previos

- **Node.js 18+** y **npm** (o yarn/pnpm)
- **PostgreSQL 12+** (ya debe estar corriendo via Docker Compose)
- Backend sincronizado y con datos (ejecutar `npm run sync:full`)

---

## 🔧 Instalación del Backend

### 1. Instalar dependencias backend

```bash
cd ProyectoDJCards2
npm install
```

### 2. Verificar conexión a BD

```bash
docker-compose up -d  # Si no está corriendo
npm run migrate
```

### 3. Sincronizar datos (si no lo hizo antes)

```bash
npm run sync:full
```

Esto puede tomar 10-15 minutos dependiendo de velocidad de conexión.

---

## 🎨 Instalación del Frontend

### 1. Instalar dependencias frontend

```bash
cd frontend
npm install
```

### 2. Verificar variables de entorno

```bash
cp .env.example .env.local
```

El proxy ya está configurado en `vite.config.ts` para apuntar a localhost:3000

---

## ▶️ Ejecución en Desarrollo

### Terminal 1 - Backend

```bash
cd ProyectoDJCards2
npm run dev
```

Verá:
```
✓ Server running on http://localhost:3000
```

### Terminal 2 - Frontend

```bash
cd ProyectoDJCards2/frontend
npm run dev
```

Verá:
```
  ➜  Local:   http://localhost:5173/
```

### Acceso

Abra en navegador: **http://localhost:5173**

---

## ✅ Testing - Flujo Completo

### 1. Dashboard de Sets

```
GET http://localhost:3000/api/data/sets?page=1&pageSize=20
```

✓ Debería devolver ~250 sets ordenados por fecha

### 2. Listado de Cartas (filtrado por set)

```
GET http://localhost:3000/api/data/cards?page=1&pageSize=20&setId={uuid}
```

✓ Debería devolver cartas del set con precios

### 3. Detalle de Carta

```
GET http://localhost:3000/api/data/cards/{cardId}
```

✓ Debería devolver detalles completos con ataques y habilidades

### 4. Estadísticas

```
GET http://localhost:3000/api/data/stats
```

```json
{
  "stats": {
    "sets": 250,
    "cards": 100000,
    "products": 100000,
    "priceEntries": 500000
  }
}
```

---

## 📚 Rutas Disponibles

### Backend API

| Endpoint | Método | Descripción |
|----------|--------|------------|
| `/api/data/sets` | GET | Lista sets paginada (20/página) |
| `/api/data/cards` | GET | Lista cartas paginada con filtro setId |
| `/api/data/cards/search` | GET | Busca cartas por nombre |
| `/api/data/cards/:cardId` | GET | Detalle completo de carta |
| `/api/data/prices/card` | GET | Histórico de precios (legacy) |
| `/api/data/products/sealed` | GET | Productos sellados |
| `/api/data/stats` | GET | Estadísticas generales |

### Frontend

| Ruta | Descripción |
|------|------------|
| `/dashboard` | Dashboard principal - Tabla de sets |
| `/dashboard/cards` | Listado de cartas (global o filtrado por set) |
| `/dashboard/cards/:cardId` | Página detalle de carta |

---

## 🐛 Troubleshooting

### ❌ "Cannot find module" en Backend

```bash
cd ProyectoDJCards2
npm install --legacy-peer-deps
```

### ❌ Vite proxy no funciona

El proxy de Vite requiere que el backend esté corriendo en puerto 3000.
Verificar:

```bash
curl http://localhost:3000/health
```

Si retorna `{"status":"ok"}`, todo bien.

### ❌ BD sin datos

```bash
npm run sync:full
npm run sync:set -- --setId sv4pt  # Sync un set individual para probar
```

### ❌ Puerto 3000 o 5173 ya en uso

```bash
# Cambiar puerto backend en .env
PORT=3001

# Cambiar puerto frontend en frontend/vite.config.ts
server: { port: 5174 }
```

---

## 📦 Estructura de Carpetas

```
ProyectoDJCards2/
├── src/
│   ├── main.ts
│   ├── modules/
│   │   └── data/
│   │       ├── data.controller.ts       (endpoints)
│   │       ├── data.routes.ts           (rutas)
│   │       ├── data-formatter.service.ts (lógica DTO)
│   └── common/
│       └── types.ts                      (DTOs + interfaces)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardSetsPage.tsx
│   │   │   ├── CardsPage.tsx
│   │   │   └── CardDetailPage.tsx
│   │   ├── services/
│   │   │   └── dataService.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   └── vite.config.ts
```

---

## 🚀 Próximos Pasos

Después de validar que todo funciona:

1. **Integración de gráficos** - Histórico de precios
2. **Alerts de precios** - Notificaciones al bajar precio
3. **Filtering avanzado** - Por rareza, tipo, etc.
4. **Watchlist** - Guardar cartas favoritas
5. **Búsqueda full-text** - Búsqueda avanzada

---

## 📞 Ayuda

Si algo falla:

1. Verificar logs en terminal
2. Comprobar BD: `SELECT COUNT(*) FROM cards;`
3. Verificar conectividad: `curl http://localhost:3000/api/data/stats`
4. Comprobar browser console (F12)

---

**Dashboard listo en 1-2 minutos** ⏱️
