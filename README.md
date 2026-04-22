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
- **Búsqueda interactiva**: Filtros por producto, tipo y fecha

## Rutas Web

| Ruta | Descripción |
|------|-------------|
| `/stock/` | Página principal (stock actual) |
| `/stock/entrada` | Lista de entradas de stock |
| `/stock/salida` | Lista de salidas de stock |
| `/stock/proveedores` | Gestión de proveedores |
| `/stock/clientes` | Gestión de clientes |
| `/stock/nueva_entrada` | Registrar nueva entrada |
| `/stock/nueva_salida` | Registrar nueva salida |
| `/stock/nuevo_producto` | Crear nuevo producto |
| `/stock/importar_excel` | Importar datos desde Excel |
| `/stock/exportar_excel` | Exportar datos a Excel |
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
| Registrar Entrada | ✓ | ✓ | ✗ |
| Registrar Salida | ✓ | ✓ | ✓ |
| Editar Movimiento | ✓ | ✓ | ✗ |
| Eliminar Entrada | ✓ | ✓ | ✗ |
| Eliminar Salida | ✓ | ✗ | ✓ |
| Limpiar Historial | ✓ | ✗ | ✗ |

## APIs REST

Todas las APIs requieren autenticación. El token de sesión se maneja con cookies.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar productos (con filtro ?q=) |
| POST | `/api/producto` | Crear producto |
| PUT | `/api/producto/<id>` | Editar producto |
| DELETE | `/api/producto/<id>` | Eliminar producto |
| GET | `/api/proveedores` | Listar proveedores (con filtro ?q=) |
| POST | `/api/proveedor` | Crear proveedor |
| PUT | `/api/proveedor/<id>` | Editar proveedor |
| DELETE | `/api/proveedor/<id>` | Eliminar proveedor |
| GET | `/api/clientes` | Listar clientes (con filtro ?q=) |
| POST | `/api/cliente` | Crear cliente |
| PUT | `/api/cliente/<id>` | Editar cliente |
| DELETE | `/api/cliente/<id>` | Eliminar cliente |
| POST | `/api/entrada` | Registrar entrada de stock |
| POST | `/api/salida` | Registrar salida de stock |
| PUT | `/api/movimiento/<id>` | Editar movimiento |
| DELETE | `/api/movimiento/<id>` | Eliminar/anular movimiento |
| POST | `/api/importar_productos` | Importar productos desde Excel |
| POST | `/api/importar_proveedores` | Importar proveedores desde Excel |
| POST | `/api/importar_clientes` | Importar clientes desde Excel |

### Documentación API
Swagger disponible en: `/stock/swagger.json`

## Modelo de Datos

### Producto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| sku | String(50) | Código SKU único |
| nombre | String(200) | Nombre del producto |
| tipo | String(20) | Tipo (P=Producto, S=Servicio) |
| estado | String(10) | Estado (A=Activo, I=Inactivo) |
| rubro | String(100) | Rubro |
| subrubro | String(100) | Subrubro |
| descripcion | String(500) | Descripción |
| cod_proveedor | String(50) | Código del proveedor |
| observaciones | String(500) | Observaciones |
| precio | Float | Precio de venta |
| tasa_iva | Float | Tasa de IVA (default 21) |
| costo | Float | Costo |
| cod_barra | String(50) | Código de barras |
| stock_min | Integer | Stock mínimo |
| stock | Integer | Stock actual |
| deposito | String(50) | Depósito (default Principal) |

### Movimiento
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| fecha | DateTime | Fecha del movimiento |
| usuario | String(50) | Usuario que registró |
| sku | String(50) | SKU del producto |
| producto | String(200) | Nombre del producto |
| tipo | String(20) | ENTRADA, SALIDA, CORRECCION, ANULADO |
| cantidad | Integer | Cantidad |
| lote | String(50) | Número de lote |
| fecha_vencimiento | Date | Fecha de vencimiento |
| precio_unitario | Float | Precio unitario |
| observaciones | String(500) | Observaciones |
| eliminado | Boolean | Si está anulado |

### Lote
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| sku | String(50) | SKU del producto |
| numero_lote | String(50) | Número de lote |
| cantidad | Integer | Cantidad ingresada |
| cantidad_disponible | Integer | Cantidad disponible |
| fecha_vencimiento | Date | Fecha de vencimiento |
| fecha_ingreso | DateTime | Fecha de ingreso |
| deposito | String(50) | Depósito |

### Proveedor
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| nombre | String(200) | Nombre |
| cuit | String(20) | CUIT |
| telefono | String(50) | Teléfono |
| email | String(100) | Email |
| direccion | String(300) | Dirección |
| observaciones | String(500) | Observaciones |

### Cliente
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| nombre | String(200) | Nombre/Razón social |
| tipo_iva | String(20) | Tipo de IVA |
| cuil | String(20) | CUIL/CUIT |
| telefono | String(50) | Teléfono |
| email | String(100) | Email |
| direccion | String(300) | Dirección |
| observaciones | String(500) | Observaciones |

### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| username | String(50) | Nombre de usuario único |
| password | String(100) | Contraseña |
| nombre | String(100) | Nombre |
| apellido | String(100) | Apellido |
| rol | String(20) | admin, datainput, deposito |
| estado | String(10) | A=Activo, I=Inactivo |

## Usuarios del Sistema

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | admin |
| deposito | depo123 | deposito |
| datainput | data123 | datainput |

## Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/asubelza/Stock-excel.git
cd Stock-excel

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
cp .env.example .env
# Editar .env con la URL de la base de datos

# Ejecutar
python web_app.py
```

## Docker

```bash
# Desarrollo
docker-compose up -d

# Producción (GCP VM)
docker-compose -f docker-compose.stock.yml up -d --build
```

## Producción (GCP VM)

- **Backend**: gunicorn con wsgi.py
- **Frontend**: nginx como reverse proxy
- **URL base**: `https://estudiocontablejy.com.ar/stock/`
- **Servidor**: GCP VM (ecjy-vm-01)

### Comandos de Deploy

```bash
# En la VM
cd ~/Web_ECJY/Stock-excel
git pull origin main
docker-compose -f docker-compose.stock.yml up -d --build

# Ver logs
docker logs -f stock-excel_stock_1

# Reiniciar
docker-compose -f docker-compose.stock.yml restart
```

## Arquitectura

```
┌─────────────────┐
│     Cliente      │
│   (Navegador)  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│     nginx      │
│ (reverse proxy)│
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   gunicorn     │
│   (Flask)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL    │
│   (Docker)    │
└───────────────┘
```

## Licencia

Desarrollado por asubelzacg