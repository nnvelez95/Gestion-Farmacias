require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

// CONFIGURACIÓN
const CSV_FILE = 'Base_Datos_Productos_Argentina_Final.csv';

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'farmacia_db'
};

// --- FUNCIÓN DE SEGURIDAD ---
// Corta el texto si excede el límite de la base de datos
const limpiarDato = (dato, maxLen) => {
    if (!dato) return '';
    let str = String(dato).trim();
    if (str.length > maxLen) {
        return str.substring(0, maxLen);
    }
    return str;
};

const importarDatos = async () => {
    console.time('⏱️ Tiempo Total');
    console.log('🚀 Iniciando Actualización Masiva (Modo Seguro)...');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const updates = [];
        let contador = 0;

        // Lectura del archivo
        fs.createReadStream(CSV_FILE)
            .pipe(csv({ separator: ';' })) 
            .on('data', (row) => {
                // Mapeo de columnas con LIMITADORES DE TEXTO
                const id_externo = limpiarDato(row['Cod.Producto'], 95);

                if (id_externo) {
                    updates.push({ 
                        id_externo: id_externo,
                        troquel: limpiarDato(row['Troquel'], 95),
                        nombre: limpiarDato(row['Producto'], 495), // Hasta 500 chars
                        codigo_barras: limpiarDato(row['Codebar'], 250), // Hasta 255 chars
                        rubro: limpiarDato(row['Rubro'], 95),
                        laboratorio: limpiarDato(row['Laboratorio'], 95),
                        droga: limpiarDato(row['Droga'], 495), // Hasta 500 chars
                        
                        // Números
                        pvp: parseFloat(row['Precio']) || 0,
                        costo: parseFloat(row['Costo']) || 0,
                        margen: parseFloat(row['Margen']) || 0,
                        precio_pami: parseFloat(row['Precio Pami']) || 0,
                        
                        // Fecha (Validación simple)
                        fecha_precio: (row['Fec. Precio'] && row['Fec. Precio'] !== '0000-00-00') ? row['Fec. Precio'] : null
                    });
                }
            })
            .on('end', async () => {
                console.log(`📂 CSV Leído. Insertando/Actualizando ${updates.length} productos...`);

                // QUERY UPSERT: Inserta o Actualiza respetando el stock
                const query = `
                    INSERT INTO productos 
                    (id_externo, codigo_barras, troquel, nombre, laboratorio, rubro, droga, pvp, costo, margen, precio_pami, fecha_precio, stock_actual)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    ON DUPLICATE KEY UPDATE 
                        pvp = VALUES(pvp),
                        costo = VALUES(costo),
                        margen = VALUES(margen),
                        precio_pami = VALUES(precio_pami),
                        nombre = VALUES(nombre),
                        droga = VALUES(droga),
                        laboratorio = VALUES(laboratorio),
                        rubro = VALUES(rubro),
                        codigo_barras = VALUES(codigo_barras),
                        fecha_precio = VALUES(fecha_precio),
                        ultima_actualizacion = NOW();
                `;

                // Procesamos en bucle
                for (const item of updates) {
                    try {
                        await connection.execute(query, [
                            item.id_externo, 
                            item.codigo_barras, 
                            item.troquel, 
                            item.nombre, 
                            item.laboratorio, 
                            item.rubro, 
                            item.droga, 
                            item.pvp,
                            item.costo,
                            item.margen,
                            item.precio_pami,
                            item.fecha_precio
                        ]);
                        contador++;
                        if (contador % 2000 === 0) process.stdout.write(`.`);
                    } catch (errRow) {
                        console.error(`⚠️ Error saltado en ID ${item.id_externo}: ${errRow.message}`);
                    }
                }

                console.log(`\n\n✅ ACTUALIZACIÓN COMPLETADA.`);
                console.log(`Total procesados: ${contador}`);
                console.timeEnd('⏱️ Tiempo Total');
                await connection.end();
                process.exit();
            });

    } catch (error) {
        console.error('❌ Error General:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
};

importarDatos();