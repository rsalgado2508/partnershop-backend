# PartnerShop Backend

Backend REST en NestJS para el sistema de gestión de novedades sobre órdenes de venta.

## Requisitos

- Node.js v22+
- PostgreSQL con la base de datos `partnershop` existente
- AWS Cognito User Pool configurado

## Instalación

```bash
npm install
```

## Configuración

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `APP_PORT` | Puerto de la aplicación (default: 3000) |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (default: 5432) |
| `DB_USERNAME` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_NAME` | Nombre de la base de datos |
| `COGNITO_USER_POOL_ID` | ID del User Pool de Cognito |
| `COGNITO_CLIENT_ID` | Client ID de la app en Cognito |
| `COGNITO_REGION` | Región de AWS (default: us-east-1) |
| `CORS_ORIGIN` | Origen permitido para CORS |

## Migraciones

Ejecutar las migraciones para crear las tablas nuevas (no modifica tablas existentes):

```bash
npm run migration:run
```

Revertir última migración:

```bash
npm run migration:revert
```

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Swagger

Documentación de la API disponible en: `http://localhost:3000/api/docs`

## Tests

```bash
# Unit tests
npm test

# Coverage
npm run test:cov
```

## Docker

```bash
docker build -t partnershop-backend .
docker run -p 3000:3000 --env-file .env partnershop-backend
```

## Estructura del proyecto

```
src/
├── auth/              # Autenticación JWT con AWS Cognito
├── common/            # Filtros, interceptores, DTOs, enums, decoradores
├── config/            # Configuración de app, BD y Cognito
├── database/          # Data source y migraciones TypeORM
└── modules/
    ├── ordenes/               # Consulta de órdenes (solo lectura)
    ├── categorias-novedad/    # CRUD de categorías de novedad
    └── novedades/             # Gestión de novedades e historial
```

## Endpoints principales

- `GET /api/ordenes` — Listado paginado con filtros
- `GET /api/ordenes/:id` — Detalle de una orden
- `GET /api/categorias-novedad` — Categorías activas
- `POST /api/novedades` — Registrar novedad
- `GET /api/novedades` — Listar novedades con filtros
- `PATCH /api/novedades/:id/estado` — Cambiar estado
- `GET /api/novedades/orden/:idOrden` — Novedades de una orden
- `GET /api/novedades/:id/historial` — Trazabilidad completa
