# Guía de Desarrollo Local - Frontend en Local

Esta guía te ayudará a ejecutar el **frontend localmente** con `npm run dev` para ver los cambios en tiempo real, mientras el backend y la base de datos corren en Docker.

## Configuración Híbrida

- ✅ **Backend y PostgreSQL:** En Docker (puerto 5000)
- ✅ **Frontend:** En local con `npm run dev` (puerto 3000)

## Inicio Rápido (Recomendado)

### Windows (PowerShell)

Simplemente ejecuta:

```powershell
.\dev-local.ps1
```

### Linux/Mac (Bash)

Simplemente ejecuta:

```bash
chmod +x dev-local.sh
./dev-local.sh
```

El script automáticamente:
1. ✅ Verifica que Docker esté instalado
2. ✅ Verifica si el backend y PostgreSQL están corriendo en Docker
3. ✅ Los levanta automáticamente si no están corriendo
4. ✅ Configura el archivo `.env.local` del frontend
5. ✅ Instala dependencias si es necesario
6. ✅ Levanta el frontend con `npm run dev`

## Inicio Manual (Alternativa)

Si prefieres hacerlo manualmente:

### 1. Levantar Backend y Base de Datos en Docker

```bash
docker-compose up -d postgres backend
```

Esto levantará:
- **PostgreSQL** en el puerto `5432`
- **Backend API** en el puerto `5000`

### 2. Configurar Variables de Entorno del Frontend

Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Instalar Dependencias del Frontend (solo la primera vez)

```bash
cd frontend
npm install
```

### 4. Levantar el Frontend en Modo Desarrollo

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: **http://localhost:3000**

## Verificación

1. **Backend (Docker):** http://localhost:5000 (Swagger UI)
2. **Frontend (Local):** http://localhost:3000

## Hot Reload

- ✅ **Frontend:** Los cambios en código React/TypeScript se reflejan automáticamente al guardar
- ✅ **Backend:** Si necesitas cambios en el backend, puedes reconstruir el contenedor o usar volúmenes para hot-reload

## Comandos Útiles

### Ver logs del backend
```bash
docker-compose logs -f backend
```

### Ver logs de PostgreSQL
```bash
docker-compose logs -f postgres
```

### Detener servicios Docker
```bash
docker-compose down
```

### Reiniciar solo el backend
```bash
docker-compose restart backend
```

## Solución de Problemas

### El frontend no se conecta al backend

1. Verifica que el backend esté corriendo:
   ```bash
   docker-compose ps
   ```
   Deberías ver `backend` y `postgres` con estado "Up"

2. Verifica que el archivo `.env.local` tenga la URL correcta:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Reinicia el servidor de desarrollo del frontend después de cambiar `.env.local`:
   ```bash
   # Presiona Ctrl+C para detener
   npm run dev
   ```

### Error: "Cannot find module"

Ejecuta:
```bash
cd frontend
npm install
```

### Error de CORS

El backend ya tiene CORS configurado para `http://localhost:3000`. Si usas otro puerto, actualiza la configuración en `backend/HouseSpend.API/Program.cs`.

### El backend no responde

Verifica los logs:
```bash
docker-compose logs backend
```

Y verifica que esté corriendo:
```bash
curl http://localhost:5000
```

## Ventajas de esta Configuración

- ✅ **Hot-reload rápido** en el frontend (cambios instantáneos)
- ✅ **Backend estable** en Docker (sin preocuparte por dependencias)
- ✅ **Base de datos persistente** en Docker (datos se mantienen)
- ✅ **Fácil de limpiar** (solo detener Docker cuando termines)

## Detener Todo

```bash
# Detener frontend (en su terminal)
Ctrl+C

# Detener Docker (opcional, si quieres liberar recursos)
docker-compose down
```

## Scripts Disponibles

- **`dev-local.ps1`** - Script para Windows (PowerShell)
- **`dev-local.sh`** - Script para Linux/Mac (Bash)

Ambos scripts hacen lo mismo: verifican y levantan los servicios necesarios, luego ejecutan el frontend localmente.
