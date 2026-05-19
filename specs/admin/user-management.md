# Spec: User Management Administrativo

## Historia De Usuario

Como administrador autenticado, quiero poder gestionar el módulo de User Management para listar usuarios, aplicar filtros, crear usuarios, editar usuarios, cambiar roles y eliminar usuarios.

## Objetivo

Permitir que un usuario con rol `admin` administre usuarios del sistema desde una pantalla privada, usando el backend como fuente de datos y permisos.

## Alcance

- Mostrar listado paginado de usuarios.
- Aplicar filtros de búsqueda y rol.
- Crear usuarios.
- Editar usuarios.
- Cambiar roles.
- Eliminar usuarios.
- Precargar datos actuales en formularios de edición.
- Mostrar estados de carga, vacío y error.
- Mostrar errores de validación del backend junto al campo correspondiente.
- Restringir acceso a usuarios autenticados con rol `admin`.
- Mantener la vista dentro de rutas admin con lazy loading.

## Fuera De Alcance

- Gestión de productos.
- Perfil del usuario autenticado.
- Recuperación de contraseña.
- Verificación de correo.
- Auditoría de cambios.
- Eliminación masiva de usuarios.
- Cambio de contraseña propio desde esta pantalla.
- Creación de nuevos roles distintos a `admin` y `user`.

## Reglas De Negocio

- Solo usuarios autenticados con rol `admin` pueden acceder al módulo.
- Usuarios con rol `user` no pueden acceder al módulo.
- El backend es la fuente real de permisos y validaciones.
- El listado debe obtenerse desde `GET /api/users`.
- La creación debe usar `POST /api/users`.
- La edición debe usar `PUT` o `PATCH /api/users/{user}`.
- La eliminación debe usar `DELETE /api/users/{user}`.
- El frontend no debe mostrar ni almacenar contraseñas existentes.
- En creación, la contraseña es obligatoria.
- En edición, la contraseña es opcional.
- Si la contraseña de edición se deja vacía, no debe enviarse al backend.
- Cambiar rol se realiza desde el formulario de edición.
- El formulario de edición debe precargar los datos actuales del usuario seleccionado.
- No se debe permitir que el administrador elimine su propio usuario desde la UI.
- No se debe permitir que el administrador cambie su propio rol desde la UI.
- Después de crear, editar o eliminar, el listado debe refrescarse automáticamente.
- Los guards frontend solo mejoran UX; el backend conserva la autorización real.

## Flujo Principal

### Listado

1. El administrador ingresa a `/admin/users`.
2. La vista carga mediante lazy loading dentro de las rutas admin.
3. El sistema solicita usuarios al backend mediante `GET /api/users`.
4. Mientras carga, se muestra estado de carga.
5. Cuando el backend responde, se muestra la tabla de usuarios.
6. La tabla muestra:
   - Nombre.
   - Email.
   - Rol.
   - Fecha de creación.
   - Acciones.

### Filtros

1. El administrador escribe en el campo de búsqueda o selecciona un rol.
2. El sistema solicita nuevamente el listado con query params.
3. El backend devuelve usuarios filtrados.
4. La tabla se actualiza con los resultados.
5. Si no hay resultados, se muestra estado vacío.

### Crear Usuario

1. El administrador hace clic en “Crear usuario”.
2. El sistema muestra un formulario.
3. El administrador completa:
   - Nombre.
   - Email.
   - Rol.
   - Contraseña.
   - Confirmación de contraseña.
4. El administrador guarda.
5. El sistema envía `POST /api/users`.
6. Si la respuesta es exitosa, se cierra el formulario y se refresca el listado.
7. Si hay errores de validación, se muestran junto a los campos correspondientes.

### Editar Usuario

1. El administrador selecciona editar en un usuario.
2. El sistema precarga en el formulario los datos actuales del usuario seleccionado:
   - Nombre.
   - Email.
   - Rol.
3. El administrador modifica los campos necesarios.
4. Si desea cambiar contraseña, completa contraseña y confirmación.
5. Si no desea cambiar contraseña, deja ambos campos vacíos.
6. El administrador guarda.
7. El sistema envía `PUT` o `PATCH /api/users/{user}`.
8. Si la respuesta es exitosa, se cierra el formulario y se refresca el listado.
9. Si hay errores de validación, se muestran junto a los campos correspondientes.

### Eliminar Usuario

1. El administrador hace clic en eliminar.
2. El sistema muestra una confirmación.
3. El administrador confirma.
4. El sistema envía `DELETE /api/users/{user}`.
5. Si la respuesta es exitosa, se refresca el listado.

## Flujos Alternativos

- Si el listado falla, se muestra estado de error.
- Si no hay usuarios para los filtros aplicados, se muestra estado vacío.
- Si el administrador cancela creación o edición, no se envía ninguna petición.
- Si el administrador cancela eliminación, no se elimina el usuario.
- Si una operación falla, el formulario o tabla permanece visible con un mensaje controlado.
- Si la sesión expira, se limpia sesión local y se redirige a login.
- Si el backend responde acceso denegado, se muestra acceso denegado o se redirige a una ruta permitida.

## Validaciones

### Listado

- El listado debe soportar paginación.
- El listado debe soportar búsqueda por texto.
- El listado debe soportar filtro por rol.
- El rol puede ser `admin`, `user` o todos.

### Crear Usuario

- `name` es obligatorio.
- `email` es obligatorio y debe tener formato email.
- `role` es obligatorio y debe ser `admin` o `user`.
- `password` es obligatoria.
- `password_confirmation` es obligatoria.
- `password` y `password_confirmation` deben coincidir.
- La contraseña debe cumplir:
  - Mínimo 8 caracteres.
  - Al menos una mayúscula.
  - Al menos una minúscula.
  - Al menos un número.
  - Al menos un carácter especial.

### Editar Usuario

- `name` es obligatorio.
- `email` es obligatorio y debe tener formato email.
- `role` es obligatorio y debe ser `admin` o `user`.
- `password` es opcional.
- Si se ingresa `password`, debe ingresarse `password_confirmation`.
- Si se ingresa `password`, ambas deben coincidir.
- Si `password` queda vacía, no debe enviarse.
- Si `password_confirmation` queda vacía y `password` también, no debe enviarse.
- El formulario debe precargar los valores actuales antes de editar.
- La UI no debe permitir cambiar el rol del usuario autenticado actual.

### Eliminar Usuario

- Debe existir confirmación antes de eliminar.
- La UI no debe permitir eliminar al usuario autenticado actual.

## Permisos Y Roles

- `admin`:
  - Puede listar usuarios.
  - Puede filtrar usuarios.
  - Puede crear usuarios.
  - Puede editar usuarios.
  - Puede cambiar roles de otros usuarios.
  - Puede eliminar otros usuarios.
- `user`:
  - No puede acceder al módulo.
- No autenticado:
  - No puede acceder al módulo.

## Estados

### Tabla

- `loading`:
  - Muestra indicador de carga.
- `loaded`:
  - Muestra usuarios.
- `empty`:
  - Muestra mensaje de que no hay resultados.
- `error`:
  - Muestra mensaje de error controlado.

### Formulario

- `create`:
  - Formulario vacío con contraseña obligatoria.
- `edit`:
  - Formulario precargado con datos actuales.
  - Contraseña opcional.
- `submitting`:
  - Botón guardar deshabilitado.
- `validation-error`:
  - Errores mostrados junto a campos.
- `success`:
  - Cierra formulario y refresca tabla.

### Eliminación

- `confirming`:
  - Muestra confirmación.
- `deleting`:
  - Deshabilita acciones del usuario afectado.
- `deleted`:
  - Refresca listado.
- `delete-error`:
  - Muestra error controlado.

## Criterios De Aceptación

- Dado un administrador autenticado, cuando entra a `/admin/users`, entonces ve el módulo User Management.
- Dado un administrador autenticado, cuando carga la vista, entonces se solicita `GET /api/users`.
- Dado que el backend responde usuarios, cuando la tabla renderiza, entonces muestra nombre, email, rol, fecha de creación y acciones.
- Dado que el backend responde paginación, cuando la tabla renderiza, entonces muestra controles de paginación.
- Dado que el administrador aplica búsqueda, cuando el backend responde, entonces la tabla muestra resultados filtrados.
- Dado que el administrador filtra por rol, cuando el backend responde, entonces la tabla muestra solo usuarios del rol seleccionado.
- Dado que no hay resultados, cuando la tabla renderiza, entonces muestra estado vacío.
- Dado que el administrador crea un usuario válido, cuando guarda, entonces se envía `POST /api/users`.
- Dado que la creación es exitosa, cuando el backend responde, entonces el formulario se cierra y el listado se refresca.
- Dado que el backend devuelve `422`, cuando el formulario renderiza, entonces muestra errores junto a los campos correspondientes.
- Dado que el administrador edita un usuario, cuando abre el formulario, entonces los datos actuales están precargados.
- Dado que el administrador edita sin contraseña, cuando guarda, entonces no se envía `password` ni `password_confirmation`.
- Dado que el administrador cambia el rol de otro usuario, cuando guarda, entonces se envía el nuevo rol al backend.
- Dado que el administrador intenta editar su propio rol, cuando ve el formulario, entonces la UI no permite modificar ese campo.
- Dado que el administrador intenta eliminarse a sí mismo, cuando ve la tabla, entonces la UI no permite esa acción.
- Dado que el administrador elimina otro usuario, cuando confirma, entonces se envía `DELETE /api/users/{user}`.
- Dado que la eliminación es exitosa, cuando el backend responde, entonces el listado se refresca.
- Dado un usuario con rol `user`, cuando intenta entrar a `/admin/users`, entonces no puede ver el módulo.
- Dado un usuario no autenticado, cuando intenta entrar a `/admin/users`, entonces es redirigido a login.
- Dado que la ruta pertenece a admin, cuando se carga, entonces se mantiene dentro del lazy loading existente.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `403 Forbidden`:
  - Mostrar acceso denegado o redirigir a una ruta permitida.
- `422 Validation Error`:
  - Mostrar errores junto a campos.
- Error al listar:
  - Mostrar “No pudimos cargar los usuarios.”
- Error al crear:
  - Mostrar “No pudimos crear el usuario.”
- Error al editar:
  - Mostrar “No pudimos actualizar el usuario.”
- Error al eliminar:
  - Mostrar “No pudimos eliminar el usuario.”
- Respuesta inesperada:
  - Mostrar mensaje genérico sin detalles internos.

## Contrato De Datos Esperado

### Listar usuarios

```http
GET /api/users
```

Query params esperados:

```text
page?: number
per_page?: number
search?: string
role?: admin | user
```

Respuesta esperada:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2026-05-18T12:21:07.000000Z",
      "updated_at": "2026-05-18T12:21:07.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "last_page": 1
  },
  "message": "Operation completed successfully"
}
```

### Crear usuario

```http
POST /api/users
```

Payload:

```json
{
  "name": "Regular User",
  "email": "user@example.com",
  "role": "user",
  "password": "Password*123",
  "password_confirmation": "Password*123"
}
```

### Editar usuario

```http
PATCH /api/users/{user}
```

Payload sin cambio de contraseña:

```json
{
  "name": "Regular User Updated",
  "email": "user.updated@example.com",
  "role": "user"
}
```

Payload con cambio de contraseña:

```json
{
  "name": "Regular User Updated",
  "email": "user.updated@example.com",
  "role": "admin",
  "password": "NewPassword*123",
  "password_confirmation": "NewPassword*123"
}
```

### Eliminar usuario

```http
DELETE /api/users/{user}
```

Respuesta esperada:

```http
204 No Content
```

## Dependencias

- Backend Laravel existente.
- Endpoints:
  - `GET /api/users`
  - `POST /api/users`
  - `PATCH /api/users/{user}`
  - `DELETE /api/users/{user}`
- Estado de autenticación existente en `AuthService`.
- Guards existentes:
  - `AuthGuard`
  - `RoleGuard`
- Modelo frontend `User`.
- Respuesta paginada frontend `PaginatedApiResponse<T>`.
- Rutas admin lazy-loaded existentes.

## Notas De Implementación

- Mantener la vista en `src/app/features/admin/users`.
- Mantener la ruta bajo `/admin/users`.
- Usar formularios reactivos.
- Reutilizar `UsersService` existente o extenderlo si ya fue creado para dashboard.
- No usar `any`.
- No guardar contraseñas en estado persistente.
- No mostrar contraseñas existentes.
- Mapear errores `422` hacia los controles del formulario.
- Agregar tests de:
  - carga/listado.
  - filtros.
  - creación.
  - edición con precarga.
  - edición sin enviar contraseña vacía.
  - cambio de rol.
  - bloqueo de auto-eliminación.
  - bloqueo de cambio de rol propio.
  - eliminación con confirmación.
  - estados de error.
