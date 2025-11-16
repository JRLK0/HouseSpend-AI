# HouseSpend AI

Sistema inteligente de gestión de gastos domésticos mediante análisis de tickets con inteligencia artificial.

## Descripción

HouseSpend AI es una aplicación web que permite a los usuarios subir fotos de tickets de compra para que una inteligencia artificial los analice, identifique los productos y sus precios, los clasifique automáticamente en categorías de gasto y almacene toda la información en una base de datos.

## Tecnologías

- **Backend**: ASP.NET Core 8.0 (C#)
- **Frontend**: Next.js 16 (TypeScript, React)
- **Base de datos**: PostgreSQL
- **IA/OCR**: OpenAI GPT-4 Vision API
- **Autenticación**: JWT
- **Contenedores**: Docker Compose

## Requisitos Previos

- Docker y Docker Compose instalados
- Cuenta de OpenAI con API Key (para análisis de tickets)

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd HouseSpend-AI
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
OPENAI_API_KEY=tu_api_key_de_openai_aqui
```

### 3. Levantar los servicios con Docker Compose

**Modo Desarrollo:**
```bash
docker-compose up -d
```

**Modo Producción:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Esto levantará:
- PostgreSQL en el puerto 5432
- Backend API en el puerto 5000
- Frontend en el puerto 3000

**Diferencias entre modos:**
- **Desarrollo**: Frontend con hot-reload (`npm run dev`), Backend en modo Development
- **Producción**: Frontend optimizado (`npm start`), Backend en modo Production, imágenes más pequeñas

### 4. Acceder a la aplicación

- Frontend: http://localhost:3000
- Backend API Swagger: http://localhost:5000

## Desarrollo Local (sin Docker)

### Backend

```bash
cd backend/HouseSpend.API
dotnet restore
dotnet run
```

Asegúrate de tener PostgreSQL corriendo y configurar la cadena de conexión en `appsettings.Development.json`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura del Proyecto

```
HouseSpend-AI/
├── backend/
│   ├── HouseSpend.sln       # Solución .NET
│   └── HouseSpend.API/
│       ├── Controllers/      # Controladores de la API
│       ├── Data/            # DbContext y configuración de BD
│       ├── DTOs/            # Data Transfer Objects
│       ├── Models/          # Entidades de la base de datos
│       ├── Services/        # Lógica de negocio
│       ├── Middleware/      # Middleware personalizado
│       ├── Dockerfile       # Dockerfile para backend
│       └── Program.cs       # Configuración de la aplicación
├── frontend/
│   ├── app/                 # Páginas de Next.js (App Router)
│   ├── components/          # Componentes React
│   │   ├── Layout/         # Componentes de layout
│   │   ├── Auth/           # Componentes de autenticación
│   │   ├── Setup/          # Componentes de setup
│   │   ├── Tickets/        # Componentes de tickets
│   │   ├── Users/          # Componentes de usuarios
│   │   └── Dashboard/      # Componentes del dashboard
│   ├── lib/                 # Utilidades y librerías
│   │   ├── api-client/     # Cliente API
│   │   ├── contexts/       # Contextos de React
│   │   └── utils/          # Utilidades
│   ├── Dockerfile          # Dockerfile para frontend
│   └── package.json        # Dependencias Node.js
├── docker-compose.yml       # Configuración de Docker Compose
├── env.example             # Ejemplo de variables de entorno
└── README.md
```

## Funcionalidades

### MVP Implementado

1. **Autenticación de Usuarios**
   - Registro e inicio de sesión
   - Almacenamiento seguro de contraseñas con BCrypt
   - Autenticación JWT

2. **Subida de Tickets**
   - Subida de imágenes (JPG, PNG) o PDFs
   - Almacenamiento de archivos en el servidor

3. **Análisis por IA**
   - Integración con OpenAI GPT-4 Vision
   - Extracción automática de:
     - Lista de productos
     - Nombre del comercio
     - Precios y cantidades
     - Total de la compra
     - Identificación de descuentos
   - Clasificación automática en categorías

4. **Visualización**
   - Dashboard con lista de tickets
   - Detalle de ticket con productos analizados
   - Visualización de imagen original

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Tickets
- `POST /api/tickets/upload` - Subir ticket (requiere autenticación)
- `POST /api/tickets/{id}/analyze` - Analizar ticket con IA (requiere autenticación)
- `GET /api/tickets` - Listar tickets del usuario (requiere autenticación)
- `GET /api/tickets/{id}` - Obtener detalle de ticket (requiere autenticación)
- `GET /api/tickets/{id}/image` - Descargar imagen del ticket (requiere autenticación)

## Configuración Inicial

Al acceder por primera vez a la aplicación:

1. Se mostrará la pantalla de setup inicial
2. Crear el usuario administrador (username, email, password)
3. Configurar la API Key de OpenAI (se almacena encriptada en la base de datos)
4. Una vez completado, podrás iniciar sesión y comenzar a usar la aplicación

## Cliente API

El cliente API está implementado manualmente en `frontend/lib/api-client/api.ts` y utiliza Axios para las peticiones HTTP. Incluye interceptores para:
- Agregar automáticamente el token JWT a las peticiones
- Redirigir al login si el token expira o es inválido

## Base de Datos

La base de datos se crea automáticamente al iniciar la aplicación. Las migraciones se ejecutan mediante `EnsureCreated()` en el `Program.cs`.

### Modelos principales:
- **User**: Usuarios del sistema
- **Ticket**: Tickets subidos
- **Product**: Productos extraídos de los tickets
- **Category**: Categorías predefinidas (Alimentación, Limpieza, etc.)

## Configuración de OpenAI

Para usar el análisis de tickets, necesitas:

1. Crear una cuenta en OpenAI
2. Obtener una API Key
3. Configurarla en el archivo `.env` o en `appsettings.json`

## Variables de Entorno

Copia el archivo `env.example` a `.env` y configura las siguientes variables:

- `JWT_SECRET_KEY`: Clave secreta para firmar los tokens JWT (mínimo 32 caracteres)
- `ENCRYPTION_KEY`: Clave para encriptar la API Key de OpenAI (debe tener exactamente 32 caracteres)
- `NEXT_PUBLIC_API_URL`: URL de la API backend (por defecto: http://localhost:5000/api)

## Próximas Funcionalidades

- Dashboard con estadísticas y gráficos avanzados
- Comparativas entre meses
- Control de stock doméstico
- Exportación de datos (CSV, PDF)
- Filtros y búsqueda avanzada
- Notificaciones y recordatorios

## Licencia

Ver archivo LICENSE para más detalles.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.
