import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, User, Calendar, Wifi, WifiOff, Edit3, X, Save, CheckCircle, AlertTriangle, HelpCircle, Keyboard, Filter, Tag, Beaker } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3001/api';

const App = () => {
    // --- ESTADOS GLOBALES ---
    const [carrito, setCarrito] = useState([]);
    const [descuentoGlobal, setDescuentoGlobal] = useState(0); 
    const [serverStatus, setServerStatus] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [notificacion, setNotificacion] = useState({ show: false, tipo: '', msj: '' });

    // ESTADOS DE BÚSQUEDA
    const [busquedaRapida, setBusquedaRapida] = useState('');
    const [resultadosRapidos, setResultadosRapidos] = useState([]);
    const [indexRapido, setIndexRapido] = useState(0);

    // MODAL BÚSQUEDA AVANZADA (F2)
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [filtrosAvanzados, setFiltrosAvanzados] = useState({ nombre: '', droga: '', lab: '', codigo: '', stock: false });
    const [resultadosAvanzados, setResultadosAvanzados] = useState([]);
    const [indexAvanzado, setIndexAvanzado] = useState(0);

    // EDICIÓN
    const [itemEditando, setItemEditando] = useState(null);
    const [precioEditado, setPrecioEditado] = useState('');
    const [cantidadEditada, setCantidadEditada] = useState('');
    
    // REFS
    const searchInputRef = useRef(null);
    const modalInputRef = useRef(null);
    const editInputRef = useRef(null);
    const listRapidaRef = useRef(null);
    const listAvanzadaRef = useRef(null);

    // CÁLCULOS
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
    const montoDescuento = subtotal * (descuentoGlobal / 100);
    const totalFinal = subtotal - montoDescuento;
    const itemsTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // --- EFECTOS ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (busquedaRapida.length > 2) {
                buscarProductos('rapida');
            } else {
                setResultadosRapidos([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busquedaRapida]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const f = filtrosAvanzados;
            if (showSearchModal && (f.nombre.length > 1 || f.droga.length > 1 || f.lab.length > 1 || f.codigo.length > 1 || f.stock)) {
                buscarProductos('avanzada');
            } else if (showSearchModal) {
                setResultadosAvanzados([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filtrosAvanzados, showSearchModal]);

    useEffect(() => { if (showSearchModal) setTimeout(() => modalInputRef.current?.focus(), 50); }, [showSearchModal]);
    useEffect(() => { if (itemEditando) { setTimeout(() => editInputRef.current?.focus(), 50); editInputRef.current?.select(); } }, [itemEditando]);

    // --- API ---
    const buscarProductos = async (tipo) => {
        try {
            const params = new URLSearchParams();
            if (tipo === 'rapida') {
                params.append('q', busquedaRapida);
            } else {
                const f = filtrosAvanzados;
                if (f.nombre) params.append('nombre', f.nombre);
                if (f.droga) params.append('droga', f.droga);
                if (f.lab) params.append('lab', f.lab);
                if (f.codigo) params.append('codigo', f.codigo);
                if (f.stock) params.append('stock', 'true');
            }

            const response = await fetch(`${API_URL}/productos?${params.toString()}`);
            if (!response.ok) throw new Error('Red');
            const data = await response.json();

            if (tipo === 'rapida') {
                setResultadosRapidos(data);
                setIndexRapido(0);
            } else {
                setResultadosAvanzados(data);
                setIndexAvanzado(0);
            }
            setServerStatus(true);
        } catch (error) {
            setServerStatus(false);
        }
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) return;
        mostrarNotificacion('info', 'Procesando...');

        try {
            const response = await fetch(`${API_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    carrito, 
                    subtotal, 
                    descuento_porcentaje: descuentoGlobal, 
                    descuento_monto: montoDescuento, 
                    total: totalFinal, 
                    items_total: itemsTotal 
                })
            });

            const data = await response.json();
            if (response.ok) {
                setCarrito([]);
                setDescuentoGlobal(0);
                setResultadosRapidos([]);
                setBusquedaRapida('');
                mostrarNotificacion('success', `¡Venta #${data.ventaId} Exitosa!`);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('error', `Error: ${error.message}`);
        }
    };

    // --- UI HELPERS ---
    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.id_externo === producto.id_externo);
        if (existe) {
            setCarrito(carrito.map(item => item.id_externo === producto.id_externo ? { ...item, cantidad: item.cantidad + 1 } : item));
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1, precio_venta: parseFloat(producto.pvp), precio_original: parseFloat(producto.pvp) }]);
        }
        
        // Lógica de cierre de ventanas tras seleccionar
        if (showSearchModal) {
            // No cerramos el modal avanzado inmediatamente para permitir selección múltiple si se desea, 
            // o puedes descomentar la linea de abajo para cerrar al elegir:
            // setShowSearchModal(false); 
            // Por defecto en POS suele ser mejor volver al foco del input del modal o cerrar.
            // Vamos a cerrarlo para agilidad:
            setShowSearchModal(false);
            setFiltrosAvanzados({ nombre: '', droga: '', lab: '', codigo: '', stock: false });
            setResultadosAvanzados([]);
            searchInputRef.current?.focus();
        } else {
            setBusquedaRapida('');
            setResultadosRapidos([]);
            searchInputRef.current?.focus();
        }
    };

    const handleFiltroAvanzado = (e) => {
        const { name, value, type, checked } = e.target;
        setFiltrosAvanzados(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const eliminarDelCarrito = (id) => setCarrito(carrito.filter(item => item.id_externo !== id));

    const saveEdit = () => {
        if (!itemEditando) return;
        const nuevoPrecio = parseFloat(precioEditado);
        const nuevaCantidad = parseInt(cantidadEditada);
        if (isNaN(nuevoPrecio) || isNaN(nuevaCantidad) || nuevaCantidad < 1) return;
        setCarrito(carrito.map(item => item.id_externo === itemEditando.id_externo ? { ...item, precio_venta: nuevoPrecio, cantidad: nuevaCantidad } : item));
        setItemEditando(null);
        searchInputRef.current?.focus();
    };

    const mostrarNotificacion = (tipo, msj) => {
        setNotificacion({ show: true, tipo, msj });
        setTimeout(() => setNotificacion({ show: false, tipo: '', msj: '' }), 3000);
    };

    // --- TECLADO MAESTRO (SHORTCUTS ACTUALIZADOS) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Si estamos editando un item, Enter guarda y Esc cancela
            if (itemEditando) {
                if (e.key === 'Escape') setItemEditando(null);
                if (e.key === 'Enter') saveEdit();
                return;
            }

            // Atajos Globales
            if (e.key === 'F1') { 
                e.preventDefault(); // Evita ayuda del navegador
                setShowHelp(prev => !prev); 
            }
            if (e.key === 'F12') { // ANTES F5
                e.preventDefault(); // Evita DevTools
                if (carrito.length > 0) procesarVenta(); 
            }
            if (e.key === 'F2') { // ANTES F10
                e.preventDefault(); 
                setShowSearchModal(true); 
            }
            if (e.key === 'Escape') { 
                setShowHelp(false); 
                setShowSearchModal(false); 
                searchInputRef.current?.focus(); 
            }

            // Navegación en listas (Flechas)
            if (showSearchModal && resultadosAvanzados.length > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIndexAvanzado(p => { const n = Math.min(p + 1, resultadosAvanzados.length - 1); document.getElementById(`adv-result-${n}`)?.scrollIntoView({ block: 'nearest' }); return n; }); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setIndexAvanzado(p => { const n = Math.max(p - 1, 0); document.getElementById(`adv-result-${n}`)?.scrollIntoView({ block: 'nearest' }); return n; }); }
                if (e.key === 'Enter') { e.preventDefault(); agregarAlCarrito(resultadosAvanzados[indexAvanzado]); }
            } else if (!showSearchModal && resultadosRapidos.length > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIndexRapido(p => { const n = Math.min(p + 1, resultadosRapidos.length - 1); document.getElementById(`quick-result-${n}`)?.scrollIntoView({ block: 'nearest' }); return n; }); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setIndexRapido(p => { const n = Math.max(p - 1, 0); document.getElementById(`quick-result-${n}`)?.scrollIntoView({ block: 'nearest' }); return n; }); }
                if (e.key === 'Enter') { e.preventDefault(); agregarAlCarrito(resultadosRapidos[indexRapido]); }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSearchModal, resultadosRapidos, resultadosAvanzados, indexRapido, indexAvanzado, carrito, itemEditando]);

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen bg-slate-200 font-sans overflow-hidden">
            
            {/* Header */}
            <header className="bg-blue-900 text-white p-2 flex justify-between items-center text-sm shadow-md z-10">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg tracking-wider">SGF FARMACIA</span>
                    <span className="bg-blue-800 px-2 py-0.5 rounded flex items-center gap-2">
                        <Calendar size={14} /> {new Date().toLocaleDateString('es-AR')}
                    </span>
                    {/* Botón AYUDA F1 */}
                    <button onClick={() => setShowHelp(true)} className="bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded flex items-center gap-1 transition text-xs">
                        <HelpCircle size={14}/> Ayuda (F1)
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${serverStatus ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
                        {serverStatus ? <Wifi size={14} /> : <WifiOff size={14} />} {serverStatus ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <span className="flex items-center gap-1"><User size={14} /> Admin</span>
                </div>
            </header>

            {/* Notificaciones */}
            {notificacion.show && (
                <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-white font-bold text-lg animate-in slide-in-from-top-5 ${notificacion.tipo === 'success' ? 'bg-green-600' : notificacion.tipo === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {notificacion.tipo === 'success' ? <CheckCircle size={28} /> : notificacion.tipo === 'error' ? <AlertTriangle size={28}/> : <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>}
                    {notificacion.msj}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                
                {/* IZQUIERDA: Buscador */}
                <div className="w-2/3 flex flex-col p-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-600 flex flex-col gap-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase">Escáner / Búsqueda Rápida</label>
                            {/* Botón BÚSQUEDA AVANZADA F2 */}
                            <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => setShowSearchModal(true)}>¿Búsqueda Avanzada? (F2)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search className="text-blue-600" size={28} />
                            <input ref={searchInputRef} autoFocus type="text" className="w-full text-2xl font-bold text-slate-700 outline-none placeholder:text-slate-300 uppercase" placeholder="Escanee código o escriba..." value={busquedaRapida} onChange={(e) => setBusquedaRapida(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col border border-slate-300">
                        <div className="bg-slate-100 p-2 text-xs font-bold text-slate-600 flex border-b border-slate-300">
                            <span className="w-20">CÓDIGO</span>
                            <span className="flex-1">DESCRIPCIÓN</span>
                            <span className="w-40">LABORATORIO</span>
                            <span className="w-24 text-right">PRECIO</span>
                            <span className="w-16 text-center">STOCK</span>
                        </div>
                        <div className="overflow-y-auto flex-1" ref={listRapidaRef}>
                            {resultadosRapidos.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                                    <Search size={48} className="mb-2"/>
                                    <p>Esperando búsqueda...</p>
                                </div>
                            )}
                            {resultadosRapidos.map((prod, index) => (
                                <div id={`quick-result-${index}`} key={prod.id_externo || index} onClick={() => agregarAlCarrito(prod)} className={`flex items-center p-2 text-sm border-b cursor-pointer select-none ${index === indexRapido ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700'}`}>
                                    <span className="w-20 font-mono text-xs opacity-70 truncate">{prod.codigo_barras || prod.id_externo}</span>
                                    <span className="flex-1 font-bold truncate pr-4">{prod.nombre}</span>
                                    <span className="w-40 text-xs truncate opacity-80">{prod.laboratorio}</span>
                                    <span className={`w-24 text-right font-mono font-bold ${index === indexRapido ? 'text-white' : 'text-green-700'}`}>$ {parseFloat(prod.pvp).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                                    <span className={`w-16 text-center font-bold text-xs ${prod.stock_actual <= 0 && index !== indexRapido ? 'text-red-400' : ''}`}>{prod.stock_actual}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* DERECHA: Ticket */}
                <div className="w-1/3 bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
                    <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-2"><ShoppingCart size={18}/> TICKET</span>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded">Items: {itemsTotal}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-100">
                        {carrito.map((item, idx) => (
                            <div key={idx} onClick={() => { setItemEditando(item); setPrecioEditado(item.precio_venta); setCantidadEditada(item.cantidad); }} className="bg-white p-2 rounded shadow-sm border border-slate-200 flex flex-col relative group cursor-pointer hover:border-blue-400 transition">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-700 text-sm w-4/5 leading-tight">{item.nombre}</span>
                                    <button onClick={(e) => { e.stopPropagation(); eliminarDelCarrito(item.id_externo); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-xs text-slate-500 flex items-center gap-1"><span className="font-bold bg-slate-200 px-1 rounded">{item.cantidad}</span> x <span className="text-blue-600 font-bold">${item.precio_venta.toFixed(2)}</span></div>
                                    <div className="font-bold text-slate-800">$ {(item.precio_venta * item.cantidad).toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-blue-400"><Edit3 size={14}/></div>
                            </div>
                        ))}
                    </div>
                    
                    {/* PANEL DE TOTALES */}
                    <div className="bg-slate-50 p-4 border-t border-slate-300">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                             <div className="flex items-center gap-2 text-slate-500 text-sm font-bold"><Tag size={16} /> Descuento Global (%)</div>
                             <input type="number" min="0" max="100" className="w-16 border rounded p-1 text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={descuentoGlobal} onChange={(e) => setDescuentoGlobal(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} />
                        </div>
                        <div className="space-y-1 mb-4">
                            <div className="flex justify-between text-slate-500 text-sm"><span>Subtotal</span><span>$ {subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span></div>
                            {descuentoGlobal > 0 && (<div className="flex justify-between text-green-600 text-sm font-bold"><span>Descuento ({descuentoGlobal}%)</span><span>- $ {montoDescuento.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span></div>)}
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200"><span className="text-slate-800 text-lg font-bold">TOTAL FINAL</span><span className="text-4xl font-black text-slate-800 tracking-tight">$ {totalFinal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span></div>
                        </div>
                        
                        {/* Botón COBRAR F12 */}
                        <button 
                            type="button" 
                            className={`w-full py-4 rounded-lg shadow-lg font-bold text-xl flex justify-center items-center gap-2 transition active:scale-95 text-white ${carrito.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 cursor-not-allowed'}`} 
                            onClick={() => procesarVenta()} // Funciona con Click
                            disabled={carrito.length === 0}
                        >
                            <CreditCard size={24} /> COBRAR (F12)
                        </button>
                    </div>
                </div>

                {/* MODAL F2 (Búsqueda Avanzada) */}
                {showSearchModal && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-50 pt-10" onClick={() => setShowSearchModal(false)}>
                        <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-400" onClick={e => e.stopPropagation()}>
                            <div className="bg-blue-700 p-4 flex justify-between items-center text-white shrink-0">
                                <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={24}/> Búsqueda Avanzada</h2>
                                <button onClick={() => setShowSearchModal(false)}><X/></button>
                            </div>
                            <div className="p-4 bg-slate-50 border-b grid grid-cols-12 gap-3 shrink-0">
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial</label>
                                    <input ref={modalInputRef} name="nombre" value={filtrosAvanzados.nombre} onChange={handleFiltroAvanzado} className="w-full p-2 border rounded outline-none text-sm uppercase focus:ring-2 focus:ring-blue-500" placeholder="Ej: Lotrial"/>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Beaker size={12}/> Droga / Detalle</label>
                                    <input name="droga" value={filtrosAvanzados.droga} onChange={handleFiltroAvanzado} className="w-full p-2 border rounded outline-none text-sm uppercase focus:ring-2 focus:ring-blue-500" placeholder="Ej: Enalapril"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Laboratorio</label>
                                    <input name="lab" value={filtrosAvanzados.lab} onChange={handleFiltroAvanzado} className="w-full p-2 border rounded outline-none text-sm uppercase focus:ring-2 focus:ring-blue-500" placeholder="Ej: Roemmers"/>
                                </div>
                                <div className="col-span-2 flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white border px-3 py-2 rounded w-full hover:bg-slate-50 select-none">
                                        <input type="checkbox" name="stock" checked={filtrosAvanzados.stock} onChange={handleFiltroAvanzado} className="w-4 h-4 text-blue-600"/>
                                        <span className="text-xs font-bold text-slate-700">Stock</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-white p-2" ref={listAvanzadaRef}>
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-100 text-slate-500 font-bold text-xs sticky top-0 z-10 shadow-sm">
                                        <tr><th className="p-3 border-b">Descripción</th><th className="p-3 border-b">Droga</th><th className="p-3 border-b">Laboratorio</th><th className="p-3 border-b text-right">Precio</th><th className="p-3 border-b text-center">Stock</th></tr>
                                    </thead>
                                    <tbody>
                                        {resultadosAvanzados.map((prod, idx) => (
                                            <tr id={`adv-result-${idx}`} key={idx} onClick={() => agregarAlCarrito(prod)} className={`cursor-pointer border-b transition-colors ${idx === indexAvanzado ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700'}`}>
                                                <td className="p-3 font-semibold">{prod.nombre}</td>
                                                <td className="p-3 text-xs opacity-80">{prod.droga || '-'}</td>
                                                <td className={`p-3 text-xs ${idx === indexAvanzado ? 'text-blue-100' : 'text-slate-500'}`}>{prod.laboratorio}</td>
                                                <td className="p-3 text-right font-mono font-bold">$ {parseFloat(prod.pvp).toLocaleString('es-AR')}</td>
                                                <td className="p-3 text-center font-bold">{prod.stock_actual}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL EDICIÓN */}
                {itemEditando && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><Edit3 size={18}/> Editar Item</h3>
                                <button onClick={() => setItemEditando(null)}><X size={20}/></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm font-bold text-slate-800 border-b pb-2">{itemEditando.nombre}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad</label><input type="number" min="1" className="w-full border-2 border-slate-300 rounded p-2 text-xl font-bold text-center focus:border-blue-500 outline-none" value={cantidadEditada} onChange={(e) => setCantidadEditada(e.target.value)}/></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ($)</label><input ref={editInputRef} type="number" step="0.01" className="w-full border-2 border-slate-300 rounded p-2 text-xl font-bold text-center text-green-700 focus:border-blue-500 outline-none" value={precioEditado} onChange={(e) => setPrecioEditado(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}/></div>
                                </div>
                            </div>
                            <div className="bg-slate-100 p-4 flex gap-2 justify-end">
                                <button onClick={() => setItemEditando(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded">Cancelar</button>
                                <button onClick={saveEdit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AYUDA */}
                {showHelp && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowHelp(false)}>
                        <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><Keyboard size={32}/> Centro de Comandos</h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2"><Search size={16}/> Búsqueda</h3>
                                    <p className="text-sm text-slate-600">Escriba directamente en la pantalla principal para búsqueda rápida.</p>
                                    <p className="text-sm text-slate-600 mt-2">Presione <kbd className="border bg-slate-100 px-1">F2</kbd> para filtros avanzados (Droga, Lab, Stock).</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2"><ShoppingCart size={16}/> Ventas</h3>
                                    <p className="text-sm text-slate-600">Presione <kbd className="bg-green-100 px-1 rounded">F12</kbd> o haga click en COBRAR para finalizar.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="bg-slate-300 p-1 flex justify-center gap-2 border-t border-slate-400 text-xs select-none">
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700 cursor-pointer hover:bg-blue-50" onClick={() => setShowHelp(true)}><span className="font-bold text-black">F1</span> Ayuda</div>
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700 cursor-pointer" onClick={() => procesarVenta()}><span className="font-bold text-black">F12</span> Cobrar</div>
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700 cursor-pointer hover:bg-blue-50" onClick={() => setShowSearchModal(true)}><span className="font-bold text-black">F2</span> Buscar</div>
            </footer>
        </div>
    );
};

export default App;