# Spec: Cierre de sesión de usuario autenticado

## Historia De Usuario

Como usuario autenticado, quiero poder cerrar sesión para salir y no dejar mi sesión iniciada.

## Objetivo

Permitir que un usuario autenticado cierre su sesión de forma segura desde el frontend, invalidando la sesión en backend y eliminando el estado local de autenticación para evitar que la sesión quede activa en la aplicación.

## Alcance

- Botón de logout en el header global.
- Visibilidad del botón solo en páginas privadas.
- Envío de petición al backend para cerrar sesión.
- Limpieza del estado local de autenticación.
- Redirección a `/auth/login`.
- Manejo básico de errores.
- Tests del flujo de logout.

## Fuera De Alcance

- Modal de confirmación antes de cerrar sesión.
- Logout automático por inactividad.
- Revocación de tokens Bearer.
- Eliminación de tokens de `localStorage` o `sessionStorage`.
- Cambio de comportamiento backend.
- Mensajes persistentes tipo toast global, salvo que ya exista infraestructura.

## Actores

- Usuario autenticado.
- Backend Laravel como autoridad de sesión.

## Reglas De Negocio

- Solo usuarios autenticados deben ver el botón de logout.
- El botón de logout debe estar ubicado en el header global.
- El frontend debe llamar `POST /api/auth/logout`.
- La petición debe enviarse con `withCredentials: true`.
- Si logout es exitoso, el estado local de usuario autenticado debe limpiarse.
- Si backend responde `401`, el frontend debe tratarlo como sesión ya cerrada/expirada, limpiar estado local y redirigir a login.
- Después del logout, el usuario debe quedar en `/auth/login`.
- Al cerrar sesión, sidebar y contenido privado dejan de mostrarse por estar en ruta pública.
- No se deben manipular tokens de storage porque la app usa cookies HTTPOnly.

## Flujo Principal

1. El usuario autenticado navega por una página privada.
2. El header global muestra el botón de logout.
3. El usuario presiona el botón de logout.
4. El frontend deshabilita o marca el botón como cargando.
5. El frontend envía `POST /api/auth/logout`.
6. El backend invalida la sesión.
7. El frontend limpia el estado local de usuario autenticado.
8. El frontend redirige a `/auth/login`.
9. La pantalla pública de login se muestra sin sidebar privado.

## Flujos Alternativos

### Sesión Expirada Antes De Logout

- Si backend responde `401`, el frontend:
  - limpia estado local;
  - redirige a `/auth/login`;
  - no muestra error técnico.

### Error Inesperado

- Si ocurre un error inesperado distinto a `401`, el frontend:
  - muestra un mensaje general o mantiene al usuario en la página actual;
  - no expone detalles técnicos;
  - permite reintentar.

### Doble Click En Logout

- Si el usuario presiona varias veces el botón, solo debe ejecutarse un logout activo.
- Mientras el logout está en curso, el botón debe quedar deshabilitado o en estado de carga.

## Validaciones

- No requiere campos de formulario.
- El botón solo debe estar disponible cuando la ruta actual es privada.
- La acción no debe ejecutarse si ya hay un logout en curso.

## Permisos Y Roles

- Usuarios no autenticados no ven el botón de logout.
- Usuarios autenticados con rol `admin` o `user` pueden cerrar sesión.
- El rol no cambia el comportamiento del logout.

## Estados UI

- Estado privado normal: botón logout visible.
- Estado público: botón logout oculto.
- Estado cerrando sesión: botón deshabilitado o con loading.
- Estado logout exitoso: redirección a `/auth/login`.
- Estado sesión expirada: redirección a `/auth/login`.
- Estado error inesperado: mensaje general visible o reintento disponible.

## Contrato De Datos Esperado

### Endpoint

```http
POST /api/auth/logout
```

### Request

Sin body funcional requerido.

```json
{}
```

### Response Exitosa

```http
204 No Content
```

### Error Sesión Expirada

```json
{
  "message": "Unauthenticated."
}
```

## Criterios De Aceptación

- Dado un usuario autenticado en una ruta privada, cuando se renderiza el header, entonces ve el botón de logout.
- Dado un usuario en una ruta pública, cuando se renderiza el header, entonces no ve el botón de logout.
- Dado un usuario autenticado, cuando presiona logout, entonces el frontend llama `POST /api/auth/logout`.
- Dado un logout en curso, cuando el usuario vuelve a presionar el botón, entonces no se dispara una segunda petición concurrente.
- Dado un logout exitoso, cuando backend responde `204`, entonces el estado local de usuario se limpia.
- Dado un logout exitoso, cuando el estado local se limpia, entonces el usuario es redirigido a `/auth/login`.
- Dado una sesión ya expirada, cuando backend responde `401`, entonces el estado local se limpia y el usuario es redirigido a `/auth/login`.
- Dado un error inesperado, cuando falla el logout, entonces el usuario ve un mensaje general o puede reintentar sin ver detalles técnicos.
- Dado el usuario en `/auth/login` después del logout, entonces el sidebar privado no se muestra.

## Dependencias

- Backend Laravel disponible en `http://localhost/api`.
- Endpoint `POST /api/auth/logout` implementado.
- CORS configurado para `http://localhost:4200`.
- Cookies HTTPOnly configuradas en backend.
- `AuthService.logout()` disponible.
- Header global implementado.
- `guestGuard` disponible para rutas públicas.
- `authGuard` disponible para rutas privadas.
