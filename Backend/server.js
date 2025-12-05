require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME || 'farmacia_db'
};

app.get('/', (req, res) => res.send('💊 Servidor Farmacia SGF: Activo (Base V3)'));

// BUSCADOR MEJORADO
app.get('/api/productos', async (req, res) => {
    const { q, nombre, droga, lab, codigo, stock } = req.query;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        let query = 'SELECT * FROM productos WHERE 1=1';
        let params = [];
        
        // 1. BÚSQUEDA RÁPIDA (Scanner)
        if (q) { 
            const termino = q.trim();
            if (/^\d+$/.test(termino)) {
                // Códigos numéricos
                query += ' AND (codigo_barras = ? OR id_externo = ? OR troquel = ?)';
                params.push(termino, termino, termino);
            } else {
                // Texto General (incluye droga)
                query += ' AND (nombre LIKE ? OR droga LIKE ? OR laboratorio LIKE ? OR rubro LIKE ?)';
                const likeTerm = `%${termino}%`;
                params.push(likeTerm, likeTerm, likeTerm, likeTerm);
            }
        } 
        // 2. BÚSQUEDA AVANZADA (F10)
        else { 
            if (stock === 'true') query += ' AND stock_actual > 0';
            
            if (codigo) {
                query += ' AND (codigo_barras LIKE ? OR id_externo LIKE ?)';
                params.push(`${codigo}%`, `${codigo}%`);
            }
            if (nombre) {
                const palabras = nombre.trim().split(/\s+/);
                palabras.forEach(palabra => {
                    query += ' AND nombre LIKE ?';
                    params.push(`%${palabra}%`);
                });
            }
            if (droga) {
                // Buscamos directamente en la columna droga
                const palabrasDroga = droga.trim().split(/\s+/);
                palabrasDroga.forEach(palabra => {
                    query += ' AND droga LIKE ?';
                    params.push(`%${palabra}%`);
                });
            }
            if (lab) {
                query += ' AND laboratorio LIKE ?';
                params.push(`%${lab}%`);
            }
        }
        
        query += ' ORDER BY nombre ASC LIMIT 50';
        const [rows] = await connection.execute(query, params);
        res.json(rows);

    } catch (error) {
        console.error('Error búsqueda:', error);
        res.status(500).json({ error: 'Error interno' });
    } finally {
        if (connection) await connection.end();
    }
});

// PROCESAR VENTA
app.post('/api/ventas', async (req, res) => {
    const { carrito, descuento_porcentaje, descuento_monto, total, items_total } = req.body;

    if (!carrito || carrito.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [ventaResult] = await connection.execute(
            `INSERT INTO ventas 
            (total, items_cantidad, descuento_porcentaje, descuento_monto, vendedor) 
            VALUES (?, ?, ?, ?, ?)`,
            [total, items_total, descuento_porcentaje || 0, descuento_monto || 0, 'ADMIN']
        );
        const ventaId = ventaResult.insertId;

        for (const item of carrito) {
            await connection.execute(
                `INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
                [ventaId, item.id_externo, item.nombre, item.cantidad, item.precio_venta, (item.precio_venta * item.cantidad)]
            );
            await connection.execute('UPDATE productos SET stock_actual = stock_actual - ? WHERE id_externo = ?', [item.cantidad, item.id_externo]);
        }

        await connection.commit();
        res.json({ success: true, ventaId });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor SGF listo en http://127.0.0.1:${PORT}`);
});