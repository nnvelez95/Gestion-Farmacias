const fs = require('fs');
const mysql = require('mysql2/promise');
const csv = require('csv-parser'); // Necesitas instalar: npm install csv-parser mysql2

// Configuración de Conexión
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1123', // CAMBIAR ESTO
    database: 'farmacia_db'
};

async function importarProductos() {
    const connection = await mysql.createConnection(dbConfig);
    const results = [];

    console.log('🚀 Iniciando lectura del CSV...');

    fs.createReadStream('Base_Datos_Productos_Argentina_Limpia.csv')
        .pipe(csv({ separator: ';' })) // Tu CSV usa punto y coma
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`📦 Leídos ${results.length} filas. Filtrando e insertando en MySQL...`);
            
            // Usamos transacciones para mayor seguridad
            await connection.beginTransaction();

            try {
                const query = `
                    INSERT INTO productos 
                    (id_externo, troquel, codigo_barras, rubro, nombre, laboratorio, costo, pvp, stock_actual) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                    ON DUPLICATE KEY UPDATE 
                        costo = VALUES(costo), 
                        pvp = VALUES(pvp),
                        nombre = VALUES(nombre);
                `;

                let insertados = 0;
                let ignorados = 0;

                for (const row of results) {
                    // --- VALIDACIÓN ANTI-ERRORES ---
                    // Saltamos la fila si el ID no es un número (ej: fila de 'Totales')
                    if (!row.IDProducto || isNaN(parseInt(row.IDProducto))) {
                         // Solo mostramos advertencia si parece una fila de datos y no una linea vacia
                         if (row.IDProducto || row.Producto) {
                             console.warn(`⚠️ Saltando fila no válida (posible total o basura): ${JSON.stringify(row)}`);
                         }
                         ignorados++;
                         continue;
                    }

                    // Limpieza de datos (Convertir strings a números)
                    const costo = parseFloat(row.Costo) || 0;
                    const pvp = parseFloat(row.PVP) || 0;
                    const troquel = parseInt(row.Troquel) || 0;
                    
                    await connection.execute(query, [
                        row.IDProducto, 
                        troquel, 
                        row.Codebar, 
                        row.Rubro, 
                        row.Producto, 
                        row.Laboratorio, 
                        costo, 
                        pvp
                    ]);
                    insertados++;
                }

                await connection.commit();
                console.log(`✅ Importación completada.`);
                console.log(`📊 Insertados/Actualizados: ${insertados}`);
                console.log(`🗑️ Ignorados (Totales/Vacíos): ${ignorados}`);

            } catch (error) {
                await connection.rollback();
                console.error('❌ Error CRÍTICO en la importación:', error);
            } finally {
                await connection.end();
            }
        });
}

importarProductos();
