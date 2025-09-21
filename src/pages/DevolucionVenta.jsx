// src/pages/DevolucionVenta.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Grid, Paper, Typography, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, IconButton, Tooltip,
    Box, CircularProgress, Divider, Alert, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ProductSearchInput from '../components/ProductSearchInput';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import '../styles/Ajustes.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const MOTIVO_DEVOLUCION_CHOICES = {
    'EQUIVOCO_PRODUCTO': 'Se equivocó de producto',
    'NO_NECESITA': 'No necesita el producto',
    'PRODUCTO_DEFECTUOSO': 'Producto defectuoso',
};

const DevolucionVenta = () => {
    const { ventaId } = useParams();
    const navigate = useNavigate();
    const { authTokens, userPrivileges } = useAuth();

    const [ventaOriginal, setVentaOriginal] = useState(null);
    const [itemsADevolver, setItemsADevolver] = useState([]);
    const [itemsCambio, setItemsCambio] = useState([]);
    const [motivoGeneral, setMotivoGeneral] = useState('');
    const [tipoReembolso, setTipoReembolso] = useState('AL_CREDITO');
    const [estadoDelCambio, setEstadoDelCambio] = useState('SIN_CAMBIO');
    const [metodoPagoAdicional, setMetodoPagoAdicional] = useState('EFECTIVO');
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchVentaOriginal = useCallback(async () => {
        if (!ventaId) {
            setError("No se especificó un ID de venta.");
            setLoading(false);
            return;
        }
        setLoading(true);
        const token = authTokens?.access;
        if (!token) {
            setError("No autenticado.");
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/devoluciones/venta-original/${ventaId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Error al cargar la venta original.");
            }

            const data = await response.json();
            if (data.devolucion) {
                throw new Error("Esta venta ya tiene una devolución registrada.");
            }
            setVentaOriginal(data);
            setItemsADevolver(data.detalles.map(item => ({ ...item, cantidadADevolver: 0, motivo: 'EQUIVOCO_PRODUCTO' })));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [ventaId, authTokens]);

    useEffect(() => {
        fetchVentaOriginal();
    }, [fetchVentaOriginal]);
    
    const resumen = useMemo(() => {
        const totalDevuelto = itemsADevolver.reduce((sum, item) => sum + (item.cantidadADevolver * parseFloat(item.precio_unitario_venta)), 0);
        const totalCambio = itemsCambio.reduce((sum, item) => sum + item.subtotal, 0);
        const balance = totalCambio - totalDevuelto;
        return { totalDevuelto, totalCambio, balance };
    }, [itemsADevolver, itemsCambio]);

    useEffect(() => {
        if (itemsCambio.length > 0) {
            const esMismoProducto = itemsCambio.length === 1 && itemsADevolver.some(d => d.producto_nombre === itemsCambio[0].nombre && d.cantidadADevolver > 0);
            setEstadoDelCambio(esMismoProducto ? 'MISMO_PRODUCTO' : 'OTRO_PRODUCTO');
        } else {
            setEstadoDelCambio('SIN_CAMBIO');
        }
    }, [itemsCambio, itemsADevolver]);

    const handleItemDevolverChange = (itemOriginalId, field, value) => {
        setItemsADevolver(items => items.map(item => {
            if (item.id === itemOriginalId) {
                const updatedItem = { ...item };
                if (field === 'cantidadADevolver') {
                    const cantidadOriginal = item.cantidad;
                    updatedItem.cantidadADevolver = Math.min(Math.max(0, parseInt(value, 10) || 0), cantidadOriginal);
                } else if (field === 'motivo') {
                    updatedItem.motivo = value;
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleAddProductoCambio = (producto) => {
        if (itemsCambio.some(item => item.producto_id === producto.id)) {
            toast.warning("Este producto ya está en la lista de items de cambio.");
            return;
        }
        const newItem = {
            producto_id: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            precio_unitario_actual: parseFloat(producto.precio_venta),
            subtotal: parseFloat(producto.precio_venta),
            stock_disponible: producto.stock_actual
        };
        setItemsCambio(prev => [...prev, newItem]);
    };

    const handleItemCambioChange = (index, field, value) => {
        const updatedItems = [...itemsCambio];
        const item = updatedItems[index];
        item[field] = value;

        if (field === 'cantidad') {
            const nuevaCantidad = parseInt(value, 10) || 0;
            if (nuevaCantidad > item.stock_disponible) {
                toast.error(`Stock insuficiente para ${item.nombre}. Disponible: ${item.stock_disponible}`);
                item.cantidad = item.stock_disponible;
            } else {
                item.cantidad = nuevaCantidad;
            }
        }
        item.subtotal = (parseInt(item.cantidad, 10) || 0) * (parseFloat(item.precio_unitario_actual) || 0);
        setItemsCambio(updatedItems);
    };
    
    const handleRemoveItemCambio = (index) => {
        setItemsCambio(items => items.filter((_, i) => i !== index));
    };

    const handleConfirmarDevolucion = async () => {
        setActionLoading(true);
        setError('');

        const itemsDevueltosFiltrados = itemsADevolver.filter(item => item.cantidadADevolver > 0);
        if (itemsDevueltosFiltrados.length === 0) {
            toast.error("Debe seleccionar al menos un producto para devolver.");
            setActionLoading(false);
            return;
        }

        const payload = {
            venta_original_id: ventaOriginal.id,
            motivo_general: motivoGeneral,
            estado_del_cambio: estadoDelCambio,
            items_devueltos: itemsDevueltosFiltrados.map(item => ({
                item_venta_original_id: item.id,
                cantidad_a_devolver: item.cantidadADevolver,
                motivo: item.motivo
            })),
            items_cambio: itemsCambio.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario_actual: item.precio_unitario_actual
            })),
        };

        if (resumen.balance < 0) {
            payload.tipo_reembolso = tipoReembolso;
        }

        if (resumen.balance > 0) {
            payload.metodo_pago_adicional = metodoPagoAdicional;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/devoluciones/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens?.access}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errData = await response.json();
                const errorMessage = typeof errData === 'object' ? Object.values(errData).flat().join(' ') : "Ocurrió un error al procesar la devolución.";
                throw new Error(errorMessage);
            }
            toast.success('Devolución registrada con éxito!');
            navigate('/ventas');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando información de la venta...</div>;
    if (error && !ventaOriginal) return <Alert severity="error" onClose={() => navigate('/ventas')} sx={{m: 3}}>{error}</Alert>;
    if (!ventaOriginal) return null;

    return (
        <div className="ajustes-container">
            <div className="ajustes-title-header">
                <div>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Registrar Devolución de Venta #{ventaOriginal.id}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {ventaOriginal.cliente_info}
                    </Typography>
                </div>
                <Button variant="outlined" sx={{ textTransform: "none", alignSelf: 'center' }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/ventas')}>
                    Volver a Ventas
                </Button>
            </div>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }} elevation={2}>
                        <Typography variant="h6">1. Productos a Devolver</Typography>
                        <TableContainer className="ajustes-table-container">
                            <Table size="small">
                                <TableHead><TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="center">Cant. Original</TableCell>
                                    <TableCell align="center">Precio Original</TableCell>
                                    <TableCell align="center">Cant. a Devolver</TableCell>
                                    <TableCell align="center">Motivo Devolución</TableCell>
                                </TableRow></TableHead>
                                <TableBody>
                                    {itemsADevolver.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.producto_nombre}</TableCell>
                                            <TableCell align="center">{item.cantidad}</TableCell>
                                            <TableCell align="center">{formatCurrency(item.precio_unitario_venta)}</TableCell>
                                            <TableCell align="center">
                                                <TextField type="number" size="small"
                                                    value={item.cantidadADevolver}
                                                    onChange={e => handleItemDevolverChange(item.id, 'cantidadADevolver', e.target.value)}
                                                    inputProps={{ min: 0, max: item.cantidad, step: 1 }} sx={{ width: '80px' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <FormControl size="small" fullWidth>
                                                    <Select value={item.motivo} onChange={e => handleItemDevolverChange(item.id, 'motivo', e.target.value)}>
                                                        {Object.entries(MOTIVO_DEVOLUCION_CHOICES).map(([key, value]) => (
                                                            <MenuItem key={key} value={key}>{value}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    <Paper sx={{ p: 2, borderRadius: '12px' }} elevation={2}>
                        <Typography variant="h6">2. Productos de Cambio (Opcional)</Typography>
                        <ProductSearchInput onProductSelect={handleAddProductoCambio} label="Buscar producto para cambio..." />
                        {itemsCambio.length > 0 && (
                            <TableContainer sx={{mt: 2}} className="ajustes-table-container">
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="center">Cantidad</TableCell><TableCell align="center">Precio Unit.</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {itemsCambio.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.nombre}</TableCell>
                                                <TableCell align="center"><TextField type="number" size="small" value={item.cantidad} onChange={e => handleItemCambioChange(index, 'cantidad', e.target.value)} sx={{width: '80px'}} /></TableCell>
                                                <TableCell align="center">{formatCurrency(item.precio_unitario_actual)}</TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Eliminar"><IconButton onClick={() => handleRemoveItemCambio(index)} color="error"><DeleteIcon /></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper className="summary-paper" elevation={2}>
                        <Typography variant="h5" className="summary-title">Resumen de la Devolución</Typography>
                        <Box sx={{mt: 2}}>
                            <Box className="summary-row">
                                <Typography color="text.secondary">Total Devolución (Crédito):</Typography>
                                <Typography color="green">{formatCurrency(resumen.totalDevuelto)}</Typography>
                            </Box>
                            <Box className="summary-row">
                                <Typography color="text.secondary">Total Productos Cambio (Débito):</Typography>
                                <Typography color="red">{formatCurrency(resumen.totalCambio)}</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box className="summary-row summary-row-total">
                                <Typography variant="h6">Balance Final:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: resumen.balance >= 0 ? 'error.main' : 'success.main' }}>
                                    {formatCurrency(resumen.balance)}
                                </Typography>
                            </Box>
                        </Box>
                        
                        {resumen.balance < 0 && (
                            <Box mt={2}>
                                <FormControl fullWidth>
                                    <InputLabel id="reembolso-label">Gestionar Saldo a Favor</InputLabel>
                                    <Select 
                                        labelId="reembolso-label" 
                                        value={tipoReembolso} 
                                        label="Gestionar Saldo a Favor" 
                                        onChange={(e) => setTipoReembolso(e.target.value)}
                                    >
                                        <MenuItem value="AL_CREDITO">Abonar a Crédito del Cliente</MenuItem>
                                        <MenuItem value="EFECTIVO">Reembolsar en Efectivo</MenuItem>
                                    </Select>
                                    <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>
                                        Seleccione cómo proceder con los {formatCurrency(Math.abs(resumen.balance))} a favor del cliente.
                                    </Typography>
                                </FormControl>
                            </Box>
                        )}

                        {resumen.balance > 0 && (
                            <Box mt={2}>
                                <FormControl fullWidth>
                                    <InputLabel id="pago-adicional-label">Forma de Pago del Cliente</InputLabel>
                                    <Select 
                                        labelId="pago-adicional-label" 
                                        value={metodoPagoAdicional} 
                                        label="Forma de Pago del Cliente" 
                                        onChange={(e) => setMetodoPagoAdicional(e.target.value)}
                                    >
                                        <MenuItem value="CREDITO">Usar Crédito Disponible</MenuItem>
                                        <MenuItem value="EFECTIVO">Pago en Efectivo</MenuItem>
                                        <MenuItem value="TRANSFERENCIA">Pago por Transferencia</MenuItem>
                                    </Select>
                                    <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>
                                        El cliente debe pagar {formatCurrency(resumen.balance)}. Seleccione el método.
                                    </Typography>
                                </FormControl>
                            </Box>
                        )}

                        <TextField label="Motivo General de la Devolución" multiline rows={3} fullWidth value={motivoGeneral} onChange={e => setMotivoGeneral(e.target.value)} sx={{ my: 2 }} />
                        <Button 
                            fullWidth 
                            variant="contained" 
                            sx={{ textTransform: "none"}} 
                            color="primary" size="large" 
                            startIcon={<SaveIcon />} 
                            onClick={handleConfirmarDevolucion} 
                            disabled={actionLoading || (resumen.totalDevuelto === 0) || !userPrivileges.includes('ventas_devolucion')}
                        >
                            {actionLoading ? <CircularProgress size={24} /> : 'Confirmar Devolución'}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
};

export default DevolucionVenta;