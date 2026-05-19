# Spec: Product Management Administrativo

## Historia De Usuario

Como administrador autenticado, quiero poder gestionar el módulo de Product Management para listar productos, crear, editar, eliminar y ver detalle.

## Objetivo

Permitir que un usuario con rol `admin` administre productos del sistema desde una pantalla privada, usando el backend como fuente de datos, validaciones y restricciones de negocio.

## Alcance

- Mostrar listado paginado de productos.
- Aplicar filtros de búsqueda, categoría y estado de stock.
- Crear productos.
- Editar productos.
- Eliminar productos.
- Ver detalle de producto.
- Precargar datos actuales en formularios de edición.
- Mostrar estados de carga, vacío y error.
- Mostrar errores de validación del backend junto al campo correspondiente.
- Restringir acceso a usuarios autenticados con rol `admin`.
- Mantener la vista dentro de rutas admin con lazy loading.

## Fuera De Alcance

- Gestión de usuarios.
- Catálogo público o de usuario regular.
- Carrito o compras.
- Reportes avanzados.
- Eliminación masiva de productos.
- Importación/exportación de productos.
- Manejo de imágenes de producto.
- Nuevos atributos de producto fuera del contrato actual.

## Reglas De Negocio

- Solo usuarios autenticados con rol `admin` pueden acceder al módulo.
- Usuarios con rol `user` no pueden acceder al módulo.
- El backend es la fuente real de permisos, stock y validaciones.
- El listado debe obtenerse desde `GET /api/products`.
- El detalle debe obtenerse desde `GET /api/products/{product}`.
- La creación debe usar `POST /api/products`.
- La edición debe usar `PUT` o `PATCH /api/products/{product}`.
- La eliminación debe usar `DELETE /api/products/{product}`.
- El formulario de edición debe precargar los datos actuales del producto seleccionado.
- Después de crear, editar o eliminar, el listado debe refrescarse automáticamente.
- Si el backend impide eliminar productos con historial de compra, la UI debe mostrar un mensaje controlado.
- Los guards frontend solo mejoran UX; el backend conserva la autorización real.

## Flujo Principal

### Listado

1. El administrador ingresa a `/admin/products`.
2. La vista carga mediante lazy loading dentro de las rutas admin.
3. El sistema solicita productos al backend mediante `GET /api/products`.
4. Mientras carga, se muestra estado de carga.
5. Cuando el backend responde, se muestra el listado de productos.
6. El listado muestra:
   - Nombre.
   - Categoría.
   - Precio.
   - Stock.
   - Fecha de creación.
   - Acciones.

### Filtros

1. El administrador escribe en el campo de búsqueda o selecciona filtros.
2. El sistema solicita nuevamente el listado con query params.
3. El backend devuelve productos filtrados.
4. La vista se actualiza con los resultados.
5. Si no hay resultados, se muestra estado vacío.

### Crear Producto

1. El administrador hace clic en “Crear producto”.
2. El sistema muestra un formulario.
3. El administrador completa:
   - Nombre.
   - Descripción.
   - Categoría.
   - Precio.
   - Stock.
4. El administrador guarda.
5. El sistema envía `POST /api/products`.
6. Si la respuesta es exitosa, se cierra el formulario y se refresca el listado.
7. Si hay errores de validación, se muestran junto a los campos correspondientes.

### Editar Producto

1. El administrador selecciona editar en un producto.
2. El sistema precarga en el formulario los datos actuales del producto seleccionado:
   - Nombre.
   - Descripción.
   - Categoría.
   - Precio.
   - Stock.
3. El administrador modifica los campos necesarios.
4. El administrador guarda.
5. El sistema envía `PUT` o `PATCH /api/products/{product}`.
6. Si la respuesta es exitosa, se cierra el formulario y se refresca el listado.
7. Si hay errores de validación, se muestran junto a los campos correspondientes.

### Ver Detalle

1. El administrador selecciona ver detalle en un producto.
2. El sistema solicita `GET /api/products/{product}`.
3. Mientras carga, muestra estado de carga del detalle.
4. Cuando el backend responde, muestra la información completa del producto.
5. El detalle se presenta sin salir del módulo, por ejemplo en modal o panel lateral.

### Eliminar Producto

1. El administrador hace clic en eliminar.
2. El sistema muestra una confirmación.
3. El administrador confirma.
4. El sistema envía `DELETE /api/products/{product}`.
5. Si la respuesta es exitosa, se refresca el listado.

## Flujos Alternativos

- Si el listado falla, se muestra estado de error.
- Si no hay productos para los filtros aplicados, se muestra estado vacío.
- Si el administrador cancela creación o edición, no se envía ninguna petición.
- Si el administrador cancela eliminación, no se elimina el producto.
- Si el administrador cierra el detalle, no se altera el listado.
- Si una operación falla, el formulario o detalle permanece visible con un mensaje controlado.
- Si la sesión expira, se limpia sesión local y se redirige a login.
- Si el backend responde acceso denegado, se muestra acceso denegado o se redirige a una ruta permitida.
- Si el backend bloquea la eliminación por historial de compra, la UI muestra un mensaje claro y no elimina el producto.

## Validaciones

### Listado

- El listado debe soportar paginación.
- El listado debe soportar búsqueda por texto.
- El listado debe soportar filtro por categoría.
- El listado debe soportar filtro por stock.
- El filtro de stock debe permitir al menos productos con stock y sin stock.

### Crear Producto

- `name` es obligatorio.
- `description` es obligatoria.
- `category` es obligatoria.
- `price` es obligatorio.
- `stock` es obligatorio.
- `price` debe ser numérico y mayor o igual a 0.
- `stock` debe ser entero y mayor o igual a 0.

### Editar Producto

- `name` es obligatorio.
- `description` es obligatoria.
- `category` es obligatoria.
- `price` es obligatorio.
- `stock` es obligatorio.
- `price` debe ser numérico y mayor o igual a 0.
- `stock` debe ser entero y mayor o igual a 0.
- El formulario debe precargar los valores actuales antes de editar.

### Detalle

- El detalle debe mostrar los datos actuales del backend.
- El detalle no debe asumir datos incompletos del listado si el endpoint de detalle devuelve más campos.

### Eliminar Producto

- Debe existir confirmación antes de eliminar.
- Si el backend devuelve conflicto o restricción de negocio, debe mostrarse un error controlado.

## Permisos Y Roles

- `admin`:
  - Puede listar productos.
  - Puede filtrar productos.
  - Puede crear productos.
  - Puede editar productos.
  - Puede eliminar productos.
  - Puede ver detalle de productos.
- `user`:
  - No puede acceder al módulo.
- No autenticado:
  - No puede acceder al módulo.

## Estados

### Listado

- `loading`:
  - Muestra indicador de carga.
- `loaded`:
  - Muestra productos.
- `empty`:
  - Muestra mensaje de que no hay resultados.
- `error`:
  - Muestra mensaje de error controlado.

### Formulario

- `create`:
  - Formulario vacío.
- `edit`:
  - Formulario precargado con datos actuales.
- `submitting`:
  - Botón guardar deshabilitado.
- `validation-error`:
  - Errores mostrados junto a campos.
- `success`:
  - Cierra formulario y refresca listado.

### Detalle

- `loading`:
  - Muestra indicador de carga del detalle.
- `loaded`:
  - Muestra información completa del producto.
- `error`:
  - Muestra mensaje controlado.

### Eliminación

- `confirming`:
  - Muestra confirmación.
- `deleting`:
  - Deshabilita acciones del producto afectado.
- `deleted`:
  - Refresca listado.
- `delete-error`:
  - Muestra error controlado.

## Criterios De Aceptación

- Dado un administrador autenticado, cuando entra a `/admin/products`, entonces ve el módulo Product Management.
- Dado un administrador autenticado, cuando carga la vista, entonces se solicita `GET /api/products`.
- Dado que el backend responde productos, cuando el listado renderiza, entonces muestra nombre, categoría, precio, stock, fecha de creación y acciones.
- Dado que el backend responde paginación, cuando la vista renderiza, entonces muestra controles de paginación.
- Dado que el administrador aplica búsqueda, cuando el backend responde, entonces el listado muestra resultados filtrados.
- Dado que el administrador filtra por categoría o stock, cuando el backend responde, entonces el listado muestra solo productos que cumplen los filtros.
- Dado que no hay resultados, cuando la vista renderiza, entonces muestra estado vacío.
- Dado que el administrador crea un producto válido, cuando guarda, entonces se envía `POST /api/products`.
- Dado que la creación es exitosa, cuando el backend responde, entonces el formulario se cierra y el listado se refresca.
- Dado que el backend devuelve `422`, cuando el formulario renderiza, entonces muestra errores junto a los campos correspondientes.
- Dado que el administrador edita un producto, cuando abre el formulario, entonces los datos actuales están precargados.
- Dado que el administrador guarda cambios válidos, cuando el backend responde, entonces el formulario se cierra y el listado se refresca.
- Dado que el administrador abre detalle de un producto, cuando el backend responde, entonces ve la información completa del producto.
- Dado que el administrador elimina un producto permitido, cuando confirma, entonces se envía `DELETE /api/products/{product}`.
- Dado que la eliminación es exitosa, cuando el backend responde, entonces el listado se refresca.
- Dado que el backend bloquea la eliminación de un producto con historial, cuando el administrador confirma, entonces la UI muestra un mensaje controlado y mantiene el producto en el listado.
- Dado un usuario con rol `user`, cuando intenta entrar a `/admin/products`, entonces no puede ver el módulo.
- Dado un usuario no autenticado, cuando intenta entrar a `/admin/products`, entonces es redirigido a login.
- Dado que la ruta pertenece a admin, cuando se carga, entonces se mantiene dentro del lazy loading existente.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `403 Forbidden`:
  - Mostrar acceso denegado o redirigir a una ruta permitida.
- `404 Not Found`:
  - Mostrar mensaje de producto no encontrado en detalle o edición.
- `409 Conflict`:
  - Mostrar mensaje cuando no se puede eliminar por restricción de negocio.
- `422 Validation Error`:
  - Mostrar errores junto a campos.
- Error al listar:
  - Mostrar “No pudimos cargar los productos.”
- Error al crear:
  - Mostrar “No pudimos crear el producto.”
- Error al editar:
  - Mostrar “No pudimos actualizar el producto.”
- Error al cargar detalle:
  - Mostrar “No pudimos cargar el detalle del producto.”
- Error al eliminar:
  - Mostrar “No pudimos eliminar el producto.”
- Respuesta inesperada:
  - Mostrar mensaje genérico sin detalles internos.

## Contrato De Datos Esperado

### Listar productos

```http
GET /api/products
```

Query params esperados:

```text
page?: number
per_page?: number
search?: string
category?: string
in_stock?: true | false
```

Respuesta esperada:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "description": "Laptop de alto rendimiento",
      "category": "Tecnología",
      "price": "4500.00",
      "stock": 10,
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

### Ver detalle

```http
GET /api/products/{product}
```

Respuesta esperada:

```json
{
  "data": {
    "id": 1,
    "name": "Laptop Pro",
    "description": "Laptop de alto rendimiento",
    "category": "Tecnología",
    "price": "4500.00",
    "stock": 10,
    "created_at": "2026-05-18T12:21:07.000000Z",
    "updated_at": "2026-05-18T12:21:07.000000Z"
  },
  "message": "Operation completed successfully"
}
```

### Crear producto

```http
POST /api/products
```

Payload:

```json
{
  "name": "Laptop Pro",
  "description": "Laptop de alto rendimiento",
  "category": "Tecnología",
  "price": 4500,
  "stock": 10
}
```

### Editar producto

```http
PATCH /api/products/{product}
```

Payload:

```json
{
  "name": "Laptop Pro 16",
  "description": "Laptop de alto rendimiento actualizada",
  "category": "Tecnología",
  "price": 4800,
  "stock": 8
}
```

### Eliminar producto

```http
DELETE /api/products/{product}
```

Respuesta esperada:

```http
204 No Content
```

## Dependencias

- Backend Laravel existente.
- Endpoints:
  - `GET /api/products`
  - `GET /api/products/{product}`
  - `POST /api/products`
  - `PATCH /api/products/{product}`
  - `DELETE /api/products/{product}`
- Estado de autenticación existente en `AuthService`.
- Guards existentes:
  - `AuthGuard`
  - `RoleGuard`
- Modelo frontend `Product`.
- Respuesta paginada frontend `PaginatedApiResponse<T>`.
- Rutas admin lazy-loaded existentes.

## Notas De Implementación

- Mantener la vista en `src/app/features/admin/products`.
- Mantener la ruta bajo `/admin/products`.
- Usar formularios reactivos.
- Reutilizar `ProductsService` existente o extenderlo si ya fue creado para dashboard.
- No usar `any`.
- Mapear errores `422` hacia los controles del formulario.
- Usar la respuesta de detalle para mostrar información completa y actualizada.
- Agregar tests de:
  - carga/listado.
  - filtros.
  - creación.
  - edición con precarga.
  - detalle.
  - eliminación con confirmación.
  - manejo de `409` al eliminar.
  - estados de error.
