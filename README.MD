# 💊 SGF Farmacia (Sistema de Gestión Farmacéutica)

Sistema de Punto de Venta (POS) moderno, diseñado para farmacias argentinas, enfocado en la velocidad de operación mediante teclado y búsqueda instantánea.

## 🚀 Funcionalidades Implementadas (Estado Actual)

### 🛒 Módulo de Ventas (Front Desk)
* **Búsqueda Híbrida Inteligente:**
    * Detección automática de **Código de Barras/Troquel** (numérico) vs **Nombre/Droga** (texto).
    * Resultados en tiempo real conectados al Vademécum.
* **Interfaz "Keyboard-First" (Sin mouse):**
    * `F10`: Activar buscador.
    * `Flechas`: Navegar resultados.
    * `Enter`: Agregar al carrito.
    * `F5`: Procesar venta (Cobrar).
* **Gestión de Carrito:**
    * Modificación manual de **Precios Unitarios** (para descuentos o redondeos) y **Cantidades** mediante modal emergente.
    * Cálculo automático de totales.
* **Feedback de Usuario:**
    * Notificaciones tipo "Toast" para confirmar ventas o alertar errores.

### ⚙️ Backend & Datos
* **Transacciones ACID:** Las ventas aseguran la integridad de datos (si falla el stock, se cancela la venta).
* **Control de Stock:** Descuento automático del inventario al confirmar el ticket.
* **Persistencia:** Base de datos relacional MySQL con tablas normalizadas (`productos`, `ventas`, `detalle_ventas`).

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 18, Tailwind CSS v3, Lucide React (Iconos).
* **Backend:** Node.js v25+, Express.
* **Base de Datos:** MySQL 8.0.
* **Comunicación:** API REST (JSON).

---

## 📦 Instalación y Despliegue Local

### Pre-requisitos
* Node.js instalado.
* MySQL Server corriendo localmente.

### 1. Configuración de Base de Datos
Ejecutar los scripts SQL ubicados en `/backend` (o creados manualmente):
1. Crear DB `farmacia_db`.
2. Crear tablas (`productos`, `ventas`, `detalle_ventas`).
3. Importar CSV de productos usando `node importar.js`.

### 2. Iniciar el Backend (API)
```bash
cd backend
npm install
# Asegurar que en server.js las credenciales de MySQL sean correctas
# NOTA: En macOS, usar host: '127.0.0.1' en lugar de localhost
node server.js

```

_El servidor correrá en: http://127.0.0.1:3001_

### 3\. Iniciar el Frontend (Cliente)

```bash
cd farmacia-cliente
npm install
npm start
```
_La aplicación abrirá en: http://localhost:3000_

🗺️ Roadmap (Próximos Pasos)
----------------------------

*   \[x\] Búsqueda y Carrito.
    
*   \[x\] Conexión Backend-Frontend.
    
*   \[x\] Procesamiento de Venta y Stock.
    
*   \[ \] **Reportes:** Cierre de Caja (Z) y listado de ventas diarias.
    
*   \[ \] **Impresión:** Conexión con impresoras térmicas (ESC/POS).
    
*   \[ \] **Clientes:** Gestión de Obras Sociales y afiliados.
    
*   \[ \] **Auth:** Sistema de Login para múltiples vendedores.
    

🤝 Contribución
---------------

Proyecto desarrollado con fines educativos y de modernización tecnológica para el sector farmacéutico.