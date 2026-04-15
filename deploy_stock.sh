#!/bin/bash
# Script de deploy para Gestion de Stock en VM
# Ejecutar desde ~/Web_ECJY

set -e

echo "=== Deploy Gestion de Stock ==="

cd ~/Web_ECJY

# 1. Detener y eliminar contenedor actual
echo "1. Deteniendo contenedor..."
docker-compose stop stock 2>/dev/null || true
docker-compose rm -f stock 2>/dev/null || true

# 2. Actualizar código de Git
echo "2. Actualizando código..."
cd ~/Web_ECJY/Stock-excel
git pull origin homologacion

# 3. Rebuild del contenedor
echo "3. Construyendo nuevo contenedor..."
cd ~/Web_ECJY
docker-compose up -d --build stock

# 4. Esperar a que esté listo
echo "4. Verificando..."
sleep 5

# 5. Recargar nginx
echo "5. Recargando nginx..."
docker exec estudio_jy_nginx nginx -s reload

# 6. Verificar estado
echo "6. Estado de contenedores:"
docker ps | grep stock

echo "=== Deploy completo ==="
echo "Acceder a: https://estudiocontablejy.com.ar/stock/"
