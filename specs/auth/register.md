# Spec: Registro de usuario no autenticado

## Historia De Usuario

Como usuario no autenticado, quiero poder registrarme en la aplicación, para crear una cuenta e iniciar sesión.

## Objetivo

Permitir que un visitante cree una cuenta desde el frontend Angular, usando el endpoint público de registro del backend Laravel, quedando autenticado automáticamente mediante cookie HTTPOnly.

## Alcance

- Pantalla pública de registro en `/auth/register`.
- Formulario reactivo para capturar datos de registro.
- Validaciones frontend para mejorar UX.
- Envío del registro al backend.
- Manejo de respuestas exitosas y errores.
- Actualización del estado de autenticación en frontend.
- Redirección post-registro según rol recibido.

## Fuera De Alcance

- Recuperación de contraseña.
- Verificación de email.
- Registro mediante redes sociales.
- Selección manual de rol desde frontend.
- Cambio de datos de perfil posterior al registro.
- Modificación del contrato backend.

## Actores

- Usuario no autenticado.
- Backend Laravel como autoridad de autenticación y asignación de rol.

## Reglas De Negocio

- El formulario no debe enviar `role`.
- El backend asigna el rol:
  - Primer usuario registrado: `admin`.
  - Usuarios posteriores: `user`.
- El registro exitoso inicia sesión automáticamente mediante cookie HTTPOnly.
- El frontend solo refleja el rol recibido desde backend.
- El frontend no almacena tokens en `localStorage` ni `sessionStorage`.
- Todas las peticiones de registro deben enviarse con `withCredentials: true`.

## Flujo Principal

1. El usuario accede a `/auth/register`.
2. El sistema muestra el formulario de registro.
3. El usuario ingresa nombre, email, contraseña y confirmación de contraseña.
4. El sistema valida los campos en frontend.
5. El usuario envía el formulario.
6. El sistema deshabilita el botón y muestra estado de carga.
7. El frontend envía `POST /api/auth/register`.
8. El backend crea el usuario, asigna rol e inicia sesión.
9. El frontend guarda el usuario autenticado en el estado de sesión.
10. El frontend redirige:
    - `admin` a `/admin`.
    - `user` a `/catalog`.

## Flujos Alternativos

### Usuario Ya Autenticado Accede A Register

- Si un usuario autenticado intenta acceder a `/auth/register`, debe ser redirigido:
  - `admin` a `/admin`.
  - `user` a `/catalog`.

### Registro Con Errores De Validación

- Si backend responde `422`, el formulario debe mostrar errores junto al campo correspondiente cuando sea posible.

### Email Ya Registrado

- Si backend indica que el email ya existe, el error debe mostrarse en el campo `email`.

### Error Inesperado

- Si ocurre un error no controlado, el sistema debe mostrar un mensaje general sin detalles técnicos.

## Validaciones

### Nombre

- Requerido.
- Texto.
- Máximo 255 caracteres.

### Email

- Requerido.
- Formato email válido.
- Máximo 255 caracteres.

### Contraseña

- Requerida.
- Mínimo 8 caracteres.
- Al menos una mayúscula.
- Al menos una minúscula.
- Al menos un número.
- Al menos un carácter especial.

### Confirmación De Contraseña

- Requerida.
- Debe coincidir con `password`.

## Permisos Y Roles

- Ruta `/auth/register` es pública.
- Usuarios autenticados no deben permanecer en `/auth/register`.
- El frontend no puede definir ni modificar el rol durante registro.
- El rol recibido desde backend determina la redirección.

## Estados UI

- Estado inicial: formulario vacío.
- Estado inválido: campos con errores visibles.
- Estado enviando: botón deshabilitado y loading activo.
- Estado exitoso: usuario autenticado y redirección.
- Estado error: mensaje de error visible.

## Contrato De Datos Esperado

### Endpoint

```http
POST /api/auth/register
```

### Request

```json
{
  "name": "Anthony Rengifo",
  "email": "anthony@example.com",
  "password": "Password*123",
  "password_confirmation": "Password*123"
}
```

### Response Exitosa

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Anthony Rengifo",
      "email": "anthony@example.com",
      "role": "admin",
      "created_at": "2026-05-17T00:00:00.000000Z",
      "updated_at": "2026-05-17T00:00:00.000000Z"
    }
  },
  "message": "User registered successfully"
}
```

### Error De Validación

```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

## Criterios De Aceptación

- Dado un usuario no autenticado, cuando entra a `/auth/register`, entonces ve el formulario de registro.
- Dado un formulario vacío, cuando intenta enviarlo, entonces se muestran errores de campos requeridos.
- Dado una contraseña inválida, cuando el usuario la ingresa, entonces se muestran las reglas incumplidas.
- Dado una confirmación distinta, cuando el usuario envía el formulario, entonces se muestra error de coincidencia.
- Dado datos válidos, cuando el usuario envía el formulario, entonces se llama `POST /api/auth/register`.
- Dado una respuesta exitosa, cuando el backend devuelve `data.user`, entonces el usuario queda autenticado en frontend.
- Dado un usuario registrado con rol `admin`, cuando finaliza el registro, entonces es redirigido a `/admin`.
- Dado un usuario registrado con rol `user`, cuando finaliza el registro, entonces es redirigido a `/catalog`.
- Dado un email ya registrado, cuando backend responde `422`, entonces el error se muestra en el campo `email`.
- Dado un usuario autenticado, cuando intenta acceder a `/auth/register`, entonces es redirigido según su rol.
- Dado cualquier registro, cuando se envía el request, entonces no se incluye el campo `role`.

## Dependencias

- Backend Laravel disponible en `http://localhost/api`.
- Endpoint `POST /api/auth/register` implementado.
- CORS configurado para `http://localhost:4200`.
- Cookies HTTPOnly configuradas en backend.
- `AuthService` frontend disponible para registrar y actualizar sesión.
- Interfaces `RegisterPayload`, `AuthUserResponse`, `User` y `Role` disponibles.
