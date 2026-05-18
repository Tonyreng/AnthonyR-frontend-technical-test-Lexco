# Lexco Frontend

SPA Angular 21 para la prueba tecnica de gestion de usuarios, productos, catalogo y carrito.

## Stack

- Angular 21
- TypeScript estricto
- Angular Router con lazy loading
- SCSS
- PrimeNG v21
- Cookies HTTPOnly con `withCredentials: true`
- Docker Compose para desarrollo local con hot reload

## Requisitos

- Node.js 24 o superior para ejecucion local sin Docker
- npm 11 o superior
- Docker y Docker Compose para ejecucion containerizada

## Backend Esperado

El frontend consume el backend Laravel ubicado en `../backend/`.

Valores locales esperados:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost/api`
- CORS backend: debe permitir `http://localhost:4200` con credenciales

La autenticacion usa cookies HTTPOnly. El frontend no usa Bearer tokens ni guarda tokens en storage del navegador.

## Instalacion Local

```bash
npm install
```

## Desarrollo Local

```bash
npm start
```

La app queda disponible en `http://localhost:4200`.

## Desarrollo Con Docker

Levantar el frontend con hot reload:

```bash
docker compose up --build
```

El contenedor monta el codigo local en `/app` y ejecuta Angular con polling para detectar cambios desde Docker:

```bash
npm run start:docker
```

Puerto publicado:

- `4200:4200`

## Scripts

```bash
npm start
npm run start:docker
npm run build
npm test
```

## Configuracion

La URL base de la API vive en:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Valor actual:

```ts
apiUrl: 'http://localhost/api'
```

## Estructura Inicial

- `src/app/core/guards/`: `authGuard` y `roleGuard`.
- `src/app/core/http/`: interceptor de credenciales para cookies HTTPOnly.
- `src/app/core/models/`: interfaces TypeScript del contrato API.
- `src/app/core/services/`: servicio central de autenticacion.
- `src/app/features/auth/`: rutas lazy para login y register.
- `src/app/features/admin/`: rutas lazy para dashboard, usuarios, productos y perfil.
- `src/app/features/catalog/`: ruta lazy para catalogo.
- `src/app/features/cart/`: ruta lazy para carrito.

## Contrato API Inicial

Endpoints principales esperados:

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

Las compras deben enviarse sin precios ni totales calculados por el cliente:

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

## Validacion

Compilar:

```bash
npm run build
```

Ejecutar tests:

```bash
npm test
```

## Git

Repositorio remoto configurado:

```bash
https://github.com/Tonyreng/AnthonyR-frontend-technical-test-Lexco.git
```

Aplicar Gitflow con ramas `main`, `develop` y `feature/*`.
