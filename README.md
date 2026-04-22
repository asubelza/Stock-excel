# Stock Excel - Gestión de Stock Web

Sistema de gestión de stock con interfaz web, APIs REST y soporte multiusuario con control FIFO (First In First Out) por lotes.

## Características

- **Gestión de productos**: Crear, editar, eliminar productos con SKU único
- **Sistema FIFO por lotes**: Control de stock por fecha de vencimiento (lotes)
- **Movimientos de stock**: Entradas y salidas con trazabilidad completa
- **Proveedores y Clientes**: Gestión completa de contactos con CUIT
- **Importación/Exportación**: Compatible con Excel
- **APIs REST**: Endpoints JSON para integración
- **Autenticación**: Sistema de login con roles (admin, datainput, deposito)
- **Histórico de movimientos**: Registro completo con filtros
- **Validación de stock**: Previene stock negativo
- **Colores diferenciados**: Verde para entradas, rojo para salidas
- **Auto-refresh**: Actualización automática cada 30 segundos

## Rutas Web

| Ruta | Descripción |
|------|-------------|
| `/stock/` | Histórico de movimientos |
| `/stock/stockdb` | Lista de productos (stock actual) |
| `/stock/entrada` | Lista de entradas de stock |
| `/stock/salida` | Lista de salidas de stock |
| `/stock/proveedores` | Gestión de proveedores |
| `/stock/clientes` | Gestión de clientes |
| `/stock/nueva_entrada` | Registrar nueva entrada |
| `/stock/nueva_salida` | Registrar nueva salida |
| `/stock/nuevo_producto` | Crear nuevo producto |
| `/stock/importar_excel` | Importar datos desde Excel |
| `/stock/usuarios` | Gestión de usuarios (admin) |
| `/stock/login` | Login |
| `/stock/logout` | Logout |

## Permisos por Rol

| Ruta | admin | datainput | deposito |
|------|-------|-----------|----------|
| Stock | ✓ | ✓ | ✓ |
| Entrada | ✓ | ✓ | ✗ |
| Salida | ✓ | ✓ | ✓ |
| Historico | ✓ | ✓ | ✓ |
| Proveedores | ✓ | ✓ | ✗ |
| Clientes | ✓ | ✓ | ✗ |
| Productos | ✓ | ✓ | ✗ |
| Usuarios | ✓ | ✗ | ✗ |
| Importar/Exportar | ✓ | ✓ | ✗ |
| Editar Movimiento | ✓ | ✓ | ✗ |
| Eliminar Movimiento | ✓ | ✗ | ✗ |
| Limpiar Historial | ✓ | ✗ | ✗ |

## APIs REST

### Autenticación
Todas las APIs requieren login excepto `/stock/login`.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/stock/api/entrada` | Registrar entrada de stock |
| POST | `/stock/api/salida` | Registrar salida de stock |
| GET | `/stock/api/productos` | Listar productos |
| POST | `/stock/api/producto` | Crear producto |
| GET | `/stock/api/clientes` | Listar clientes |
| POST | `/stock/api/cliente` | Crear cliente |
| GET | `/stock/api/proveedores` | Listar proveedores |
| POST | `/stock/api/proveedor` | Crear proveedor |
| PUT | `/stock/api/movimiento/<id>` | Editar movimiento |
| DELETE | `/stock/api/movimiento/<id>` | Eliminar movimiento |

### Documentación API
Swagger disponible en: `/stock/swagger.json`

## Usuarios por defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | admin |
| deposito | depo123 | deposito |
| datainput | data123 | datainput |

## Desarrollo Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python web_app.py

# O con gunicorn
gunicorn -b 0.0.0.0:5000 wsgi:application
```

## Docker

```bash
docker-compose up -d
```

## Producción (GCP VM)

- Backend: gunicorn con wsgi.py
- Frontend: nginx como reverse proxy
- URL base: `https://estudiocontablejy.com.ar/stock/`

## Arquitectura

```
nginx (reverse proxy)
    └── stock:5000 (gunicorn + Flask)
            └── PostgreSQL
```

## Modelos de Datos

### Producto
- id, sku, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, proveedor_id, eliminado

### Lote
- id, producto_id, cantidad, fecha_vencimiento, fecha_entrada, eliminado

### Movimiento
- id, tipo (ENTRADA/SALIDA/CORRECCION/ANULADO), producto_id, cantidad, lote_id, observaciones, usuario_id, fecha, eliminado

## Licencia

Desarrollado por asubelzacg