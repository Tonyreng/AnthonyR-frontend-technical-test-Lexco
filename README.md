# Lexco Frontend

Frontend Angular 21 preparado para desarrollar la SPA de autenticacion, administracion, catalogo y carrito para la prueba tecnica.

## Requisitos

- Docker
- Docker Compose

Para ejecucion local sin contenedores tambien puede usarse:

- Node.js 24 o superior
- npm 11 o superior

## Entorno

El proyecto usa Angular 21 con PrimeNG y SCSS.

Valores principales para desarrollo local:

- `http://localhost:4200` para el frontend.
- `http://localhost/api` como URL base de la API Laravel.
- Cookies HTTPOnly con `withCredentials: true` para autenticacion por sesion.
- `CHOKIDAR_USEPOLLING=true` para hot reload dentro de Docker.

Los archivos de entorno actuales son:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Valor base configurado actualmente:

- `apiUrl: 'http://localhost/api'`

No subir secretos, tokens ni configuraciones sensibles reales al repositorio.

## Comandos

Instalar dependencias localmente:

```bash
npm install
```

Levantar servidor local sin Docker:

```bash
npm start
```

Levantar servicios con Docker y hot reload:

```bash
docker compose up --build
```

Compilar proyecto:

```bash
npm run build
```

Ejecutar pruebas unitarias:

```bash
npm test
```

Validar configuracion Docker Compose:

```bash
docker compose config
```

## Docker

La configuracion Docker del frontend vive en:

- `Dockerfile`
- `compose.yaml`
- `.dockerignore`

Comportamiento actual:

- Publica Angular en `4200:4200`.
- Ejecuta `ng serve --host 0.0.0.0 --poll 1000`.
- Monta el codigo fuente local en `/app`.
- Usa un volumen dedicado para `node_modules`.
- Permite hot reload dentro del contenedor.

Servicio disponible actualmente:

- `angular`

## Integracion Con Backend

El frontend consume el backend Laravel ubicado en `../backend/`.

Contrato de integracion esperado:

- Frontend local: `http://localhost:4200`
- Backend local: `http://localhost/api`
- CORS backend debe permitir credenciales desde Angular.
- El frontend no usa Bearer tokens.
- La sesion autenticada viaja en cookie HTTPOnly.
- El backend es la fuente real de permisos, roles, stock, precios y total de compra.

Endpoints soportados actualmente por el backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{user}`
- `PATCH /api/users/{user}`
- `DELETE /api/users/{user}`
- `GET /api/products`
- `GET /api/products/{product}`
- `POST /api/products`
- `PUT /api/products/{product}`
- `PATCH /api/products/{product}`
- `DELETE /api/products/{product}`
- `GET /api/catalog/products`
- `GET /api/catalog/products/{product}`
- `POST /api/purchases`

## Arquitectura Actual

La aplicacion esta preparada con componentes standalone, lazy loading y una capa inicial de tipado para el contrato backend.

Estructura principal:

- `src/app/core/guards/`: `authGuard` y `roleGuard`.
- `src/app/core/http/`: interceptor global de credenciales para cookies HTTPOnly.
- `src/app/core/models/`: interfaces TypeScript alineadas al contrato actual del backend.
- `src/app/core/services/`: servicios singleton, actualmente con base para autenticacion.
- `src/app/features/auth/`: rutas lazy para login y register.
- `src/app/features/admin/`: rutas lazy para dashboard, usuarios, productos y perfil.
- `src/app/features/catalog/`: ruta lazy de catalogo autenticado.
- `src/app/features/cart/`: ruta lazy de carrito.

## Tipado Del Contrato API

La capa de tipos actual cubre:

- Respuestas genericas `ApiResponse<T>`.
- Respuestas paginadas `PaginatedApiResponse<T>`.
- Meta de paginacion.
- Errores comunes `401`, `403`, `404`, `409` y `422`.
- Tipos de auth, usuarios, productos, catalogo y compras.
- Payloads de creacion, actualizacion y filtros para user management y product management.

Archivos principales:

- `src/app/core/models/api-response.ts`
- `src/app/core/models/user.ts`
- `src/app/core/models/product.ts`
- `src/app/core/models/purchase.ts`
- `src/app/core/models/index.ts`

## Autenticacion

La configuracion base de autenticacion corresponde al commit inicial del frontend y al contrato backend publicado.

Flujos preparados:

- Register con `name`, `email`, `password` y `password_confirmation`.
- Login con `email` y `password`.
- Obtencion del usuario autenticado actual con `GET /api/auth/me`.
- Logout con `POST /api/auth/logout`.

Detalles de integracion:

- Todas las peticiones HTTP autenticadas usan `withCredentials: true`.
- El backend devuelve auth como `data.user`.
- El frontend no almacena tokens sensibles.

## Rutas Y Pantallas Base

Rutas lazy registradas actualmente:

- `/auth/login`
- `/auth/register`
- `/admin`
- `/admin/users`
- `/admin/products`
- `/admin/profile`
- `/catalog`
- `/cart`

Restricciones preparadas:

- `authGuard` protege rutas privadas.
- `roleGuard` protege rutas exclusivas de `admin`.

## Compra De Productos

El frontend esta alineado con el contrato backend para crear compras mediante `POST /api/purchases`.

Payload esperado:

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

Reglas relevantes:

- No enviar `price`, `stock`, `subtotal`, `total`, `status` ni `user_id` como fuente de verdad.
- El backend recalcula precios, stock y total.
- El frontend debe usar el stock solo para UX local.

## Validaciones Ejecutadas

Validaciones ejecutadas sobre el frontend actual:

- `npm run build`
- `npm test`
- `docker compose config`
- `docker compose build`

## Control De Versiones

Repositorio remoto:

- `https://github.com/Tonyreng/AnthonyR-frontend-technical-test-Lexco.git`

Flujo configurado:

- `main`
- `develop`
- `feature/*`

Tags publicados actualmente:

- `v0.1.0-frontend-initial-setup`
- `v0.2.0-backend-contract-interfaces`

## Estado Actual

Hitos implementados actualmente:

- Inicializacion del proyecto Angular 21.
- Configuracion Docker con hot reload.
- Integracion base con PrimeNG y SCSS.
- Guards e interceptor de credenciales.
- Estructura lazy-loaded de features.
- Tipado TypeScript del contrato actual del backend.
