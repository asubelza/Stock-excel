# Stock-excel - Proyecto de Gestión de Stock

## 📋 Resumen
Sistema de gestión de stock con Flask, PostgreSQL, Docker. Deploy en VM con nginx reverso.

## 🌿 Ramas
- **main**: Rama estable
- **rediseño**: Rama de desarrollo activa (donde está la VM)
- **implementacion_de_hash**: Funcionalidad de password hashing

## 👥 Roles de Usuario
| Rol | Permisos |
|-----|----------|
| admin | Todo (stock, entradas, salidas, productos, usuarios) |
| datainput | Stock, entradas, nuevo producto, importar/exportar excel |
| deposito | Stock, entradas, salidas, nuevo producto |
| consulta | Solo stock e histórico (solo lectura) |

## 🔧 Endpoints Importantes

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/producto` - Crear producto
- `DELETE /api/producto/<sku>` - Eliminar producto (admin, deposito)

### Movimientos
- `POST /api/entrada` - Registrar entrada
- `POST /api/salida` - Registrar salida
- `DELETE /api/movimiento/<id>` - Eliminar/anular movimiento
  - admin: cualquier tipo
  - datainput: solo ENTRADA
  - deposito: ENTRADA y SALIDA

### Usuarios
- `POST /api/usuario` - Crear usuario
- `PUT /api/usuario/<id>` - Editar usuario (incluye blanquear password con hash)
- `DELETE /api/usuario/<id>` - Eliminar usuario

## 📁 Archivos Clave

### web_app.py
- DB: PostgreSQL stock_db (stockuser/stockpass123)
- Modelos: Usuario, Producto, Movimiento, Lote, Cliente, Proveedor
- Login: usa werkzeug.security para hashes de password
- Rutas con prefijo `/stock/` para DispatcherMiddleware

### Templates
- `base.html` - Menú según rol del usuario
- `stock.html` - Lista productos con botón eliminar (admin, deposito)
- `usuarios.html` - Gestión usuarios con modal blanquear password
- `historico.html` - Sin botón "Limpiar Historial" (solo por BD)

## 🐳 Docker Compose
- Puerto: 8001 (externo) -> 5000 (interno)
- Red: web_ecjy_app-network (externa)
- DB: stock-excel_db_1 (PostgreSQL 15)
- App: stock-excel_stock_1 (Gunicorn)

## 🚀 Comandos Deploy VM

```bash
# Pull y rebuild
git pull origin rediseño
docker-compose -f docker-compose.stock.yml build --no-cache
docker-compose -f docker-compose.stock.yml up -d

# Ver logs
docker-compose -f docker-compose.stock.yml logs --tail=30 stock
```

## 🗄️ Comandos BD

```bash
# Borrar productos
docker exec -i stock-excel_db_1 psql -U stockuser -d stockdb -c "DELETE FROM producto;"

# Borrar movimientos (historial)
docker exec -i stock-excel_db_1 psql -U stockuser -d stockdb -c "DELETE FROM movimiento;"

# Ver productos
docker exec -i stock-excel_db_1 psql -U stockuser -d stockdb -c "SELECT sku, nombre, stock FROM producto LIMIT 5;"

# Ver usuarios
docker exec -i stock-excel_db_1 psql -U stockuser -d stockdb -c "SELECT username, rol, estado FROM usuario;"
```

## ⚠️ Errores Comunes & Soluciones

### SyntaxError en web_app.py
- usualmente por indentation incorrecta después de try/except
- verificar siempre con `python -m py_compile web_app.py`

### 404 en API endpoints
- verificar que la ruta no tenga `/stock/` duplicado
- las rutas API son `/api/...` no `/stock/api/...`

### Error "No autenticado" en fetch
- agregar `credentials: 'same-origin'` al fetch

### Git conflictos en VM
- usar `git reset --hard origin/rama` para forzar sync

## 📝 Notas Importantes

1. **Password hashing**: Las passwords se guardan con `generate_password_hash` de werkzeug
2. **Usuario admin**: Creado en BD con password "robusta" hasheada
3. **Limpiar historial**: Solo por BD, botón eliminado de la UI
4. **URLs API**: No usan prefijo `/stock/` (el DispatcherMiddleware ya lo maneja)
5. **Permisos**: Se validan tanto en frontend (botones) como backend (endpoints)

## ✅ Checklist Funcionalidades
- [x] Login con roles
- [x] CRUD productos (admin, deposito pueden eliminar)
- [x] Entradas y salidas de stock
- [x] Historial de movimientos
- [x] Gestión de usuarios
- [x] Blanquear password con modal
- [x] Importar/exportar Excel
- [x] Limpiar historial (solo BD)