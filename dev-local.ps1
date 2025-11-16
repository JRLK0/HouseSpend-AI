# Script para desarrollo local - Windows PowerShell
# Levanta backend y PostgreSQL en Docker, luego el frontend localmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HouseSpend AI - Desarrollo Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no disponible"
    }
    Write-Host "[OK] Docker esta instalado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker no esta instalado o no esta corriendo" -ForegroundColor Red
    Write-Host "  Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar si los servicios Docker están corriendo
Write-Host ""
Write-Host "Verificando servicios Docker..." -ForegroundColor Yellow
$backendRunning = $false
$postgresRunning = $false

try {
    $containers = docker ps --format "{{.Names}}" 2>&1
    if ($containers -match "housespend-backend") {
        $backendRunning = $true
        Write-Host "[OK] Backend Docker ya esta corriendo" -ForegroundColor Green
    }
    
    if ($containers -match "housespend-postgres") {
        $postgresRunning = $true
        Write-Host "[OK] PostgreSQL Docker ya esta corriendo" -ForegroundColor Green
    }
} catch {
    # Continuar
}

# Levantar servicios Docker si no están corriendo
if (-not $backendRunning -or -not $postgresRunning) {
    Write-Host ""
    Write-Host "Levantando backend y PostgreSQL en Docker..." -ForegroundColor Yellow
    
    if (-not $postgresRunning) {
        Write-Host "  Iniciando PostgreSQL..." -ForegroundColor Cyan
    }
    if (-not $backendRunning) {
        Write-Host "  Iniciando Backend..." -ForegroundColor Cyan
    }
    
    docker-compose up -d postgres backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Servicios Docker levantados" -ForegroundColor Green
        Write-Host "  Esperando que los servicios esten listos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "[ERROR] No se pudieron levantar los servicios Docker" -ForegroundColor Red
        exit 1
    }
}

# Verificar Node.js
Write-Host ""
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion esta instalado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado" -ForegroundColor Red
    Write-Host "  Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Configurar .env.local
Write-Host ""
Write-Host "Verificando configuracion del frontend..." -ForegroundColor Yellow
$envFile = "frontend\.env.local"
$needsEnvFile = $false

if (-not (Test-Path $envFile)) {
    $needsEnvFile = $true
} else {
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "NEXT_PUBLIC_API_URL=http://localhost:5000/api") {
        $needsEnvFile = $true
    }
}

if ($needsEnvFile) {
    Write-Host "  Configurando .env.local..." -ForegroundColor Cyan
    Set-Content -Path $envFile -Value "NEXT_PUBLIC_API_URL=http://localhost:5000/api"
    Write-Host "[OK] Archivo .env.local configurado" -ForegroundColor Green
} else {
    Write-Host "[OK] Archivo .env.local ya esta configurado" -ForegroundColor Green
}

# Verificar dependencias
Write-Host ""
Write-Host "Verificando dependencias del frontend..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "  Instalando dependencias..." -ForegroundColor Cyan
    Push-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Error al instalar dependencias" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencias ya instaladas" -ForegroundColor Green
}

# Mostrar resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Todo listo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Levantando frontend en modo desarrollo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Backend (Docker):  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend (Local):  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el frontend" -ForegroundColor Yellow
Write-Host "Para detener Docker: docker-compose down" -ForegroundColor Yellow
Write-Host ""

# Cambiar al directorio frontend y ejecutar npm run dev
Push-Location frontend
npm run dev
