FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema (postgresql-client para pg_isready)
RUN apk add --no-cache postgresql-client bash

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/
COPY scripts/ ./scripts/

# Copiar script de entrada
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Exponer puerto
EXPOSE 3000

# Usar el script de entrada
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
