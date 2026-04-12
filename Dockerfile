FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema (postgresql-client para pg_isready)
RUN apk add --no-cache postgresql-client bash

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias (incluye devDependencies para build)
RUN npm ci --production=false

# Copiar código fuente
COPY src/ ./src/
COPY scripts/ ./scripts/

# 🔨 COMPILAR TYPESCRIPT A dist/
RUN echo "📦 Building TypeScript..." && \
    npm run build && \
    echo "✓ Build completed"

# Copiar script de entrada
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Exponer puerto dinámico (Render & desarrollo)
ARG PORT=3000
EXPOSE ${PORT}

# Usar el script de entrada
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
