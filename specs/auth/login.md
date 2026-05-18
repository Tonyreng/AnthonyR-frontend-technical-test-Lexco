# Spec: Inicio de sesión de usuario no autenticado

## Historia De Usuario

Como usuario no autenticado, quiero poder iniciar sesión para ser redirigido según mi role.

## Objetivo

Permitir que un usuario no autenticado acceda a la aplicación con sus credenciales, establezca una sesión segura mediante cookie HTTPOnly y sea redirigido a la pantalla correspondiente según el rol recibido desde backend.

## Alcance

- Pantalla pública de login en `/auth/login`.
- Formulario reactivo para capturar credenciales.
- Validaciones frontend básicas.
- Envío de credenciales al backend.
- Manejo de respuestas exitosas y errores.
- Actualización del estado de autenticación en frontend.
- Redirección post-login según rol recibido.
- Botón para mostrar/ocultar contraseña.

## Fuera De Alcance

- Recuperación de contraseña.
- Verificación de email.
- Login con redes sociales.
- Autenticación con Bearer token.
- Persistencia manual de sesión en `localStorage` o `sessionStorage`.
- Modificación del contrato backend.
- Cambio de rol desde frontend.

## Actores

- Usuario no autenticado.
- Backend Laravel como autoridad de autenticación y asignación de sesión.

## Reglas De Negocio

- El usuario debe autenticarse con `email` y `password`.
- El backend valida las credenciales.
- El login exitoso inicia sesión mediante cookie HTTPOnly.
- El frontend no almacena tokens.
- El frontend solo usa el rol recibido desde backend para redirigir.
- Todas las peticiones de login deben enviarse con `withCredentials: true`.
- Si el usuario ya está autenticado e intenta entrar a `/auth/login`, debe ser redirigido según su rol.

## Flujo Principal

1. El usuario accede a `/auth/login`.
2. El sistema muestra el formulario de inicio de sesión.
3. El usuario ingresa email y contraseña.
4. Opcionalmente, el usuario puede mostrar u ocultar la contraseña mediante un botón.
5. El sistema valida que ambos campos estén completos y que el email tenga formato válido.
6. El usuario envía el formulario con el botón o presionando `Enter`.
7. El sistema deshabilita el botón y muestra estado de carga.
8. El frontend envía `POST /api/auth/login`.
9. El backend valida credenciales e inicia sesión.
10. El frontend guarda el usuario autenticado en el estado de sesión.
11. El frontend redirige:
    - `admin` a `/admin`.
    - `user` a `/catalog`.

## Flujos Alternativos

### Usuario Ya Autenticado Accede A Login

- Si un usuario autenticado intenta acceder a `/auth/login`, debe ser redirigido:
  - `admin` a `/admin`.
  - `user` a `/catalog`.

### Credenciales Inválidas

- Si backend responde `401`, el formulario debe mostrar un mensaje general como “Credenciales inválidas”.

### Errores De Validación

- Si backend responde `422`, el formulario debe mostrar errores junto al campo correspondiente cuando sea posible.

### Error Inesperado

- Si ocurre un error no controlado, el sistema debe mostrar un mensaje general sin detalles técnicos.

## Validaciones

### Email

- Requerido.
- Formato email válido.

### Contraseña

- Requerida.
- Campo tipo password por defecto.
- Debe permitir mostrar/ocultar el valor mediante un botón.
- No requiere validación de complejidad en login.

## Permisos Y Roles

- Ruta `/auth/login` es pública.
- Usuarios autenticados no deben permanecer en `/auth/login`.
- El rol recibido desde backend determina la redirección.
- El frontend no debe autorizar funcionalidades por sí solo; los guards son solo UX.

## Estados UI

- Estado inicial: formulario vacío.
- Estado inválido: campos con errores visibles.
- Estado enviando: botón deshabilitado y loading activo.
- Estado exitoso: usuario autenticado y redirección.
- Estado credenciales inválidas: mensaje general visible.
- Estado error inesperado: mensaje general visible.
- Estado password oculto: input tipo `password`.
- Estado password visible: input tipo `text`.

## Contrato De Datos Esperado

### Endpoint

```http
POST /api/auth/login
```

### Request

```json
{
  "email": "anthony@example.com",
  "password": "Password*123"
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
  "message": "User authenticated successfully"
}
```

### Error De Credenciales Inválidas

```json
{
  "message": "Invalid credentials"
}
```

### Error De Validación

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

## Criterios De Aceptación

- Dado un usuario no autenticado, cuando entra a `/auth/login`, entonces ve el formulario de inicio de sesión.
- Dado un formulario vacío, cuando intenta enviarlo, entonces se muestran errores de campos requeridos.
- Dado un email inválido, cuando intenta enviarlo, entonces se muestra error de formato.
- Dado una contraseña ingresada, cuando presiona mostrar contraseña, entonces el campo cambia a texto visible.
- Dado una contraseña visible, cuando presiona ocultar contraseña, entonces el campo vuelve a tipo password.
- Dado credenciales válidas, cuando el usuario envía el formulario, entonces se llama `POST /api/auth/login`.
- Dado una respuesta exitosa, cuando backend devuelve `data.user`, entonces el usuario queda autenticado en frontend.
- Dado un usuario autenticado con rol `admin`, cuando finaliza el login, entonces es redirigido a `/admin`.
- Dado un usuario autenticado con rol `user`, cuando finaliza el login, entonces es redirigido a `/catalog`.
- Dado credenciales inválidas, cuando backend responde `401`, entonces se muestra un mensaje general de credenciales inválidas.
- Dado errores de validación, cuando backend responde `422`, entonces los errores se muestran junto al campo correspondiente.
- Dado un usuario autenticado, cuando intenta acceder a `/auth/login`, entonces es redirigido según su rol.
- Dado el formulario con datos válidos, cuando el usuario presiona `Enter`, entonces se envía el formulario.

## Dependencias

- Backend Laravel disponible en `http://localhost/api`.
- Endpoint `POST /api/auth/login` implementado.
- CORS configurado para `http://localhost:4200`.
- Cookies HTTPOnly configuradas en backend.
- `AuthService` frontend disponible para login y actualización de sesión.
- Interfaces `LoginPayload`, `AuthUserResponse`, `User` y `Role` disponibles.
- `guestGuard` disponible para redirigir usuarios autenticados fuera de rutas públicas.
