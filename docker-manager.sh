#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 ProyectoDJCards2 - Docker Manager${NC}\n"

case "$1" in
  start)
    echo -e "${GREEN}▶️  Iniciando servicios...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Done${NC}"
    echo -e "\n${BLUE}Acceso:${NC}"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:3000"
    echo "  BD:       http://localhost:8080 (user: pokemon / pass: pokemon)"
    ;;
  
  stop)
    echo -e "${YELLOW}⏹️  Deteniendo servicios...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Done${NC}"
    ;;
  
  restart)
    echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
    docker-compose restart
    echo -e "${GREEN}✓ Done${NC}"
    ;;
  
  clean)
    echo -e "${RED}🗑️  Eliminando volúmenes y contenedores (BD se borrará)...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✓ Done${NC}"
    ;;
  
  reset)
    echo -e "${RED}🔄 Reset completo: eliminando todo e iniciando limpio...${NC}"
    docker-compose down -v --remove-orphans
    docker system prune -f
    sleep 2
    echo -e "${GREEN}Reiniciando servicios...${NC}"
    docker-compose up -d
    sleep 5
    echo -e "${GREEN}✓ Done${NC}"
    docker-compose logs backend | grep -E "Migration|✓|Error" | tail -5
    ;;
  
  logs)
    echo -e "${BLUE}📋 Mostrando logs de todos los servicios...${NC}"
    docker-compose logs -f
    ;;
  
  logs-backend)
    echo -e "${BLUE}📋 Logs del backend...${NC}"
    docker-compose logs -f backend
    ;;
  
  logs-frontend)
    echo -e "${BLUE}📋 Logs del frontend...${NC}"
    docker-compose logs -f frontend
    ;;
  
  status)
    echo -e "${BLUE}📊 Estado de servicios:${NC}"
    docker-compose ps --no-trunc
    ;;
  
  shell-backend)
    echo -e "${BLUE}🔧 Entrando al backend...${NC}"
    docker-compose exec backend sh
    ;;
  
  shell-db)
    echo -e "${BLUE}🔧 Entrando a PostgreSQL...${NC}"
    docker-compose exec postgres psql -U pokemon pokemontcg
    ;;
  
  db-dump)
    echo -e "${BLUE}💾 Haciendo backup de la BD...${NC}"
    mkdir -p backups
    docker-compose exec postgres pg_dump -U pokemon pokemontcg > "backups/backup-$(date +%Y%m%d-%H%M%S).sql"
    echo -e "${GREEN}✓ Backup creado en backups/${NC}"
    ;;
  
  build)
    echo -e "${BLUE}🔨 Reconstruyendo imágenes...${NC}"
    docker-compose build
    echo -e "${GREEN}✓ Done${NC}"
    ;;
  
  *)
    echo -e "${YELLOW}Uso:${NC} $0 {comando}\n"
    echo -e "${BLUE}Comandos disponibles:${NC}"
    echo "  start          - Inicia todos los servicios"
    echo "  stop           - Detiene todos los servicios"
    echo "  restart        - Reinicia todos los servicios"
    echo "  clean          - Detiene y elimina volúmenes (BD se borra)"
    echo "  reset          - Reset completo (limpia todo y reinicia)"
    echo "  status         - Muestra estado de servicios"
    echo "  logs           - Muestra logs de todos los servicios"
    echo "  logs-backend   - Muestra logs solo del backend"
    echo "  logs-frontend  - Muestra logs solo del frontend"
    echo "  shell-backend  - Abre terminal en el contenedor backend"
    echo "  shell-db       - Abre psql en PostgreSQL"
    echo "  db-dump        - Hace backup de la BD"
    echo "  build          - Reconstruye las imágenes Docker"
    echo ""
    echo -e "${YELLOW}Ejemplos:${NC}"
    echo "  ./docker-manager.sh start"
    echo "  ./docker-manager.sh logs-backend"
    echo "  ./docker-manager.sh reset"
    ;;
esac
