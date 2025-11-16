# Variables de Entorno - HouseSpend AI

Este documento describe todas las variables de entorno necesarias para ejecutar HouseSpend AI.

## Variables Requeridas

### Para Docker Compose (archivo `.env` en la raíz)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# JWT Secret Key (OBLIGATORIO para producción)
# Mínimo 32 caracteres. Se usa para firmar los tokens JWT.
# Si no se proporciona, se genera una aleatoria (no recomendado para producción)
JWT_SECRET_KEY=tu-clave-secreta-super-segura-de-minimo-32-caracteres-aqui

# Encryption Key (OBLIGATORIO para producción)
# Debe tener exactamente 32 caracteres. Se usa para encriptar la API Key de OpenAI en la BD.
# Si no se proporciona, se usa una por defecto (no recomendado para producción)
ENCRYPTION_KEY=HouseSpend-AI-Encryption-Key-2024-32-Bytes!!
```

### Variables Opcionales

```env
# URL de la API Backend (para el frontend)
# Por defecto: http://localhost:5000/api
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Variables para Desarrollo Local (sin Docker)

### Backend (appsettings.Development.json)

Las siguientes variables se pueden configurar en `appsettings.Development.json` o como variables de entorno del sistema:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=housespend_dev;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "SecretKey": "tu-clave-secreta-aqui",
    "Issuer": "HouseSpend-AI",
    "Audience": "HouseSpend-AI-Users",
    "ExpirationMinutes": "1440"
  },
  "Encryption": {
    "Key": "HouseSpend-AI-Encryption-Key-2024-32-Bytes!!"
  }
}
```

O como variables de entorno del sistema (formato para Windows PowerShell):

```powershell
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=housespend_dev;Username=postgres;Password=postgres"
$env:Jwt__SecretKey="tu-clave-secreta-aqui"
$env:Encryption__Key="HouseSpend-AI-Encryption-Key-2024-32-Bytes!!"
```

### Frontend (.env.local)

Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Configuración de PostgreSQL (Docker)

Las siguientes variables se configuran automáticamente en `docker-compose.yml` pero puedes modificarlas:

```yaml
POSTGRES_DB: housespend
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres  # Cambiar en producción
```

## Resumen Rápido

### Mínimo necesario para empezar:

1. **Con Docker Compose:**
   - Crea `.env` en la raíz con `JWT_SECRET_KEY` y `ENCRYPTION_KEY`
   - Ejecuta `docker-compose up -d`

2. **Sin Docker (desarrollo local):**
   - Configura PostgreSQL localmente
   - Configura `appsettings.Development.json` con la cadena de conexión
   - Crea `.env.local` en `frontend/` con `NEXT_PUBLIC_API_URL`

## Generación de Claves Seguras

### JWT Secret Key (mínimo 32 caracteres):

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

### Encryption Key (exactamente 32 caracteres):

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 24 | head -c 32
```

## Notas Importantes

1. **NUNCA** subas el archivo `.env` al repositorio (ya está en `.gitignore`)
2. **NUNCA** uses las claves por defecto en producción
3. La API Key de OpenAI se configura desde la interfaz web después del setup inicial
4. La API Key de OpenAI se almacena **encriptada** en la base de datos usando `ENCRYPTION_KEY`

## Ejemplo de archivo `.env` completo

```env
# JWT Configuration
JWT_SECRET_KEY=mi-clave-super-secreta-para-jwt-de-minimo-32-caracteres-123456789

# Encryption Key (exactamente 32 caracteres)
ENCRYPTION_KEY=HouseSpend-AI-Encryption-Key-2024-32-Bytes!!

# Frontend API URL (opcional)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

