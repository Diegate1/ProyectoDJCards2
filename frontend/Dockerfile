FROM node:20-alpine AS dev

WORKDIR /app

RUN apk add --no-cache bash

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./

RUN npm ci

COPY src/ ./src/

RUN echo "🔨 Building frontend..." && \
    npm run build && \
    echo "✓ Frontend build completed"

# Production stage - Use nginx for proxy
FROM nginx:alpine AS prod

# Copiar archivos estáticos
COPY --from=dev /app/dist /usr/share/nginx/html

# Configurar nginx con proxy
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API al backend
    location /api/ {
        proxy_pass http://pokemon_backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
