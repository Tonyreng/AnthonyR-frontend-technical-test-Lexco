# Spec: Perfil Administrativo

## Historia De Usuario

Como administrador autenticado, quiero poder acceder a mi perfil para ver mis datos y editarlos si lo necesito.

## Objetivo

Permitir que un usuario con rol `admin` acceda a una pantalla privada de perfil donde pueda visualizar y actualizar sus datos principales de cuenta.

## Alcance

- Acceso al perfil desde la ruta privada `/admin/profile`.
- Visualización de datos básicos del administrador:
  - Nombre.
  - Email.
  - Rol.
- Edición de:
  - Nombre.
  - Email.
  - Contraseña.
- Validación frontend para mejorar UX.
- Manejo de errores de validación del backend.
- Redirección según estado de sesión y rol.
- UI consistente con las pantallas administrativas existentes.

## Fuera De Alcance

- Perfil para usuarios con rol `user`.
- Edición de rol desde el perfil.
- Edición de ID, fechas de creación o actualización.
- Imagen/avatar de perfil.
- Eliminación de cuenta propia.
- Gestión de otros usuarios desde esta pantalla.
- Ver historial de compras o actividad.

## Reglas De Negocio

- Solo administradores autenticados pueden acceder a `/admin/profile`.
- Si no hay sesión válida o la sesión expiró, se debe redirigir a `/auth/login`.
- Si un usuario autenticado no tiene rol `admin`, se debe redirigir a `/catalog`.
- El perfil solo permite editar los datos del usuario autenticado actual.
- El campo `role` se muestra únicamente como dato informativo.
- El frontend no debe enviar ni permitir modificar:
  - `id`.
  - `role`.
  - `created_at`.
  - `updated_at`.
- El cambio de contraseña se realiza en el mismo formulario que nombre y email.
- Para cambiar contraseña se debe ingresar:
  - Nueva contraseña.
  - Confirmación de nueva contraseña.
- Si los campos de contraseña están vacíos, no se debe intentar cambiar la contraseña.
- Si se ingresa nueva contraseña, la confirmación debe coincidir.

## Flujo Principal

1. El administrador ingresa a `/admin/profile`.
2. El sistema valida que exista una sesión activa.
3. El sistema valida que el usuario autenticado tenga rol `admin`.
4. La pantalla carga los datos actuales del usuario autenticado.
5. El administrador visualiza:
   - Nombre.
   - Email.
   - Rol.
6. El administrador puede modificar nombre, email o contraseña.
7. El administrador guarda los cambios.
8. El sistema valida el formulario.
9. Si el formulario es válido, se envía la actualización al backend.
10. Si la respuesta es exitosa:
    - Se actualizan los datos visibles.
    - Se muestra un mensaje de éxito.
    - El administrador permanece en `/admin/profile`.

## Flujos Alternativos

- Si el administrador entra con sesión expirada:
  - Se limpia el estado local de sesión.
  - Se redirige a `/auth/login`.
- Si un usuario autenticado con rol `user` intenta entrar:
  - Se redirige a `/catalog`.
- Si el backend devuelve errores de validación:
  - Se muestran junto al campo correspondiente cuando sea posible.
- Si el administrador cancela o no modifica nada:
  - No se envía actualización innecesaria.
- Si el cambio de contraseña falla:
  - Se muestra un mensaje controlado.
  - El formulario permanece visible.

## Validaciones

### Nombre

- Obligatorio.
- No debe enviarse vacío después de aplicar trim.

### Email

- Obligatorio.
- Debe tener formato de email válido.
- El backend puede rechazarlo si ya está en uso.

### Contraseña

- Opcional.
- Si se deja vacía, no se actualiza.
- Si se ingresa, debe cumplir:
  - Mínimo 8 caracteres.
  - Al menos una mayúscula.
  - Al menos una minúscula.
  - Al menos un número.
  - Al menos un carácter especial.
- Debe coincidir con la confirmación.

### Confirmación De Contraseña

- Obligatoria solo si se ingresó nueva contraseña.
- Debe coincidir con la nueva contraseña.

## Permisos Y Roles

- `admin`:
  - Puede acceder a `/admin/profile`.
  - Puede ver su nombre, email y rol.
  - Puede editar su nombre, email y contraseña.
- `user`:
  - No puede acceder a `/admin/profile`.
  - Debe ser redirigido a `/catalog`.
- No autenticado:
  - No puede acceder.
  - Debe ser redirigido a `/auth/login`.

## Estados

### Carga

- La pantalla muestra un estado de carga mientras obtiene o valida los datos del usuario.

### Vista

- Muestra los datos actuales:
  - Nombre.
  - Email.
  - Rol.

### Edición

- Muestra formulario con:
  - Nombre precargado.
  - Email precargado.
  - Rol visible pero no editable.
  - Nueva contraseña.
  - Confirmación de nueva contraseña.

### Guardando

- El botón de guardar se deshabilita.
- Se muestra estado visual de guardado.

### Éxito

- Se muestra mensaje de actualización exitosa.
- Los datos visibles se refrescan.

### Error

- Se muestra mensaje controlado.
- Si existen errores por campo, se muestran junto al campo correspondiente.

## Criterios De Aceptación

- Dado un administrador autenticado, cuando ingresa a `/admin/profile`, entonces puede ver su nombre, email y rol.
- Dado un administrador autenticado, cuando actualiza nombre y email con datos válidos, entonces el sistema guarda los cambios y actualiza la vista.
- Dado un administrador autenticado, cuando ingresa nueva contraseña y confirmación coincidente válidas, entonces el sistema permite guardar el cambio.
- Dado un administrador autenticado, cuando la contraseña y confirmación no coinciden, entonces se muestra error y no se envía la actualización.
- Dado un administrador autenticado, cuando deja los campos de contraseña vacíos, entonces el sistema actualiza solo nombre/email si cambiaron.
- Dado un usuario no autenticado, cuando intenta entrar a `/admin/profile`, entonces se redirige a `/auth/login`.
- Dado un usuario autenticado con rol `user`, cuando intenta entrar a `/admin/profile`, entonces se redirige a `/catalog`.
- Dado que el backend responde `422`, cuando el administrador intenta guardar, entonces los errores se muestran junto a los campos correspondientes.
- Dado que el backend responde `401`, cuando se intenta cargar o guardar el perfil, entonces se limpia la sesión local y se redirige a login.
- Dado que el backend responde `403`, cuando se intenta acceder o guardar, entonces se redirige a una ruta permitida.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `403 Forbidden`:
  - Redirigir a `/catalog`.
- `422 Validation Error`:
  - Mostrar errores por campo:
    - `name`.
    - `email`.
    - `password`.
    - `password_confirmation`.
- Error inesperado:
  - Mostrar mensaje genérico controlado.
  - No mostrar detalles internos del backend.

## Contrato De Datos Esperado

### Datos visibles del perfil

```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

### Payload de actualización sin contraseña

```json
{
  "name": "Admin Updated",
  "email": "admin.updated@example.com"
}
```

### Payload de actualización con contraseña

```json
{
  "name": "Admin Updated",
  "email": "admin.updated@example.com",
  "password": "NewPassword*123",
  "password_confirmation": "NewPassword*123"
}
```

## Dependencias

- Servicio de autenticación actual para obtener el usuario autenticado.
- Backend como fuente real de autorización y validación.
- Endpoint backend disponible para consultar y/o actualizar el perfil del usuario autenticado.
- Guards existentes de autenticación y rol para proteger rutas admin.
- Interceptor global con `withCredentials: true`.
