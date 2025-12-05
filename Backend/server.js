const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE BASE DE DATOS
// Usamos 127.0.0.1 para evitar problemas en Mac con Node v25
const dbConfig = {
    host: '127.0.0.1', 
    user: 'root',
    password: '', // <--- ¡PON TU CONTRASEÑA AQUÍ!
    database: 'farmacia_db'
};

// --- RUTAS ---

app.get('/', (req, res) => {
    res.send('💊 Servidor Farmacia SGF: Activo');
});

// 1. BUSCAR PRODUCTOS
app.get('/api/productos', async (req, res) => {
    const busqueda = req.query.q;
    if (!busqueda) return res.status(400).json({ error: 'Falta término de búsqueda' });

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        let query = '';
        let params = [];
        
        // Si es solo números, buscamos por ID, Código o Troquel
        const esNumero = /^\d+$/.test(busqueda);

        if (esNumero) {
            query = `SELECT * FROM productos WHERE codigo_barras = ? OR id_externo = ? OR troquel = ? LIMIT 1`;
            params = [busqueda, busqueda, busqueda];
        } else {
            // Si tiene letras, buscamos por Nombre, Laboratorio o Rubro
            query = `SELECT * FROM productos WHERE nombre LIKE ? OR laboratorio LIKE ? OR rubro LIKE ? ORDER BY nombre ASC LIMIT 50`;
            const termino = `%${busqueda}%`;
            params = [termino, termino, termino];
        }

        const [rows] = await connection.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error búsqueda:', error);
        res.status(500).json({ error: 'Error interno al buscar productos' });
    } finally {
        if (connection) await connection.end();
    }
});

// 2. PROCESAR VENTA (TRANSACCIÓN COMPLETA)
app.post('/api/ventas', async (req, res) => {
    const { carrito, total, items_total } = req.body;

    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // INICIO DE TRANSACCIÓN
        await connection.beginTransaction();

        // A. Crear la Venta (Cabecera)
        const [ventaResult] = await connection.execute(
            'INSERT INTO ventas (total, items_cantidad, vendedor) VALUES (?, ?, ?)',
            [total, items_total, 'ADMIN']
        );
        const ventaId = ventaResult.insertId;

        // B. Procesar cada item
        for (const item of carrito) {
            // 1. Guardar detalle
            await connection.execute(
                `INSERT INTO detalle_ventas 
                (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ventaId, 
                    item.id_externo, 
                    item.nombre, 
                    item.cantidad, 
                    item.precio_venta, 
                    (item.precio_venta * item.cantidad)
                ]
            );

            // 2. Descontar Stock
            await connection.execute(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_externo = ?',
                [item.cantidad, item.id_externo]
            );
        }

        // Confirmar cambios
        await connection.commit();
        
        console.log(`✅ Venta #${ventaId} registrada. Total: $${total}`);
        res.json({ success: true, ventaId, message: 'Venta procesada correctamente' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error procesando venta:', error);
        res.status(500).json({ error: 'Error al procesar la venta en el servidor' });
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor SGF listo en http://127.0.0.1:${PORT}`);
});