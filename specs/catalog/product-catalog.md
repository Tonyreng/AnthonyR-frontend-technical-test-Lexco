# Spec: Catálogo De Productos

## Historia De Usuario

Como usuario autenticado, quiero poder ver el catálogo de productos con disponibilidad y botón para agregar al carrito.

## Objetivo

Permitir que un usuario autenticado consulte productos disponibles para compra, conozca su disponibilidad y pueda agregarlos al carrito desde una pantalla privada.

## Alcance

- Acceso al catálogo desde `/catalog`.
- Listado de productos disponibles para compra.
- Visualización de disponibilidad por producto.
- Botón para agregar productos al carrito.
- Agregar producto al carrito con cantidad inicial `1`.
- Incrementar cantidad si el producto ya existe en el carrito.
- Validar stock conocido antes de agregar o incrementar.
- Búsqueda por texto.
- Filtro por categoría.
- Estados de carga, vacío y error.
- Manejo de sesión expirada.
- UI responsive consistente con el resto del frontend.

## Fuera De Alcance

- Checkout o finalización de compra.
- Persistencia del carrito en backend.
- Historial de compras.
- Gestión administrativa de productos.
- Imágenes de productos.
- Filtro por disponibilidad.
- Ordenamiento avanzado.
- Comparación de productos.
- Favoritos o wishlist.

## Reglas De Negocio

- Solo usuarios autenticados pueden acceder al catálogo.
- El backend es la fuente real de productos, stock, precio y disponibilidad.
- El catálogo consume `GET /api/catalog/products`.
- Cada producto debe mostrar:
  - Nombre.
  - Descripción.
  - Categoría.
  - Precio.
  - Stock disponible.
  - Estado de disponibilidad.
- El botón “Agregar al carrito” solo está habilitado si el producto tiene stock mayor a `0`.
- Si el producto no tiene stock, el botón debe mostrarse deshabilitado.
- Al agregar un producto nuevo al carrito, se registra con cantidad `1`.
- Si el producto ya existe en el carrito, se incrementa su cantidad en `1`.
- El frontend no debe permitir que la cantidad local del carrito supere el stock conocido.
- El precio mostrado y el stock local son solo referencia UX; el backend debe validar precio y stock nuevamente al comprar.
- El catálogo debe permitir búsqueda por texto.
- El catálogo debe permitir filtro por categoría.
- Los filtros se envían al backend como query params cuando aplique.
- Si se limpian los filtros, el catálogo vuelve a mostrar resultados sin filtros.

## Flujo Principal

1. El usuario autenticado ingresa a `/catalog`.
2. El sistema solicita productos mediante `GET /api/catalog/products`.
3. Mientras carga, se muestra estado de carga.
4. Cuando el backend responde, se muestran los productos en formato de cards o listado responsive.
5. Cada producto muestra:
   - Nombre.
   - Descripción.
   - Categoría.
   - Precio.
   - Stock.
   - Disponibilidad.
   - Botón “Agregar al carrito”.
6. El usuario puede buscar por texto o filtrar por categoría.
7. El sistema consulta nuevamente el catálogo con los filtros aplicados.
8. El usuario hace clic en “Agregar al carrito”.
9. El sistema valida que exista stock disponible según el dato conocido.
10. Si es válido:
    - Si el producto no existe en carrito, se agrega con cantidad `1`.
    - Si ya existe, se incrementa la cantidad en `1`.
11. La UI muestra feedback inmediato de agregado.
12. El contador o estado del carrito se actualiza sin recargar la página.

## Flujos Alternativos

- Si no hay productos disponibles:
  - Se muestra estado vacío.
- Si los filtros no devuelven resultados:
  - Se muestra estado vacío indicando que no hay productos para los criterios aplicados.
- Si el backend falla:
  - Se muestra estado de error con opción de reintentar.
- Si el usuario intenta agregar un producto sin stock:
  - El botón está deshabilitado y no se realiza ninguna acción.
- Si el usuario intenta agregar más unidades que el stock conocido:
  - No se incrementa la cantidad.
  - Se muestra mensaje controlado indicando stock máximo alcanzado.
- Si la sesión expira:
  - Se limpia sesión local.
  - Se redirige a `/auth/login`.
- Si el backend responde acceso denegado:
  - Se muestra mensaje controlado o se redirige a una ruta permitida.

## Validaciones

### Acceso

- Requiere sesión autenticada.
- Si no hay sesión válida, redirigir a login.

### Listado

- La respuesta debe contener productos válidos.
- Si `data` está vacío, mostrar estado vacío.
- Si existe paginación en backend, la UI debe respetar `meta`.

### Búsqueda

- El texto de búsqueda puede enviarse como query param `search`.
- Si el campo queda vacío, no debe enviarse `search`.

### Categoría

- La categoría puede enviarse como query param `category`.
- Si el campo queda vacío, no debe enviarse `category`.

### Agregar Al Carrito

- Producto con `stock > 0`: botón habilitado.
- Producto con `stock <= 0`: botón deshabilitado.
- Si el producto no existe en carrito, agregar cantidad `1`.
- Si el producto ya existe, incrementar cantidad solo si no supera stock.
- No permitir cantidades negativas, cero o superiores al stock.

## Permisos Y Roles

- `user`:
  - Puede acceder al catálogo.
  - Puede buscar y filtrar productos.
  - Puede agregar productos al carrito.
- `admin`:
  - Puede acceder si navega manualmente a `/catalog`, salvo que se decida bloquearlo en navegación.
  - Puede buscar, filtrar y agregar productos al carrito si el backend permite acceso autenticado.
- No autenticado:
  - No puede acceder.
  - Debe ser redirigido a `/auth/login`.

## Estados

### Loading

- Se muestra mientras se cargan productos.

### Loaded

- Se muestra listado de productos.

### Empty

- Se muestra cuando no hay productos o filtros sin resultados.

### Error

- Se muestra cuando falla la carga.
- Debe incluir opción de reintentar.

### Adding

- Estado temporal al agregar un producto al carrito.

### Added

- Feedback temporal indicando que el producto fue agregado.

### Stock Limit

- Estado o mensaje cuando se alcanza el stock máximo permitido en carrito.

## Criterios De Aceptación

- Dado un usuario autenticado, cuando ingresa a `/catalog`, entonces ve el listado de productos disponibles.
- Dado que el catálogo está cargando, cuando la petición está pendiente, entonces se muestra estado de carga.
- Dado que el backend devuelve productos, cuando se renderiza el catálogo, entonces cada producto muestra nombre, descripción, categoría, precio, stock y disponibilidad.
- Dado un producto con stock mayor a `0`, cuando se muestra en catálogo, entonces el botón “Agregar al carrito” está habilitado.
- Dado un producto sin stock, cuando se muestra en catálogo, entonces el botón “Agregar al carrito” está deshabilitado.
- Dado un producto con stock disponible, cuando el usuario hace clic en “Agregar al carrito”, entonces se agrega al carrito con cantidad `1`.
- Dado un producto que ya existe en carrito, cuando el usuario hace clic en “Agregar al carrito”, entonces se incrementa la cantidad en `1`.
- Dado que la cantidad del producto en carrito ya alcanzó el stock conocido, cuando el usuario intenta agregar otra unidad, entonces no se incrementa y se muestra mensaje controlado.
- Dado que el usuario escribe una búsqueda, cuando aplica el filtro, entonces se solicita el catálogo con `search`.
- Dado que el usuario filtra por categoría, cuando aplica el filtro, entonces se solicita el catálogo con `category`.
- Dado que el usuario limpia los filtros, cuando aplica nuevamente, entonces se solicita el catálogo sin `search` ni `category`.
- Dado que el backend responde `401`, cuando se carga el catálogo, entonces se limpia sesión y se redirige a `/auth/login`.
- Dado que el backend falla, cuando se carga el catálogo, entonces se muestra estado de error con opción de reintentar.

## Casos De Error

- `401 Unauthorized`:
  - Limpiar sesión local.
  - Redirigir a `/auth/login`.
- `403 Forbidden`:
  - Mostrar acceso denegado o redirigir a una ruta permitida.
- Error inesperado:
  - Mostrar mensaje controlado.
  - Permitir reintentar.
- Stock máximo alcanzado:
  - No modificar carrito.
  - Mostrar mensaje claro.

## Contrato De Datos Esperado

### Endpoint

```http
GET /api/catalog/products
```

### Query Params

```text
search?: string
category?: string
page?: number
per_page?: number
```

### Producto esperado

```json
{
  "id": 1,
  "name": "Product Name",
  "description": "Product description",
  "category": "Electronics",
  "price": "1000.00",
  "stock": 10,
  "created_at": "2026-01-01T00:00:00.000000Z",
  "updated_at": "2026-01-01T00:00:00.000000Z"
}
```

### Respuesta paginada esperada

```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "category": "Electronics",
      "price": "1000.00",
      "stock": 10,
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 9,
    "total": 1,
    "last_page": 1
  },
  "message": "Available products retrieved successfully"
}
```

## Dependencias

- Endpoint `GET /api/catalog/products`.
- Guard de autenticación para proteger `/catalog`.
- Servicio frontend de catálogo.
- Servicio o estado local de carrito.
- Interceptor global con `withCredentials: true`.
- Backend como fuente real de stock, precio y disponibilidad.
