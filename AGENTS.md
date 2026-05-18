# AGENTS.md

Instrucciones para agentes que trabajen en el frontend Angular de esta prueba tecnica.

## Objetivo Del Frontend

Construir una SPA en Angular 21 para gestionar autenticacion, usuarios, productos, catalogo y carrito, consumiendo el backend Laravel ubicado en `../backend/`.

La aplicacion debe demostrar:

- Arquitectura clara de Angular.
- Lazy loading con Angular Router.
- Formularios reactivos con validaciones.
- Estado reactivo con Signals o RxJS.
- Seguridad de rutas con guards.
- Integracion segura mediante cookies HTTPOnly.
- UI moderna con PrimeNG v21 y SCSS.

## Stack Requerido

- Angular 21.
- TypeScript estricto.
- Angular Router con lazy loading.
- Formularios reactivos.
- HttpClient con `withCredentials: true`.
- Signals de Angular para estado local cuando aplique.
- RxJS para flujos asincronos cuando aplique.
- PrimeNG v21.
- SCSS.
- Git y GitHub.

## Backend De Integracion

El backend esperado es Laravel 13 en `../backend/`.

Contrato local:

- Frontend local: `http://localhost:4200`.
- API local: `http://localhost/api`.
- Todas las rutas API responden JSON.
- La autenticacion usa cookies HTTPOnly; no usar Bearer tokens ni almacenar tokens en `localStorage` o `sessionStorage`.
- Todas las peticiones autenticadas deben enviar credenciales con `withCredentials: true`.
- El backend es la fuente real de permisos, roles, stock, precios y totales de compra.

Endpoints implementados en backend:

- `POST /api/auth/register`.
- `POST /api/auth/login`.
- `GET /api/auth/me`.
- `POST /api/auth/logout`.
- `GET /api/users`.
- `POST /api/users`.
- `PUT /api/users/{user}`.
- `PATCH /api/users/{user}`.
- `DELETE /api/users/{user}`.
- `GET /api/products`.
- `GET /api/products/{product}`.
- `POST /api/products`.
- `PUT /api/products/{product}`.
- `PATCH /api/products/{product}`.
- `DELETE /api/products/{product}`.
- `GET /api/catalog/products`.
- `GET /api/catalog/products/{product}`.
- `POST /api/purchases`.

Formato general de exito:

```json
{
  "data": {},
  "message": "Operation completed successfully"
}
```

Formato general de error:

```json
{
  "message": "Validation failed",
  "errors": {
    "field": ["Error message"]
  }
}
```

Codigos relevantes:

- `200` para consultas y actualizaciones.
- `201` para creaciones y compra exitosa.
- `204` para logout o eliminacion sin cuerpo.
- `401` para sesion ausente o expirada.
- `403` para rol insuficiente.
- `404` para recurso inexistente.
- `409` para conflictos de negocio, por ejemplo stock insuficiente.
- `422` para errores de validacion.

## Roles Y Navegacion

Roles validos:

- `admin`: administrador.
- `user`: usuario regular.

Pantallas requeridas:

- Publicas: login y register.
- Privadas admin: dashboard, user management, product management y profile.
- Privadas user: catalogo y carrito.

Reglas de acceso:

- `AuthGuard` debe bloquear rutas privadas si no hay sesion valida.
- `RoleGuard` debe bloquear rutas admin si el usuario no tiene rol `admin`.
- Los guards mejoran UX, pero no reemplazan la autorizacion del backend.
- Al recibir `401`, limpiar estado local de sesion y redirigir a login.
- Al recibir `403`, mostrar mensaje de acceso denegado o redirigir a una ruta permitida.

## Autenticacion Y Sesion

Implementar un servicio central de autenticacion.

Responsabilidades minimas:

- Login con `email` y `password`.
- Register con `name`, `email`, `password` y `password_confirmation`.
- Obtener usuario actual con `GET /api/auth/me`.
- Logout con `POST /api/auth/logout`.
- Exponer el usuario autenticado y estado de sesion como Signals o flujo RxJS tipado.
- No permitir que el frontend envie ni manipule `role` durante registro publico.

Regla de primer usuario:

- El primer usuario registrado recibe rol `admin` desde backend.
- Registros posteriores reciben rol `user` desde backend.
- El frontend solo debe reflejar el rol recibido.

## Modulos Y Lazy Loading

Usar rutas lazy-loaded por dominio o feature.

Estructura recomendada:

- `src/app/core/` para servicios singleton, interceptors, guards y configuracion transversal.
- `src/app/shared/` para componentes puros, pipes, interfaces UI reutilizables y utilidades sin estado global.
- `src/app/features/auth/` para login/register.
- `src/app/features/admin/` para dashboard, usuarios, productos y perfil admin.
- `src/app/features/catalog/` para catalogo de usuario.
- `src/app/features/cart/` para carrito.
- `src/app/features/profile/` si el perfil se comparte entre roles.
- `src/app/models/` o `src/app/core/models/` para interfaces del contrato API.

Preferir componentes standalone y rutas por archivo, siguiendo el estilo moderno de Angular.

## Formularios Reactivos Y Validaciones

Usar Reactive Forms para login, register, CRUD y perfil.

Validacion de password obligatoria en frontend:

- Minimo 8 caracteres.
- Al menos una mayuscula.
- Al menos una minuscula.
- Al menos un numero.
- Al menos un caracter especial.

Reglas:

- La validacion frontend es solo UX; backend valida de nuevo.
- Formularios de edicion deben precargar datos actuales.
- Mostrar errores `422` del backend junto al campo correspondiente cuando sea posible.
- Sanitizar y normalizar datos antes de enviarlos cuando aplique, sin alterar el contrato del backend.

## Estado Reactivo

Usar Signals para estado local sincrono cuando sea natural, especialmente carrito.

Carrito requerido:

- Contador de productos actualizado instantaneamente.
- Total actualizado instantaneamente.
- Agregar y quitar productos sin recargar pagina.
- Validar cantidad localmente contra stock conocido para UX.
- Enviar compra al backend como `items`, sin enviar precios ni totales como fuente de verdad.

Payload de compra esperado:

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

## Interfaces TypeScript

Definir interfaces para todo dato recibido o enviado al backend.

Interfaces minimas:

- `User`.
- `Role`.
- `Product`.
- `CatalogProduct`.
- `Purchase` o `PurchaseResponse`.
- `ApiResponse<T>`.
- `PaginatedResponse<T>`.
- `ValidationErrorResponse`.

No usar `any` salvo justificacion concreta. Preferir tipos `unknown` y narrowing cuando una respuesta sea incierta.

## Ciclo De Vida Y Deteccion De Cambios

Cumplir los requerimientos del PDF:

- Usar `ngOnInit` para carga inicial de datos cuando el componente lo requiera.
- Usar `ngOnChanges` en componentes hijos que dependan de inputs variables.
- Usar `ngOnDestroy` para cancelar suscripciones manuales y evitar fugas.
- Preferir `takeUntilDestroyed()` o APIs modernas de Angular cuando aplique.
- Configurar componentes de presentacion con `ChangeDetectionStrategy.OnPush`.
- No usar suscripciones manuales si `async` pipe, Signals o `toSignal` resuelven el caso de forma mas limpia.

## UI Y Estilos

Usar PrimeNG v21 y SCSS.

Reglas:

- Mantener una UI consistente, limpia y responsive.
- Priorizar accesibilidad basica: labels, estados focus, mensajes de error asociados y botones con texto claro.
- Evitar estilos inline salvo casos puntuales.
- Centralizar tokens visuales en estilos globales o variables SCSS cuando aporte claridad.
- Las tablas CRUD deben soportar estados de carga, vacio y error.

## Seguridad Frontend

- No exponer secretos en codigo, README, commits ni logs.
- No guardar passwords, tokens ni datos sensibles en storage del navegador.
- No confiar en el rol guardado en cliente para seguridad real.
- No confiar en stock, precio o total calculado en cliente para compra final.
- Manejar errores HTTP sin mostrar detalles internos al usuario.
- Usar environment files para URLs y banderas de entorno.

## README Y Documentacion

Mantener `README.md` actualizado con:

- Requisitos.
- Instalacion.
- Comandos de desarrollo.
- Variables de entorno o archivos environment relevantes.
- Integracion con backend local.
- Scripts de build y test.

Documentar decisiones importantes de arquitectura cuando no sean obvias.

## Control De Versiones

El frontend debe vivir como repositorio Git independiente en `frontend/`.

Remote esperado:

- `origin`: `https://github.com/Tonyreng/AnthonyR-frontend-technical-test-Lexco.git`.

Aplicar Gitflow:

- `main`.
- `develop`.
- `feature/*`.

No crear commits, tags ni push automaticamente salvo solicitud explicita del usuario.

## Validaciones

Despues de cambios de codigo o configuracion, ejecutar cuando sea viable:

- `npm run build`.
- `npm test` si existen tests configurados y pueden correr sin interaccion.
- `npm run lint` si el proyecto lo tiene configurado.
- `docker compose config` si se modifica la configuracion de Docker.

Despues de una implementacion funcional, agregar o actualizar tests que cubran el comportamiento nuevo siempre que sea viable.

Si una validacion no puede ejecutarse, dejar claro el motivo.

## Docker

El frontend debe poder levantarse con Docker Compose igual que el backend.

Reglas:

- Mantener `compose.yaml` en `frontend/`.
- Publicar Angular en `http://localhost:4200`.
- Ejecutar Angular con `--host 0.0.0.0` para acceso desde el host.
- Usar polling (`--poll 1000` y `CHOKIDAR_USEPOLLING=true`) para hot reload dentro del contenedor.
- Montar el codigo local como volumen y aislar `node_modules` en un volumen nombrado.
- No copiar secretos ni archivos `.env` reales a imagenes Docker.

## Reglas Para Agentes

- Trabajar solo dentro de `frontend/` salvo instruccion explicita del usuario.
- Si una tarea requiere cambiar el contrato API, revisar `../backend/AGENTS.md` y coordinar cambios en backend antes de modificar el frontend.
- No modificar `../backend/` por conveniencia desde una tarea frontend.
- No editar archivos generados de dependencias como `node_modules/`.
- Mantener cambios pequenos, claros y alineados con Angular moderno.
- Preferir componentes standalone, servicios inyectables y rutas lazy-loaded.
- Usar nombres consistentes con el backend: `id`, `name`, `email`, `role`, `description`, `category`, `price`, `stock`, `created_at`, `updated_at`.
- No romper compatibilidad con el backend sin actualizar interfaces, servicios, README y pruebas correspondientes.
