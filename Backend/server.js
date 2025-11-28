const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// 1. Crear la aplicación de Express
const app = express();
const PORT = 3001; // Usamos el 3001 porque React suele usar el 3000

// 2. Middlewares (Configuraciones previas)
app.use(cors()); // Permite que cualquier web (tu frontend) nos pida datos
app.use(express.json()); // Permite recibir datos en formato JSON

// 3. Configuración de la Base de Datos
// NOTA: Asegúrate de poner la misma contraseña que usaste en importar.js
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'xxxx', // <--- ¡IMPORTANTE! CAMBIAR ESTO
    database: 'farmacia_db'
};

// 4. Ruta de Prueba (Para ver si el servidor vive)
app.get('/', (req, res) => {
    res.send('¡Hola! El servidor de la Farmacia está funcionando 💊');
});

// 5. Ruta de Búsqueda de Productos (El corazón del sistema)
// Se usa así: http://localhost:3001/api/productos?q=ibuprofeno
app.get('/api/productos', async (req, res) => {
    const busqueda = req.query.q; // Lo que escribe el usuario en el buscador

    if (!busqueda) {
        return res.status(400).json({ error: 'Por favor ingresa un término de búsqueda' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Lógica inteligente:
        // Si lo que busca es un número largo, asumimos que es Código de Barras o Troquel
        // Si es texto, buscamos por Nombre o Droga
        
        let query = '';
        let params = [];
        
        // Detectamos si es numérico (para código de barras)
        const esNumero = /^\d+$/.test(busqueda);

        if (esNumero) {
            query = `
                SELECT * FROM productos 
                WHERE codigo_barras = ? OR id_externo = ? OR troquel = ?
                LIMIT 1
            `;
            params = [busqueda, busqueda, busqueda];
        } else {
            // Búsqueda por texto (nombre, laboratorio o rubro)
            // Usamos % para decir "que contenga este texto"
            query = `
                SELECT * FROM productos 
                WHERE nombre LIKE ? OR laboratorio LIKE ? OR rubro LIKE ?
                ORDER BY nombre ASC
                LIMIT 50
            `;
            const termino = `%${busqueda}%`;
            params = [termino, termino, termino];
        }

        const [rows] = await connection.execute(query, params);
        
        res.json(rows); // Devolvemos los resultados al Frontend

    } catch (error) {
        console.error('Error en la búsqueda:', error);
        res.status(500).json({ error: 'Error al buscar en la base de datos' });
    } finally {
        if (connection) await connection.end(); // Cerramos la conexión siempre
    }
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor listo y escuchando en http://localhost:${PORT}`);
    console.log(`💊 Prueba buscar algo: http://localhost:${PORT}/api/productos?q=aspirina\n`);
});