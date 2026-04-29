@app.route('/api/historico/limpiar', methods=['POST'])
@login_required
def api_limpiar_historico():
    if session.get('rol') != 'admin':
        return jsonify({'ok': False, 'msg': 'Solo admins'}), 403
    try:
        eliminados = db.session.query(Movimiento).delete()
        db.session.commit()
        return jsonify({'ok': True, 'msg': f'{eliminados} movimientos eliminados'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'ok': False, 'msg': str(e)}), 500

@app.route('/api/producto/<sku>', methods=['DELETE'])
@login_required
def api_producto_delete(sku):
    """
    Eliminar producto
    ---
    tags:
      - Productos
    parameters:
      - name: sku
        in: path
        type: string
        required: true
    responses:
      200:
        description: Producto eliminado
      404:
        description: Producto no encontrado
    """
    if session.get('rol') != 'admin':
        return jsonify({'ok': False, 'msg': 'Solo el admin puede eliminar productos'}), 403
    
    producto = Producto.query.filter_by(sku=sku).first()
    if not producto:
        return jsonify({'ok': False, 'msg': 'Producto no encontrado'}), 404
    
    db.session.delete(producto)
    db.session.commit()
    return jsonify({'ok': True, 'msg': 'Producto eliminado'})

@app.route('/api/entrada', methods=['POST'])