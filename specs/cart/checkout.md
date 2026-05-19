# Spec: Finalizar Compra Desde El Carrito

## Historia De Usuario

Como usuario autenticado, quiero poder finalizar la compra con los productos que añadí al carrito, para registrar mi compra y recibir confirmación de que fue procesada correctamente.

## Objetivo

Permitir que un usuario autenticado complete una compra desde `/cart`, enviando al backend los productos y cantidades del carrito local para que el backend valide stock, calcule precios/totales reales y registre la compra.

## Alcance

- Agregar acción principal “Finalizar compra” en la pantalla de carrito.
- Enviar la compra al endpoint `POST /api/purchases`.
- Usar el carrito local actual como fuente de productos seleccionados.
- Enviar únicamente `product_id` y `quantity` por cada item.
- Mostrar resumen del carrito con productos, cantidades, subtotales estimados y total estimado.
- Mostrar un modal de éxito con resumen de la compra confirmada.
- Mostrar estados de carga, éxito y error.
- Evitar envíos duplicados mientras la compra está en proceso.
- Vaciar el carrito local cuando la compra sea exitosa.
- Conservar el carrito local si la compra falla.
- Manejar errores `401`, `409`, `422` y errores inesperados.

## Fuera De Alcance

- Historial de compras.
- Pantalla de detalle de compra u orden.
- Pasarela de pago.
- Persistencia del carrito en backend.
- Envío de precios, subtotales o totales desde frontend.
- Gestión de dirección de envío o método de pago.

## Reglas De Negocio

- Solo usuarios autenticados pueden finalizar compras.
- El carrito debe tener al menos un producto para habilitar la acción “Finalizar compra”.
- El frontend debe enviar únicamente productos y cantidades.
- El frontend no debe enviar precios, subtotales ni total.
- El backend es la fuente real de stock, precios, totales y resultado final de compra.
- Si el backend confirma la compra, el carrito local debe vaciarse.
- Si la compra es exitosa, se debe mostrar un modal con el resumen de productos, cantidades y total final.
- Si el backend rechaza la compra, el carrito local debe conservarse sin cambios.
- No se deben permitir envíos duplicados mientras una compra está en proceso.
- El usuario puede modificar cantidades, quitar productos o vaciar el carrito antes de finalizar la compra.

## Flujo Principal

1. El usuario autenticado entra a `/cart`.
2. El sistema muestra los productos añadidos al carrito.
3. El sistema muestra cantidades, subtotales estimados y total estimado.
4. El sistema muestra el botón “Finalizar compra” habilitado si el carrito tiene items.
5. El usuario hace clic en “Finalizar compra”.
6. El sistema deshabilita la acción y muestra estado de carga.
7. El frontend construye el payload con los items actuales del carrito.
8. El frontend envía `POST /api/purchases`.
9. El backend valida sesión, stock, precios y cantidades.
10. Si la compra es exitosa:
    - El sistema muestra un modal con resumen de la compra.
    - El modal muestra productos, cantidades y total final.
    - El carrito local se vacía.
    - El usuario permanece en `/cart` viendo el estado vacío detrás del modal.

## Flujos Alternativos

- Si el carrito está vacío:
  - El botón “Finalizar compra” está deshabilitado o no se muestra como acción disponible.
  - No se envía ninguna petición al backend.
- Si el usuario modifica cantidades antes de comprar:
  - El payload debe reflejar las cantidades actuales del carrito.
- Si el usuario elimina productos antes de comprar:
  - El payload no debe incluir productos eliminados.
- Si el usuario vacía el carrito antes de comprar:
  - La acción “Finalizar compra” queda deshabilitada.
- Si el usuario intenta finalizar dos veces rápidamente:
  - Solo se debe enviar una petición mientras el estado esté en carga.

## Validaciones

### Carrito

- Debe existir al menos un item en el carrito para finalizar la compra.
- Cada item debe tener `product_id` numérico.
- Cada item debe tener `quantity` numérico mayor o igual a `1`.
- El frontend debe evitar cantidades mayores al stock conocido para mejorar UX.
- El backend puede rechazar la compra aunque las validaciones locales pasen.

### Payload

- El request debe incluir un objeto con propiedad `items`.
- `items` debe ser un arreglo no vacío.
- Cada elemento debe incluir únicamente los datos necesarios para la compra:
  - `product_id`.
  - `quantity`.
- No se deben enviar precios, subtotales, total, nombre, categoría ni descripción.

## Permisos Y Roles

- `user` autenticado:
  - Puede finalizar compra con productos del carrito.
- `admin` autenticado:
  - Puede finalizar compra solo si la navegación y el backend permiten acceso a carrito/compra para usuarios autenticados en general.
- No autenticado:
  - No puede finalizar compra.
  - Debe ser redirigido a `/auth/login` si la sesión no es válida.

## Estados

### Empty

- El carrito no tiene productos.
- No se permite finalizar compra.

### Idle

- El carrito tiene productos.
- El usuario puede modificar cantidades, quitar productos, vaciar el carrito o finalizar compra.

### Submitting

- La compra está en proceso.
- El botón “Finalizar compra” está deshabilitado.
- No se permiten envíos duplicados.

### Success

- La compra fue completada correctamente.
- Se muestra un modal de éxito.
- El modal muestra productos comprados, cantidades y total final.
- El carrito queda vacío.

### Error

- La compra falló o fue rechazada.
- Se muestra mensaje controlado.
- El carrito se conserva.

## Criterios De Aceptación

- Dado un usuario autenticado con productos en el carrito, cuando entra a `/cart`, entonces ve la acción “Finalizar compra”.
- Dado un carrito vacío, cuando el usuario entra a `/cart`, entonces no puede enviar una compra.
- Dado un carrito con productos, cuando el usuario finaliza la compra, entonces el frontend envía `POST /api/purchases`.
- Dado el envío de compra, cuando se construye el payload, entonces solo incluye `items`, `product_id` y `quantity`.
- Dado una compra en proceso, cuando el usuario intenta hacer clic nuevamente en “Finalizar compra”, entonces no se genera un segundo request.
- Dado una respuesta exitosa `201`, cuando termina la compra, entonces se muestra un modal con productos, cantidades y total final, y se vacía el carrito.
- Dado una respuesta `409`, cuando hay conflicto de stock, entonces se muestra error y el carrito no se vacía.
- Dado una respuesta `422`, cuando el backend rechaza datos inválidos, entonces se muestra mensaje de validación y el carrito no se vacía.
- Dado una respuesta `401`, cuando la sesión expiró, entonces se limpia sesión local y se redirige a `/auth/login`.
- Dado un error inesperado, cuando falla la compra, entonces se muestra un mensaje genérico y el carrito no se vacía.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `409 Conflict`:
  - Mostrar mensaje de conflicto, por ejemplo stock insuficiente.
  - Mantener carrito intacto.
- `422 Validation failed`:
  - Mostrar mensaje de validación general.
  - Mantener carrito intacto.
- Error inesperado:
  - Mostrar mensaje genérico: “No pudimos finalizar la compra. Inténtalo nuevamente.”
  - Mantener carrito intacto.

## Contrato De Datos Esperado

### Endpoint

```http
POST /api/purchases
```

### Request

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

### Respuesta Exitosa Esperada

Código: `201`

```json
{
  "data": {
    "id": 10,
    "user_id": 5,
    "total": "159.98",
    "items": []
  },
  "message": "Purchase completed successfully"
}
```

> La estructura exacta de `data` debe alinearse con el contrato real del backend. Para esta historia, el frontend debe mostrar el resumen de la compra exitosa en un modal y limpiar el carrito.

## Dependencias

- Carrito local existente mediante `CartService`.
- Endpoint backend `POST /api/purchases`.
- Sesión autenticada vía cookies HTTPOnly.
- Interceptor global con `withCredentials: true`.
- Modelos TypeScript para purchase request/response.

## Notas De Implementación

- Agregar o reutilizar un servicio frontend para enviar compras a `POST /api/purchases`.
- Reutilizar modelos `Purchase`, `PurchaseResponse` o ajustar interfaces tipadas existentes.
- Agregar estado de envío y mensajes en `CartPage`.
- Transformar items del carrito local a `{ product_id, quantity }`.
- Guardar un snapshot del carrito antes del envío para renderizar el resumen del modal exitoso.
- Agregar pruebas para:
  - Payload enviado.
  - Compra exitosa muestra modal y vacía carrito.
  - `409` conserva carrito.
  - `422` conserva carrito y muestra error.
  - `401` limpia sesión y redirige a login.
  - Botón deshabilitado durante envío.
