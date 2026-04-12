FROM node:20-alpine AS dev

WORKDIR /app

# Instalar bash para scripts
RUN apk add --no-cache bash

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Build (compilará a ./dist relativo a frontend/)
RUN echo "🔨 Building frontend..." && \
    npm run build && \
    echo "✓ Frontend build completed"

# Production stage - Serve static files
FROM node:20-alpine AS prod

WORKDIR /app

# Instalar un simple HTTP server para servir archivos estáticos
RUN npm install -g serve

# Copiar dist del builder
# Del dev stage: /app/dist → en prod: /app/dist
COPY --from=dev /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Servir con serve (preserva routing para SPA)
# -s: spa mode (fallback to index.html)
# -l: listen on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
