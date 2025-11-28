SGF Farmacia (Sistema de Gestión Farmacéutica) 💊
=================================================

📋 Descripción del Proyecto
---------------------------

SGF Farmacia es una aplicación de Punto de Venta (POS) moderna diseñada específicamente para el flujo de trabajo ágil de una farmacia argentina.

El objetivo es reemplazar el software legado (lento y visualmente obsoleto) por una arquitectura web moderna (**React + Node.js**), manteniendo la velocidad y usabilidad de las aplicaciones de escritorio clásicas (uso intensivo de teclado, alto contraste, búsquedas instantáneas).

🚀 Funcionalidades Principales
------------------------------

### ✅ Implementadas (MVP)

*   **Búsqueda Dual Inteligente:**
    
    *   Búsqueda por **Nombre/Droga** (texto) y por **Código de Barras/Troquel** (numérico) en el mismo campo.
        
    *   Resultados en tiempo real (< 300ms) conectados a base de datos MySQL.
        
*   **Interfaz "Keyboard-First":**
    
    *   F10: Foco inmediato al buscador.
        
    *   Flechas ↑ ↓: Navegación por la lista de resultados.
        
    *   Enter: Agregar al carrito.
        
    *   F5: Disparar cobro.
        
*   **Gestión de Carrito Flexible:**
    
    *   Cálculo automático de totales.
        
    *   **Edición en línea:** Posibilidad de modificar precio unitario (descuentos manuales/redondeo) y cantidad desde un modal.
        
*   **Base de Datos Real:**
    
    *   Integración con MySQL conteniendo Vademécum completo (precios, laboratorios, troqueles).
        

### 🚧 En Desarrollo (Roadmap)

*   **Empaquetado Desktop:** Migración a **Electron** para convertir la web en un .exe nativo.
    
*   **Impresión:** Conexión directa con impresoras térmicas (EPSON/Hasar) para tickets.
    
*   **Obras Sociales:** Módulo para calcular cobertura % según la obra social del cliente.
    
*   **Cierre de Caja (Z):** Reportes diarios de facturación.
    

🛠️ Stack Tecnológico
---------------------

*   **Frontend:** React 18, Tailwind CSS v3, Lucide React (Iconos).
    
*   **Backend:** Node.js, Express.
    
*   **Base de Datos:** MySQL 8.0 (con tablas optimizadas e indexadas).
    
*   **Infraestructura:** API REST local.
    

⚙️ Instalación y Despliegue Local
---------------------------------

### Pre-requisitos

*   Node.js (v16 o superior).
    
*   MySQL Server instalado y corriendo.
    

### 1\. Base de Datos

1.  Crear la base de datos farmacia_db en MySQL.
    
2.  Ejecutar el script de importación importar.js ubicado en /backend para poblar la tabla productos desde el CSV maestro.
    

### 2\. Backend (API)

```bash
 cd backend 
 npm install  # Asegurar configuración de credenciales en server.js  
 node server.js # El servidor correrá en http://localhost:3001   `
```

### 3\. Frontend (Cliente)

```bash
cd farmacia-cliente
npm install
npm start  # La aplicación abrirá en http://localhost:3000   `
```

⌨️ Atajos de Teclado (Cheat Sheet)
----------------------------------

**Tecla**

**Acción**

**F10**

Enfocar barra de búsqueda

**F5**

Finalizar venta (Cobrar)

**F1**

Mostrar ayuda

**ESC**

Cancelar edición / Cerrar modales

**Enter**

Seleccionar producto / Guardar cambios

🤝 Contribución
---------------

Proyecto de código abierto para modernización de farmacias. Las Pull Requests son bienvenidas.