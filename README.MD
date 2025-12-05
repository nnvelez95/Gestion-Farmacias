# **💊 SGF Farmacia \- Sistema de Gestión de Farmacia v2.0**

Sistema integral de Punto de Venta (POS) y Gestión de Stock para farmacias, desarrollado con **React**, **Node.js** y **MySQL**.

Esta versión (v2.0) introduce una reestructuración completa de la base de datos para soportar costos, márgenes, precios PAMI y búsqueda específica por droga/monodroga.

## **🚀 Nuevas Características (v2.0)**

### **📊 Gestión de Datos Profesional**

* **Base de Datos Expandida:** Soporte nativo para columnas Costo, Margen, Precio PAMI y Droga separada.  
* **Actualizador "Blindado":** Script inteligente (actualizador.js) que:  
  * Importa listas de precios masivas (CSV).  
  * Realiza **UPSERT** (Crea si es nuevo, Actualiza si existe).  
  * **Protección de Stock:** Actualizar precios NO resetea el stock de la farmacia.  
  * **Safety Check:** Corta automáticamente textos que excedan los límites de la base de datos para evitar errores de importación.

### **⚡ Punto de Venta (POS) Optimizado**

* **Atajos de Teclado Profesionales:**  
  * F1: Ayuda / Atajos.  
  * F2: **Búsqueda Avanzada** (Antes F10). Permite filtrar por Droga, Laboratorio, etc.  
  * F12: **Cobrar / Procesar Venta** (Antes F5). Evita conflictos con la recarga del navegador.  
* **Descuentos Globales:** Posibilidad de aplicar un porcentaje de descuento al total del ticket.  
* **Búsqueda Precisa:** El buscador ahora diferencia entre "Nombre Comercial" y "Droga" gracias a la nueva estructura de datos.

## **🛠️ Instalación y Configuración**

### **1\. Base de Datos**

El proyecto incluye una carpeta /db con el script de inicialización.

1. Crear una base de datos en MySQL llamada farmacia\_db.  
2. Ejecutar el script db/init.sql (o el script provisto en la carpeta db) para crear las tablas con la estructura extendida (soporte para VARCHAR(500) para evitar errores de longitud).

### **2\. Backend (Servidor)**

Ubicado en la carpeta /backend.

cd backend  
npm install  
\# Crear archivo .env con:  
\# DB\_HOST=127.0.0.1  
\# DB\_USER=root  
\# DB\_PASS=tu\_password  
\# DB\_NAME=farmacia\_db  
\# PORT=3001

\# Para iniciar el servidor:  
node server.js

### **3\. Frontend (Cliente)**

Ubicado en la carpeta /farmacia-cliente (o raíz del cliente).

cd farmacia-cliente  
npm install  
\# Crear archivo .env con:  
\# REACT\_APP\_API\_URL=\[http://127.0.0.1:3001/api\](http://127.0.0.1:3001/api)

\# Para iniciar la interfaz:  
npm start

## **🔄 Cómo Actualizar Precios**

El sistema cuenta con un **Importador Maestro** que lee archivos CSV de proveedores (formato Base\_Datos\_Productos\_Argentina\_Final.csv).

1. Colocar el archivo .csv actualizado en la carpeta /backend.  
2. Ejecutar el script actualizador:

cd backend  
node actualizador.js

**Nota:** El actualizador cortará automáticamente descripciones o códigos de barras que superen los 255 caracteres para asegurar la integridad de la base de datos.

## **⌨️ Atajos de Teclado (Cheat Sheet)**

| Tecla | Acción | Descripción |
| :---- | :---- | :---- |
| **F2** | 🔍 Buscar | Abre el modal de búsqueda avanzada (Droga, Lab, etc). |
| **F12** | 💳 Cobrar | Procesa la venta actual e imprime ticket (simulado). |
| **F1** | ❓ Ayuda | Muestra la lista de comandos disponibles. |
| **ESC** | ❌ Cancelar | Cierra modales o cancela ediciones. |

## **📂 Estructura del Proyecto**

/  
├── db/                 \# Scripts SQL para creación de tablas  
├── backend/            \# API Node.js \+ Express  
│   ├── server.js       \# Servidor principal y lógica de búsqueda  
│   └── actualizador.js \# Script de importación masiva (CSV \-\> MySQL)  
└── farmacia-cliente/   \# Frontend React  
    └── src/  
        └── App.js      \# Lógica principal del POS  
