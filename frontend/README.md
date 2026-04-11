# DJ Cards Frontend

Frontend moderno de React + Vite para catálogo de Pokémon TCG.

## 🎯 Características

- ✅ Dashboard de sets paginado (20 items/página)
- ✅ Listado de cartas con filtro por set
- ✅ Detalle completo de carta (ataques, habilidades, debilidades)
- ✅ Prices actual mostrado automáticamente
- ✅ Diseño responsive (desktop + mobile)
- ✅ Placeholder preparado para gráfico de histórico de precios (futuro)

## 🏗️ Arquitectura

### Estructura de Carpetas

```
src/
├── pages/                    # Páginas principales (rutas)
│   ├── DashboardSetsPage.tsx    (Dashboard /dashboard)
│   ├── CardsPage.tsx            (Catálogo /dashboard/cards)
│   ├── CardDetailPage.tsx       (Detalle /dashboard/cards/:cardId)
│   └── *.css                    (Estilos por página)
│
├── services/                 # Lógica de API
│   └── dataService.ts           (Cliente HTTP con Axios)
│
├── types.ts                  # Tipos y DTOs (sincronizados con backend)
├── App.tsx                   # Router principal
├── App.css                   # Estilos globales de nav
├── index.css                 # Reset + variables globales
└── main.tsx                  # Punto de entrada React
```

## 🔌 Integración con Backend

### DataService (src/services/dataService.ts)

Cliente HTTP que abstractiza las llamadas API:

```typescript
// Obtener sets
dataService.getSets(page, pageSize)

// Obtener cartas (con filtro opcional por set)
dataService.getCards(page, pageSize, setId?)

// Buscar cartas
dataService.searchCards(name, page, pageSize)

// Detalle de carta
dataService.getCardDetail(cardId)

// Estadísticas
dataService.getStats()
```

### Proxy Vite

El `vite.config.ts` redirige automáticamente todas las llamadas a `/api/*` hacia `http://localhost:3000`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

## 🎨 Componentes

### 1. DashboardSetsPage.tsx

**Ruta:** `/dashboard`

- Tabla de 20 sets por página
- Ordenados por fecha (más nuevo primero)
- Columnas: Imagen, Nombre, Fecha, Nº Cartas, Idiomas
- Click en fila → navega a `/dashboard/cards?setId={id}`

**Estados:**
- Loading
- Error
- Empty (cuando no hay sets)
- Loaded (tabla con paginación)

### 2. CardsPage.tsx

**Ruta:** `/dashboard/cards` (soporta query param `setId`)

- Tabla de 20 cartas por página
- Acepta filtro por set vía `?setId={uuid}`
- Columnas: Imagen, Nombre (#XXX), Precio Actual
- Click en fila → navega a `/dashboard/cards/{cardId}`
- Botón "Volver" al dashboard de sets

**Estados:**
- Loading
- Error
- Empty (cuando no hay cartas filtradas)
- Loaded (tabla con paginación)

### 3. CardDetailPage.tsx

**Ruta:** `/dashboard/cards/:cardId`

Muestra detalle completo de una carta:

- **Hero Section**: Imagen grande + info base (nombre, número, tipo, HP, artista, rareza)
- **Ataques**: Lista con nombre, daño, costo, efecto
- **Habilidades**: Lista con nombre, tipo, efecto
- **Debilidades/Resistencias**: Grid con tipo + valor
- **Precio Actual**: Box destacado con formato moneda
- **Placeholder**: Sección reservada para gráfico futuro de histórico de precios

**Estados:**
- Loading
- Error
- Empty
- Loaded (detalle completo)

## 🎨 Estilos

### Sistema de Diseño

- **Colores primarios**: `#0066cc` (azul), `#e0e0e0` (gris claro)
- **Colores de estado**: 
  - Error: `#dc3545` (rojo)
  - Success: `#28a745` (verde)
  - Warning: `#ffc107` (amarillo)

- **Tipografía**:
  - Header: System font stack
  - Responsive: `18px` base en mobile, escala a `16px+` en desktop

### Archivos CSS

- `index.css` - Reset + utility classes + variables
- `App.css` - Navbar y layout principal
- `pages/*Page.css` - Estilos específicos de cada página

Cada página tiene su propio CSS file con estilos modulares.

## 📱 Responsive Design

Breakpoints principales:

```css
@media (max-width: 768px) {
  /* Ajustes para tablet y mobile */
  - Grid a single column
  - Fuentes más pequeñas
  - Botones más compactos
  - Tabla con scroll horizontal si es necesario
}
```

## 🚀 Características Preparadas para Futuro

### 1. Histórico de Precios (Placeholder)

En `/dashboard/cards/:cardId` existe una sección `price-history-placeholder` con:
- Box con texto "Pendiente de integración"
- Preparado para recibir componente de gráfico (Chart.js, Recharts, etc.)

### 2. Búsqueda Avanzada

El `SearchCards` endpoint ya existe en backend sin usarse en frontend.
Fácil de integrar añadiendo un `<input type="search">` a `DashboardSetsPage` o `CardsPage`.

### 3. Filtros

El estado de paginación está preparado para:
- Filtros por rareza
- Filtros por tipo (Pokémon, Trainer, Energy)
- Ordenamiento personalizado

## 🔧 Configuración

### vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' }
  },
  build: {
    outDir: '../dist/public',  // Output frontend + backend en misma carpeta
    emptyOutDir: true,
  }
})
```

### tsconfig.json

- Target: ES2020
- Módules: ESNext
- JSX: react-jsx
- Strict mode: ✅

## 📦 Dependencias

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.7.0",
  "clsx": "^2.0.0"
}
```

## 🧪 Testing

### Flujo manual completo

1. Abrir `/dashboard` → Ver tabla de sets
2. Hacer click en un set → Navega a `/dashboard/cards?setId={uuid}`
3. Ver tabla de cartas del set
4. Hacer click en una carta → Navega a `/dashboard/cards/{cardId}`
5. Ver detalle completo
6. Click "Volver" → Regresa a `/dashboard/cards?setId={uuid}`

### API Testing (sin frontend)

```bash
# Sets
curl http://localhost:5173/api/data/sets?page=1&pageSize=20

# Cartas (filtro global)
curl http://localhost:5173/api/data/cards?page=1&pageSize=20

# Cartas (filtro por set - reemplazar {uuid})
curl "http://localhost:5173/api/data/cards?page=1&pageSize=20&setId={uuid}"

# Detalle (reemplazar {cardId})
curl http://localhost:5173/api/data/cards/{cardId}
```

## 📚 Desarrollo

### Scripts

```bash
npm run dev        # Iniciar Vite dev server
npm run build      # Build para producción
npm run preview    # Preview de build local
npm run lint       # Lint con ESLint
npm run type-check # Type checking sin compilación
```

### Hot Module Replacement (HMR)

Vite automáticamente recarga módulos cuando edita archivos.
Para ver cambios: guarde archivo → se recarga automáticamente en navegador.

## 🚢 Deployment

### Build para producción

```bash
npm run build
```

Genera en `../dist/public/`:
- `index.html`
- `assets/...` (JS + CSS optimizados)

## 🐛 Debugging

### Browser DevTools

- F12 → Console: Errores y logs
- F12 → Network: Peticiones API
- F12 → React DevTools: Ver componentes y estado

### Backend Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### API Health Check

```bash
curl http://localhost:3000/api/data/stats
```

## 📝 Notas

- El frontend es **totalmente desacoplado** del backend (pueden deployarse por separado)
- Los tipos TypeScript están **sincronizados** con backend via DTOs
- El diseño es **mobile-first** y escalable
- El código es **limpio y comentado** para futuro mantenimiento

---

**Versión:** 1.0.0  
**Última actualización:** 2026-04-09  
**Estado:** ✅ MVP completo, listo para integración de gráficos
