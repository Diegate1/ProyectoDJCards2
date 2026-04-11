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
COPY .env.docker .env

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Copiar script de entrada
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Exponer puerto
EXPOSE 5173

# Usar el script de entrada
ENTRYPOINT ["/app/docker-entrypoint.sh"]
