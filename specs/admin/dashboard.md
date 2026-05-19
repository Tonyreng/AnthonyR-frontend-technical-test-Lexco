# Spec: Dashboard Administrativo

## Historia De Usuario

Como administrador autenticado, quiero poder ingresar a la página de dashboard para visualizar dos cards con el total de usuarios y total de productos, y dos cards adicionales que me lleven a Users management y Products management. También quiero visualizar mi rol en el sidebar y que la vista use lazy loading.

## Objetivo

Permitir que un usuario con rol `admin` tenga una vista inicial de administración donde pueda:

- Consultar rápidamente el total de usuarios registrados.
- Consultar rápidamente el total de productos registrados.
- Navegar hacia la gestión de usuarios.
- Navegar hacia la gestión de productos.
- Confirmar visualmente su rol desde el sidebar.

## Alcance

- Crear o completar la vista de dashboard administrativo.
- Mostrar 2 cards informativas:
  - Total usuarios.
  - Total productos.
- Mostrar 2 cards de navegación:
  - Users management.
  - Products management.
- Obtener los totales desde los endpoints existentes del backend.
- Usar el total global de la paginación cuando el backend devuelva respuestas paginadas.
- Mostrar el rol del usuario autenticado en el sidebar.
- Mantener la vista dentro de rutas lazy-loaded de administración.
- Mantener acceso restringido a usuarios autenticados con rol `admin`.
- Agregar estados de carga y error para los totales.

## Fuera De Alcance

- Crear, editar o eliminar usuarios.
- Crear, editar o eliminar productos.
- Implementar nuevas métricas del dashboard.
- Cambiar roles o permisos desde el dashboard.
- Modificar el contrato del backend.
- Crear endpoints nuevos para estadísticas agregadas.
- Implementar gráficos o reportes avanzados.

## Reglas De Negocio

- Solo usuarios autenticados con rol `admin` pueden acceder al dashboard.
- Los usuarios con rol `user` no deben poder acceder al dashboard.
- Los totales deben provenir del backend, no de datos hardcodeados.
- Si el backend devuelve paginación, se debe usar el total global de la paginación.
- Las cards de navegación deben enviar a las pantallas administrativas correspondientes.
- El rol mostrado en el sidebar debe reflejar el rol real del usuario autenticado en el estado de sesión del frontend.
- La autorización real sigue dependiendo del backend; los guards del frontend solo mejoran la UX.

## Flujo Principal

1. El administrador inicia sesión correctamente.
2. El sistema redirige al administrador hacia `/admin` o la ruta configurada para dashboard.
3. La vista del dashboard se carga mediante lazy loading.
4. El sistema solicita al backend la lista paginada de usuarios.
5. El sistema solicita al backend la lista paginada de productos.
6. El dashboard muestra estado de carga en las cards de totales.
7. Cuando llegan las respuestas:
   - La card de usuarios muestra el total global de usuarios.
   - La card de productos muestra el total global de productos.
8. El sidebar muestra la información del usuario autenticado y su rol.
9. El administrador puede hacer clic en:
   - Users management para ir a gestión de usuarios.
   - Products management para ir a gestión de productos.

## Flujos Alternativos

- Si el total de usuarios carga correctamente pero el de productos falla, la card de usuarios debe mostrar su valor y la de productos debe mostrar error.
- Si el total de productos carga correctamente pero el de usuarios falla, la card de productos debe mostrar su valor y la de usuarios debe mostrar error.
- Si ambas consultas fallan, ambas cards deben mostrar estado de error.
- Si el administrador navega hacia una card de gestión, la aplicación debe cambiar de ruta sin recargar la página.
- Si la sesión expira mientras el dashboard intenta cargar datos, el sistema debe limpiar la sesión local y redirigir a login.

## Validaciones

- La vista no debe mostrarse para usuarios no autenticados.
- La vista no debe mostrarse para usuarios autenticados sin rol `admin`.
- Los totales deben ser numéricos cuando la respuesta del backend sea válida.
- Si la respuesta paginada incluye `meta.total`, debe utilizarse ese valor como fuente del total.
- Si el total no está disponible o la respuesta no cumple el contrato esperado, debe mostrarse un estado de error controlado en la card afectada.

## Permisos Y Roles

- `admin`:
  - Puede acceder al dashboard.
  - Puede ver totales de usuarios y productos.
  - Puede navegar hacia Users management.
  - Puede navegar hacia Products management.
- `user`:
  - No puede acceder al dashboard.
  - Debe ser redirigido a una ruta permitida, como catálogo.
- Usuario no autenticado:
  - No puede acceder al dashboard.
  - Debe ser redirigido a login.

## Estados

### Dashboard

- `loading`:
  - Se muestran indicadores de carga en las cards de totales.
- `loaded`:
  - Se muestran los totales obtenidos del backend.
- `partial-error`:
  - Una card muestra su total y otra muestra error.
- `error`:
  - Ambas cards muestran error.
- `unauthorized`:
  - El usuario no tiene sesión válida o no tiene rol suficiente.

### Sidebar

- `authenticated-admin`:
  - Muestra el nombre/email del usuario y rol legible `Administrador`.
- `authenticated-user`:
  - No debería ver el sidebar admin en dashboard.
- `unauthenticated`:
  - No debe mostrar navegación privada.

## Criterios De Aceptación

- Dado un administrador autenticado, cuando navega a `/admin`, entonces ve el dashboard administrativo.
- Dado un administrador autenticado, cuando el dashboard carga, entonces ve una card con el total global de usuarios.
- Dado un administrador autenticado, cuando el dashboard carga, entonces ve una card con el total global de productos.
- Dado que el backend responde con paginación, cuando se muestran los totales, entonces se usa el total global de la paginación y no solo la cantidad de registros recibidos.
- Dado que los datos están cargando, cuando el dashboard aún espera respuesta, entonces las cards de totales muestran estado de carga.
- Dado que falla la consulta de usuarios, cuando el dashboard renderiza, entonces la card de usuarios muestra un mensaje de error controlado.
- Dado que falla la consulta de productos, cuando el dashboard renderiza, entonces la card de productos muestra un mensaje de error controlado.
- Dado un administrador autenticado, cuando hace clic en la card Users management, entonces navega a la ruta de gestión de usuarios.
- Dado un administrador autenticado, cuando hace clic en la card Products management, entonces navega a la ruta de gestión de productos.
- Dado un administrador autenticado, cuando visualiza el sidebar, entonces puede ver su rol como `Administrador`.
- Dado un usuario no autenticado, cuando intenta ingresar a `/admin`, entonces es redirigido a login.
- Dado un usuario autenticado con rol `user`, cuando intenta ingresar a `/admin`, entonces no puede ver el dashboard y es redirigido a una ruta permitida.
- Dado que la vista de dashboard pertenece al área admin, cuando se carga la ruta, entonces se carga mediante lazy loading.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `403 Forbidden`:
  - Mostrar o redirigir a una ruta permitida según comportamiento existente del guard.
- Error al obtener usuarios:
  - Mostrar mensaje en card: “No pudimos cargar el total de usuarios.”
- Error al obtener productos:
  - Mostrar mensaje en card: “No pudimos cargar el total de productos.”
- Respuesta sin total paginado válido:
  - Mostrar error controlado en la card correspondiente.
- Error inesperado:
  - No mostrar detalles internos.
  - Mostrar mensaje genérico en la card afectada.

## Contrato De Datos Esperado

### Usuarios

Endpoint esperado:

```http
GET /api/users
```

Respuesta paginada esperada:

```json
{
  "data": [],
  "meta": {
    "total": 25
  }
}
```

El dashboard debe usar:

```ts
meta.total
```

### Productos

Endpoint esperado:

```http
GET /api/products
```

Respuesta paginada esperada:

```json
{
  "data": [],
  "meta": {
    "total": 12
  }
}
```

El dashboard debe usar:

```ts
meta.total
```

### Usuario autenticado

Fuente esperada:

```ts
authService.user()
```

Campos relevantes:

```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "role": "admin"
}
```

## UX / UI

- El dashboard debe tener una presentación clara y responsive.
- Las cards informativas deben diferenciarse visualmente de las cards de navegación.
- Las cards de totales deben incluir:
  - Título.
  - Valor.
  - Estado de carga.
  - Estado de error.
- Las cards de navegación deben parecer clickeables y tener texto claro.
- El rol en sidebar debe mostrarse cerca de la información del usuario autenticado.
- El rol `admin` debe mostrarse como `Administrador`.
- El rol `user` debe mostrarse como `Usuario` si se reutiliza el sidebar para otros contextos.

## Dependencias

- Backend Laravel existente.
- Endpoints:
  - `GET /api/users`
  - `GET /api/products`
- Estado de autenticación existente en `AuthService`.
- Guards existentes:
  - `AuthGuard`
  - `RoleGuard`
- Rutas admin lazy-loaded existentes o a completar.
- Interfaces frontend existentes para respuestas paginadas, usuarios y productos.

## Notas De Implementación

- Mantener la vista en `features/admin`.
- Mantener rutas admin con lazy loading.
- Agregar o completar servicios frontend para consultar usuarios y productos si aún no existen.
- Evitar enviar o depender de roles desde storage.
- Agregar tests de:
  - render de totals cards.
  - estados de carga/error.
  - navegación desde cards.
  - visualización del rol en sidebar.
  - uso de `meta.total` como fuente de totales.
