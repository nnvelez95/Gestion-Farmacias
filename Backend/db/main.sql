DROP DATABASE IF EXISTS farmacia_db;
CREATE DATABASE farmacia_db;
USE farmacia_db;

-- 1. TABLA PRODUCTOS
-- Hemos agrandado los VARCHAR para que no fallen los códigos largos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_externo VARCHAR(100) UNIQUE, -- Agrandado
    codigo_barras VARCHAR(255),     -- Agrandado para evitar el error
    troquel VARCHAR(100),
    nombre VARCHAR(500),            -- Agrandado
    droga VARCHAR(500),             -- Nueva columna clave
    laboratorio VARCHAR(100),
    rubro VARCHAR(100),
    
    -- Datos Económicos Nuevos
    pvp DECIMAL(12, 2) DEFAULT 0,
    costo DECIMAL(12, 2) DEFAULT 0,
    margen DECIMAL(5, 2) DEFAULT 0,
    precio_pami DECIMAL(12, 2) DEFAULT 0,
    
    fecha_precio DATE DEFAULT NULL,
    stock_actual INT DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABLA VENTAS (Con soporte para descuentos)
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12, 2),
    items_cantidad INT,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(12, 2) DEFAULT 0,
    vendedor VARCHAR(50)
);

-- 3. TABLA DETALLE
CREATE TABLE detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT,
    producto_id VARCHAR(100),
    nombre_producto VARCHAR(500),
    cantidad INT,
    precio_unitario DECIMAL(12, 2),
    subtotal DECIMAL(12, 2),
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
);