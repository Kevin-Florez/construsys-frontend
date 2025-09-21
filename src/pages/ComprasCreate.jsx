import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Grid, Paper, Typography, TextField, Button, IconButton, 
    Tooltip, Autocomplete, Box, CircularProgress, InputAdornment, 
    Divider 
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProductSearchInput from '../components/ProductSearchInput';
import SummaryCard from '../components/SummaryCard';
import { useAuth } from '../context/AuthContext';
import '../styles/Compras.css';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const formatCurrency = (value, decimals = 0) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

const ComprasCreate = () => {
    const navigate = useNavigate();
    const { authTokens } = useAuth();

    const [proveedor, setProveedor] = useState(null);
    const [proveedores, setProveedores] = useState([]);
    // ✨ Nuevo estado para el número de factura
    const [numeroFactura, setNumeroFactura] = useState('');
    // Renombramos 'fecha' a 'fechaCompra' para claridad
    const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    // ... (resto de estados sin cambios)
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }, [items]);
    
    const fetchProveedores = useCallback(async () => {
        setLoading(true);
        const token = authTokens?.access;
        if (!token) {
            toast.error("Sesión no válida.");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/proveedores/?estado=Activo`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('No se pudieron cargar los proveedores.');
            const data = await res.json();
            setProveedores(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => {
        if (authTokens) {
            fetchProveedores();
        }
    }, [authTokens, fetchProveedores]);

    const handleAddProduct = (product) => {
        if (items.some(item => item.id === product.id)) {
            toast.warning("Este producto ya está en la lista.");
            return;
        }
        
        // --- INICIO DE CAMBIOS ---
        // Se establecen valores iniciales basados en los datos del producto
        const costoInicial = parseFloat(product.ultimo_costo_compra) || 0;
        const margenInicial = parseFloat(product.ultimo_margen_aplicado) || 0;
        
        let precioVentaInicial = parseFloat(product.precio_venta) || 0;
        // Si hay costo y margen, se recalcula el precio para asegurar consistencia
        if (costoInicial > 0 && margenInicial > 0) {
            precioVentaInicial = costoInicial * (1 + (margenInicial / 100));
        }

        const newItem = {
            id: product.id,
            nombre: product.nombre,
            marca: product.marca,
            cantidad: 1,
            costo_unitario: costoInicial.toFixed(2),
            margen: margenInicial > 0 ? margenInicial.toString() : '', // El margen se autocompleta aquí
            nuevo_precio_venta: precioVentaInicial,
            subtotal: costoInicial,
        };
        // --- FIN DE CAMBIOS ---
        setItems(prev => [...prev, newItem]);
    };
    
    const handleItemChange = (index, field, value) => {
        const updatedItems = items.map((item, i) => {
            if (i === index) {
                const newItem = { ...item, [field]: value };
                const cantidad = parseInt(newItem.cantidad, 10) || 0;
                const costo = parseFloat(newItem.costo_unitario) || 0;
                
                newItem.subtotal = cantidad * costo;
                
                // --- INICIO DE CAMBIOS ---
                // La lógica de cálculo del precio de venta se mantiene
                if (field === 'costo_unitario' || field === 'margen') {
                    const margen = parseFloat(newItem.margen) || 0;
                    if (costo > 0 && margen >= 0) {
                        newItem.nuevo_precio_venta = costo * (1 + (margen / 100));
                    } else {
                        // Si no hay margen o costo, el precio de venta es 0
                        newItem.nuevo_precio_venta = 0;
                    }
                }
                // --- FIN DE CAMBIOS ---
                return newItem;
            }
            return item;
        });
        setItems(updatedItems);
    };

    const handleRemoveItem = (indexToRemove) => setItems(items.filter((_, i) => i !== indexToRemove));

    const handleSaveCompra = async () => {
        // ✨ Añadimos validación para el número de factura
        if (!proveedor || items.length === 0 || !numeroFactura.trim()) {
            toast.error("Debe seleccionar un proveedor, agregar productos y digitar el número de factura.");
            return;
        }
        setSaving(true);
        const payload = {
            proveedor: proveedor.id,
            // ✨ Enviamos el número de factura
            numero_factura: numeroFactura.trim(),
            // ✨ Enviamos la fecha de compra
            fecha_compra: fechaCompra,
            estado: 'confirmada',
            items: items.map(item => ({
                producto: item.id,
                cantidad: parseInt(item.cantidad, 10),
                costo_unitario: parseFloat(item.costo_unitario).toFixed(2),
                ...(parseFloat(item.margen) >= 0 && { margen_aplicado: parseFloat(item.margen).toFixed(2) }),
                ...(item.nuevo_precio_venta > 0 && { nuevo_precio_venta: parseFloat(item.nuevo_precio_venta).toFixed(2) })
            })),
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/compras/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens?.access}` },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(Object.values(errorData).join(' '));
            }
            toast.success("Compra registrada y confirmada exitosamente.");
            navigate('/compras');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };
    
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="compras-container">
            <Box className="compras-title-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Registrar Nueva Compra</h1>
                <Button variant="outlined" sx={{ textTransform: 'none' }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/compras')}>
                    Volver a la Lista
                </Button>
            </Box>

            {loading ? <div className="loading-indicator"><CircularProgress /></div> : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2, borderRadius: '12px' }} elevation={2}>
                        <Typography variant="h6" gutterBottom>Información de la Compra</Typography>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                                <TextField 
                                    label="Número de Factura del Proveedor"
                                    value={numeroFactura} 
                                    onChange={(e) => setNumeroFactura(e.target.value)} 
                                    fullWidth
                                    required
                                    
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Autocomplete 
                                    options={proveedores} 
                                    getOptionDisabled={(option) => option.estado === 'Inactivo'}
                                    getOptionLabel={(option) => `${option.nombre} ${option.estado === 'Inactivo' ? '(Inactivo)' : ''}`} 
                                    value={proveedor} 
                                    onChange={(e, val) => setProveedor(val)} 
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => <TextField {...params} label="Proveedor" required />} 
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
  <TextField 
    label="Fecha de Compra (en factura)"
    type="date"
    value={fechaCompra} 
    onChange={(e) => setFechaCompra(e.target.value)} 
    fullWidth
    InputLabelProps={{ shrink: true }}
    required
    inputProps={{
      max: new Date().toISOString().split("T")[0] // 👉 restringe a hoy como máximo
    }}
  />
</Grid>

                        </Grid>
                        <ProductSearchInput onProductSelect={handleAddProduct} label="Buscar y agregar producto a la compra..." />
                        
                        <Box sx={{ mt: 2, maxHeight: 'calc(100vh - 450px)', overflowY: 'auto', p:1 }}>
                            {items.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', border: '2px dashed #ccc', borderRadius: '8px', color: '#888' }}>
                                    <Typography>Agregue productos a la compra</Typography>
                                </Box>
                            ) : (
                                items.map((item, index) => (
                                    <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '8px' }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={6} md={12}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="bold">{item.nombre}</Typography>
                                                        <Typography variant="body2" color="text.secondary">{item.marca?.nombre || 'Sin marca'}</Typography>
                                                    </Box>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Grid>
                                            
                                            <Grid item xs={12}><Divider /></Grid>

                                            <Grid item xs={6} sm={3} md={3}>
                                                <TextField label="Cantidad" type="number" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} size="small" fullWidth InputProps={{ inputProps: { min: 1 } }} />
                                            </Grid>
                                            <Grid item xs={6} sm={3} md={3}>
                                                <TextField label="Costo Unitario" type="number" value={item.costo_unitario} onChange={(e) => handleItemChange(index, 'costo_unitario', e.target.value)} size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                                            </Grid>
                                            <Grid item xs={6} sm={3} md={3}>
                                                <TextField label="Margen %" type="number" value={item.margen} onChange={(e) => handleItemChange(index, 'margen', e.target.value)} size="small" fullWidth InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                                            </Grid>
                                            <Grid item xs={6} sm={3} md={3}>
                                                <Box sx={{ p: 1, textAlign: 'center', border: '1px solid #ddd', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Typography variant="caption" color="text.secondary">Nuevo P. Venta</Typography>
                                                    <Typography fontWeight="bold">{formatCurrency(item.nuevo_precio_venta, 0)}</Typography>
                                                </Box>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Box sx={{ mt: 1, p: 1.5, textAlign: 'right', backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                                    <Typography variant="body2" component="span" color="text.secondary">Subtotal del Producto: </Typography>
                                                    <Typography variant="body1" component="span" fontWeight="bold">{formatCurrency(item.subtotal)}</Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SummaryCard title="Resumen de Compra" subtotal={totals.subtotal} iva={totals.iva} total={totals.total}>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveCompra} disabled={saving || !proveedor || items.length === 0 || !numeroFactura.trim()} fullWidth sx={{ mt: 2, textTransform: 'none', fontSize: '1rem' }} >
                            {saving ? <CircularProgress size={24} color="inherit" /> : "Guardar y Confirmar Compra"}
                        </Button>
                    </SummaryCard>
                </Grid>
            </Grid>
            )}
        </div>
    );
};

export default ComprasCreate;