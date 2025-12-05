import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, User, Calendar, Power, Wifi, WifiOff, Edit3, X, Save, CheckCircle, AlertTriangle } from 'lucide-react';

// URL ajustada para Mac (evita localhost)
const API_URL = 'http://127.0.0.1:3001/api';

const App = () => {
    // --- ESTADOS ---
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serverStatus, setServerStatus] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    
    // Estados de Edición
    const [itemEditando, setItemEditando] = useState(null);
    const [precioEditado, setPrecioEditado] = useState('');
    const [cantidadEditada, setCantidadEditada] = useState('');

    // Notificaciones
    const [notificacion, setNotificacion] = useState({ show: false, tipo: '', msj: '' });

    const searchInputRef = useRef(null);
    const editInputRef = useRef(null);

    // Cálculos
    const total = carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
    const itemsTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // --- EFECTOS ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busqueda.length > 2) {
                buscarProductos(busqueda);
            } else {
                setResultados([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [busqueda]);

    useEffect(() => {
        if (itemEditando && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [itemEditando]);

    // --- FUNCIONES ---
    const buscarProductos = async (termino) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/productos?q=${termino}`);
            if (!response.ok) throw new Error('Error en la red');
            const data = await response.json();
            setResultados(data);
            setSelectedIndex(0);
            setServerStatus(true);
        } catch (error) {
            setServerStatus(false);
            setResultados([]); 
        } finally {
            setLoading(false);
        }
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) return;
        mostrarNotificacion('info', 'Procesando venta...');

        try {
            const response = await fetch(`${API_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carrito: carrito,
                    total: total,
                    items_total: itemsTotal
                })
            });

            const data = await response.json();

            if (response.ok) {
                setCarrito([]);
                setResultados([]);
                setBusqueda('');
                mostrarNotificacion('success', `¡Venta #${data.ventaId} Exitosa!`);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            mostrarNotificacion('error', `Error al cobrar: ${error.message}`);
        }
    };

    const mostrarNotificacion = (tipo, msj) => {
        setNotificacion({ show: true, tipo, msj });
        setTimeout(() => setNotificacion({ show: false, tipo: '', msj: '' }), 3000);
    };

    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.id_externo === producto.id_externo);
        if (existe) {
            setCarrito(carrito.map(item => 
                item.id_externo === producto.id_externo 
                ? { ...item, cantidad: item.cantidad + 1 } 
                : item
            ));
        } else {
            setCarrito([...carrito, { 
                ...producto, 
                cantidad: 1, 
                precio_venta: parseFloat(producto.pvp), 
                precio_original: parseFloat(producto.pvp) 
            }]);
        }
    };

    const eliminarDelCarrito = (id) => setCarrito(carrito.filter(item => item.id_externo !== id));

    const saveEdit = () => {
        if (!itemEditando) return;
        const nuevoPrecio = parseFloat(precioEditado);
        const nuevaCantidad = parseInt(cantidadEditada);
        if (isNaN(nuevoPrecio) || isNaN(nuevaCantidad) || nuevaCantidad < 1) {
            alert("Valores inválidos");
            return;
        }
        setCarrito(carrito.map(item => 
            item.id_externo === itemEditando.id_externo
            ? { ...item, precio_venta: nuevoPrecio, cantidad: nuevaCantidad }
            : item
        ));
        setItemEditando(null);
        searchInputRef.current?.focus();
    };

    // --- ATAJOS TECLADO ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (itemEditando) {
                if (e.key === 'Escape') setItemEditando(null);
                if (e.key === 'Enter') saveEdit();
                return;
            }
            if (e.key === 'F1') { e.preventDefault(); setShowHelp(!showHelp); }
            if (e.key === 'F5') { e.preventDefault(); if (carrito.length > 0) procesarVenta(); }
            if (e.key === 'F10') { e.preventDefault(); searchInputRef.current?.focus(); }
            
            if (resultados.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < resultados.length - 1 ? prev + 1 : prev));
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarAlCarrito(resultados[selectedIndex]);
                    setBusqueda('');
                    setResultados([]);
                    searchInputRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [resultados, selectedIndex, showHelp, carrito, itemEditando]);

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
                </div>
                <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${serverStatus ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
                        {serverStatus ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {serverStatus ? 'ONLINE' : 'OFFLINE'}
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

            {/* Contenido Principal */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Izquierda: Buscador */}
                <div className="w-2/3 flex flex-col p-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-600 flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Buscar Producto (F10)</label>
                        <div className="flex items-center gap-2">
                            <Search className="text-blue-600" size={28} />
                            <input ref={searchInputRef} autoFocus type="text" className="w-full text-2xl font-bold text-slate-700 outline-none placeholder:text-slate-300 uppercase" placeholder="Escanear Código o Escribir Nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}/>
                            {loading && <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>}
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
                        <div className="overflow-y-auto flex-1">
                            {resultados.map((prod, index) => (
                                <div key={prod.id_externo || index} onClick={() => { agregarAlCarrito(prod); setBusqueda(''); setResultados([]); searchInputRef.current?.focus(); }} className={`flex items-center p-2 text-sm border-b cursor-pointer select-none ${index === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700'}`}>
                                    <span className="w-20 font-mono text-xs opacity-70 truncate">{prod.codigo_barras || prod.id_externo}</span>
                                    <span className="flex-1 font-bold truncate pr-4">{prod.nombre}</span>
                                    <span className="w-40 text-xs truncate opacity-80">{prod.laboratorio}</span>
                                    <span className={`w-24 text-right font-mono font-bold ${index === selectedIndex ? 'text-white' : 'text-green-700'}`}>$ {parseFloat(prod.pvp).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                                    <span className="w-16 text-center font-bold text-xs">{prod.stock_actual}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Derecha: Ticket */}
                <div className="w-1/3 bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
                    <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-2"><ShoppingCart size={18}/> TICKET ACTUAL</span>
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
                    <div className="bg-slate-50 p-4 border-t border-slate-300">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-slate-500 text-sm font-bold">TOTAL</span>
                            <span className="text-4xl font-black text-slate-800 tracking-tight">$ {total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <button className={`w-full py-4 rounded-lg shadow-lg font-bold text-xl flex justify-center items-center gap-2 transition active:scale-95 text-white ${carrito.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 cursor-not-allowed'}`} onClick={procesarVenta} disabled={carrito.length === 0}><CreditCard size={24} /> COBRAR (F5)</button>
                    </div>
                </div>

                {/* Modal Edición */}
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
            </div>

            {/* Footer */}
            <footer className="bg-slate-300 p-1 flex justify-center gap-2 border-t border-slate-400 text-xs select-none">
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700"><span className="font-bold text-black">F1</span> Ayuda</div>
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700"><span className="font-bold text-black">F5</span> Cobrar</div>
                <div className="bg-white px-3 py-1 rounded border border-slate-400 shadow-sm text-slate-700"><span className="font-bold text-black">F10</span> Buscar</div>
            </footer>
        </div>
    );
};

export default App;