# Stock Excel - Gestión de Stock Web

Sistema de gestión de stock con interfaz web, APIs REST y soporte multiusuario.

## Características

- **Gestión de productos**: Crear, editar, eliminar productos
- **Movimientos de stock**: Entradas y salidas con trazabilidad completa
- **Proveedores y Clientes**: Gestión completa de contactos
- **Importación/Exportación**: Compatible con Excel
- **APIs REST**: Documentación Swagger integrada
- **Autenticación**: Sistema de login con roles (admin, datainput, deposito)

## Rutas Web

| Ruta | Descripción |
|------|-------------|
| `/stock/` | Histórico de movimientos |
| `/stock/stockdb` | Lista de productos (stock) |
| `/stock/entrada` | Lista de entradas |
| `/stock/salida` | Lista de salidas |
| `/stock/proveedores` | Gestión de proveedores |
| `/stock/clientes` | Gestión de clientes |
| `/stock/nueva_entrada` | Registrar entrada |
| `/stock/nueva_salida` | Registrar salida |
| `/stock/nuevo_producto` | Crear producto |
| `/stock/importar_excel` | Importar desde Excel |
| `/stock/usuarios` | Gestión de usuarios (admin) |
| `/stock/login` | Login |
| `/stock/logout` | Logout |

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
            └── SQLite/PostgreSQL
```

## Licencia

Desarrollado por asubelzacg
