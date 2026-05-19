# Lexco Frontend

SPA en Angular 21 para la prueba tecnica de Lexco. Implementa autenticacion por sesion con cookies HTTPOnly, modulo administrativo, catalogo autenticado, carrito local y checkout contra backend Laravel.

## Stack

- Angular 21
- TypeScript estricto
- Angular Router con lazy loading
- Reactive Forms
- Signals para estado local
- PrimeNG v21 + PrimeIcons
- SCSS
- Vitest via `ng test`
- Docker Compose para desarrollo local

## Requisitos

Para desarrollo con contenedores:

- Docker
- Docker Compose

Para desarrollo local sin Docker:

- Node.js 24 o superior
- npm 11 o superior

## Instalacion

Instalar dependencias:

```bash
npm install
```

## Configuracion De Entorno

Archivos actuales:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Configuracion actual:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost/api',
};
```

Notas importantes:

- El frontend corre en `http://localhost:4200`.
- La API esperada corre en `http://localhost/api`.
- Todas las peticiones autenticadas usan cookies HTTPOnly.
- El interceptor global agrega `withCredentials: true` a cada request.
- No se usan Bearer tokens ni `localStorage`/`sessionStorage` para auth.

No subir secretos, cookies, tokens ni configuraciones sensibles reales al repositorio.

## Ejecucion

Levantar frontend localmente:

```bash
npm start
```

Levantar frontend con Docker y hot reload:

```bash
docker compose up --build
```

El script usado en Docker es:

```bash
npm run start:docker
```

## Scripts Disponibles

```bash
npm start
npm run start:docker
npm run build
npm run watch
npm test
```

## Validaciones

Compilar proyecto:

```bash
npm run build
```

Ejecutar pruebas:

```bash
npm test
```

Ejecutar pruebas sin modo watch:

```bash
npm test -- --watch=false
```

Validar Docker Compose:

```bash
docker compose config
```

## Docker

Archivos relevantes:

- `Dockerfile`
- `compose.yaml`
- `.dockerignore`

Configuracion actual:

- Servicio: `angular`
- Puerto publicado: `4200:4200`
- Comando: `npm install && npm run start:docker`
- Hot reload con `--poll 1000`
- `CHOKIDAR_USEPOLLING=true`
- Codigo montado en `/app`
- Volumen aislado para `node_modules`

## Integracion Con Backend

El frontend consume el backend Laravel ubicado en `../backend/`.

Contrato esperado:

- Frontend: `http://localhost:4200`
- API: `http://localhost/api`
- CORS backend debe permitir credenciales desde Angular
- La autenticacion viaja en cookie HTTPOnly
- El backend es la fuente real de permisos, roles, stock, precios y totales

Endpoints soportados actualmente:

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

## Funcionalidades Implementadas

### Autenticacion

- Login con `email` y `password`
- Register con `name`, `email`, `password` y `password_confirmation`
- Carga de usuario actual con `GET /api/auth/me`
- Logout con `POST /api/auth/logout`
- Limpieza de sesion local ante `401`
- Redireccion por rol:
  - `admin` -> `/admin`
  - `user` -> `/catalog`

### Layout Global

- Header fijo con accion de logout
- Sidebar para rutas privadas
- Sidebar colapsable
- Navegacion diferenciada por rol
- Badge reactivo con contador del carrito

### Admin

- Dashboard administrativo
- Gestion de usuarios:
  - listado paginado
  - filtros por busqueda y rol
  - crear, editar y eliminar
  - protecciones para no borrar ni cambiar el rol propio
  - boton `Limpiar` en filtros
- Gestion de productos:
  - listado paginado
  - filtros por busqueda, categoria y stock
  - crear, editar, eliminar y ver detalle
  - boton `Limpiar` en filtros
- Perfil admin:
  - ver datos actuales
  - editar nombre, email y password

### Usuario

- Catalogo autenticado:
  - listado de productos disponibles
  - filtro por busqueda
  - filtro por categoria
  - paginacion
  - agregar al carrito
  - boton `Limpiar` en filtros
- Carrito:
  - incremento y decremento de cantidades
  - eliminacion de items
  - vaciado total
  - total estimado reactivo
  - validacion local contra stock conocido
- Checkout:
  - envio de `POST /api/purchases`
  - payload minimo `{ items: [{ product_id, quantity }] }`
  - bloqueo de doble envio mientras procesa
  - manejo de `401`, `409`, `422` y error generico
  - modal de exito con resumen de compra, cantidades y total final

## Rutas Implementadas

- `/auth/login`
- `/auth/register`
- `/admin`
- `/admin/users`
- `/admin/products`
- `/admin/profile`
- `/catalog`
- `/cart`

Reglas de acceso:

- `authGuard` protege rutas privadas
- `roleGuard` protege rutas admin
- Ruta raiz redirige a `/catalog`
- Rutas desconocidas redirigen a `/catalog`

## Arquitectura

Estructura principal:

- `src/app/core/guards/`: guards de autenticacion y rol
- `src/app/core/http/`: interceptor global de credenciales
- `src/app/core/models/`: contratos TypeScript del backend
- `src/app/core/services/`: auth, users, products, cart y purchases
- `src/app/features/auth/`: login y register
- `src/app/features/admin/`: dashboard, usuarios, productos y perfil
- `src/app/features/catalog/`: catalogo autenticado
- `src/app/features/cart/`: carrito y checkout
- `src/environments/`: configuracion por entorno
- `specs/`: especificaciones funcionales por feature

Decisiones de arquitectura:

- Componentes standalone
- Lazy loading por dominio
- `ChangeDetectionStrategy.OnPush`
- Signals para estado local del carrito y estados de UI
- Reactive Forms para auth y CRUD
- Manejo de errores HTTP orientado a UX

## Modelos Y Contrato API

Tipado actual cubre:

- `ApiResponse<T>`
- `PaginatedApiResponse<T>`
- `PaginationMeta`
- errores `401`, `403`, `404`, `409` y `422`
- modelos de usuario, producto, catalogo y compra
- payloads de filtros, creacion y actualizacion

Archivos relevantes:

- `src/app/core/models/api-response.ts`
- `src/app/core/models/user.ts`
- `src/app/core/models/product.ts`
- `src/app/core/models/purchase.ts`

## Compra De Productos

Checkout actual:

- se ejecuta desde `/cart`
- usa `POST /api/purchases`
- envia solo `product_id` y `quantity`
- no envia `price`, `subtotal`, `total`, `status` ni `user_id`
- muestra modal de exito con resumen final

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

## Testing

Cobertura actual incluye pruebas para:

- auth
- dashboard admin
- gestion de usuarios
- gestion de productos
- perfil admin
- catalogo
- carrito
- checkout del carrito
- `CartService`

Ultima validacion conocida:

- `npm test -- --watch=false` -> `74 passed`
- `npm run build` -> OK

## Especificaciones Funcionales

Specs actuales disponibles en `specs/`:

- `specs/auth/login.md`
- `specs/auth/register.md`
- `specs/auth/logout.md`
- `specs/admin/dashboard.md`
- `specs/admin/user-management.md`
- `specs/admin/product-management.md`
- `specs/admin/profile.md`
- `specs/catalog/product-catalog.md`
- `specs/cart/checkout.md`

## Control De Versiones

Repositorio remoto:

- `https://github.com/Tonyreng/AnthonyR-frontend-technical-test-Lexco.git`

Flujo de ramas:

- `main`
- `develop`
- `feature/*`

Tags publicados:

- `v0.1.0-frontend-initial-setup`
- `v0.2.0-backend-contract-interfaces`
- `v0.3.0-layout-navigation`
- `v0.4.0-auth-session-flow`
- `v0.5.0-admin-dashboard`
- `v0.6.0-user-management`
- `v0.7.0-product-management`
- `v0.8.0-admin-profile`
- `v0.9.0-product-catalog`
- `v0.10.0-cart-checkout`

## Estado Actual

El frontend ya cubre el flujo principal de la prueba tecnica:

- autenticacion por sesion
- administracion de usuarios y productos
- perfil admin
- catalogo autenticado
- carrito local reactivo
- checkout con resumen de compra

La principal funcionalidad aun fuera de alcance es el historial de compras o detalle persistido posterior a la compra.
