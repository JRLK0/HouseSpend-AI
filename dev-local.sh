#!/bin/bash
# Script para desarrollo local - Linux/Mac
# Levanta backend y PostgreSQL en Docker, luego el frontend localmente

echo "========================================"
echo "  HouseSpend AI - Desarrollo Local"
echo "========================================"
echo ""

# Verificar Docker
echo "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker no esta instalado o no esta corriendo"
    echo "  Instala Docker desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "[OK] Docker esta instalado"

# Verificar si los servicios Docker están corriendo
echo ""
echo "Verificando servicios Docker..."
BACKEND_RUNNING=false
POSTGRES_RUNNING=false

if docker ps --format "{{.Names}}" | grep -q "housespend-backend"; then
    BACKEND_RUNNING=true
    echo "[OK] Backend Docker ya esta corriendo"
fi

if docker ps --format "{{.Names}}" | grep -q "housespend-postgres"; then
    POSTGRES_RUNNING=true
    echo "[OK] PostgreSQL Docker ya esta corriendo"
fi

# Levantar servicios Docker si no están corriendo
if [ "$BACKEND_RUNNING" = false ] || [ "$POSTGRES_RUNNING" = false ]; then
    echo ""
    echo "Levantando backend y PostgreSQL en Docker..."
    
    if [ "$POSTGRES_RUNNING" = false ]; then
        echo "  Iniciando PostgreSQL..."
    fi
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "  Iniciando Backend..."
    fi
    
    docker-compose up -d postgres backend
    
    if [ $? -eq 0 ]; then
        echo "[OK] Servicios Docker levantados"
        echo "  Esperando que los servicios esten listos..."
        sleep 5
    else
        echo "[ERROR] No se pudieron levantar los servicios Docker"
        exit 1
    fi
fi

# Verificar Node.js
echo ""
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no esta instalado"
    echo "  Descarga desde: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "[OK] Node.js $NODE_VERSION esta instalado"

# Configurar .env.local
echo ""
echo "Verificando configuracion del frontend..."
ENV_FILE="frontend/.env.local"
NEEDS_ENV_FILE=false

if [ ! -f "$ENV_FILE" ]; then
    NEEDS_ENV_FILE=true
elif ! grep -q "NEXT_PUBLIC_API_URL=http://localhost:5000/api" "$ENV_FILE"; then
    NEEDS_ENV_FILE=true
fi

if [ "$NEEDS_ENV_FILE" = true ]; then
    echo "  Configurando .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > "$ENV_FILE"
    echo "[OK] Archivo .env.local configurado"
else
    echo "[OK] Archivo .env.local ya esta configurado"
fi

# Verificar dependencias
echo ""
echo "Verificando dependencias del frontend..."
if [ ! -d "frontend/node_modules" ]; then
    echo "  Instalando dependencias..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Error al instalar dependencias"
        exit 1
    fi
    cd ..
    echo "[OK] Dependencias instaladas"
else
    echo "[OK] Dependencias ya instaladas"
fi

# Mostrar resumen
echo ""
echo "========================================"
echo "  Todo listo!"
echo "========================================"
echo ""
echo "Levantando frontend en modo desarrollo..."
echo ""
echo "URLs:"
echo "  Backend (Docker):  http://localhost:5000"
echo "  Frontend (Local):  http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener el frontend"
echo "Para detener Docker: docker-compose down"
echo ""

# Cambiar al directorio frontend y ejecutar npm run dev
cd frontend
npm run dev
