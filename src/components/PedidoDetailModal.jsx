// src/components/PedidoDetailModal.jsx

import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, InputAdornment, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, CircularProgress, Alert, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl,
    InputLabel, Select, MenuItem, Divider, Grid, Link
} from "@mui/material";
import { 
    Close as CloseIcon, Person, Email, Phone, CreditCard, ReceiptLong, Info as InfoIcon,
    LocalShipping, Store 
} from "@mui/icons-material";
import RoomIcon from "@mui/icons-material/Room";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const formatFecha = (fechaISO) => new Date(fechaISO).toLocaleString("es-CO", { dateStyle: 'long', timeStyle: 'short' });

const getStatusChipColor = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'entregado': return 'success';
        case 'en_camino': return 'info';
        case 'confirmado': return 'primary';
        case 'cancelado': return 'error';
        case 'cancelado_por_inactividad': return 'error';
        case 'pago_incompleto': return 'secondary';
        case 'en_verificacion': 
        case 'pendiente_pago_temporal':
        case 'pendiente_pago':
        default: return 'warning';
    }
};

const getStatusDisplayText = (estado) => {
    switch(estado) {
        case 'pendiente_pago_temporal': return 'Pendiente de Pago (1h)';
        case 'cancelado_por_inactividad': return 'Cancelado por Inactividad';
        case 'pendiente_pago': return 'Pendiente de Pago';
        case 'en_verificacion': return 'En Verificación de Pago';
        case 'pago_incompleto': return 'Pago Incompleto';
        case 'confirmado': return 'Confirmado y en Preparación';
        case 'en_camino': return 'En Camino';
        case 'entregado': return 'Entregado';
        case 'cancelado': return 'Cancelado';
        default: return 'Desconocido';
    }
};

const ESTADO_CHOICES = {
    'pendiente_pago': 'Pendiente de Pago',
    'pendiente_pago_temporal': 'Pendiente de Pago (1h)',
    'en_verificacion': 'En Verificación de Pago',
    'pago_incompleto': 'Pago Incompleto',
    'confirmado': 'Confirmado y en Preparación',
    'en_camino': 'En Camino',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado',
    'cancelado_por_inactividad': 'Cancelado por Inactividad',
};

const TRANSICIONES_VALIDAS = {
    'pendiente_pago': ['en_verificacion', 'cancelado'],
    'pendiente_pago_temporal': ['en_verificacion', 'cancelado'],
    'en_verificacion': ['pago_incompleto', 'confirmado', 'cancelado'],
    'pago_incompleto': ['en_verificacion', 'confirmado', 'cancelado'],
    'confirmado': ['en_camino'],
    'en_camino': ['entregado', 'cancelado'],
    'entregado': [],
    'cancelado': [],
    'cancelado_por_inactividad': [],
};

export default function PedidoDetailModal({ open, onClose, pedido, onUpdate }) {
    const { authTokens } = useAuth();
    
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [motivoCancelacion, setMotivoCancelacion] = useState('');
    const [montoVerificado, setMontoVerificado] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (pedido) {
            setNuevoEstado(pedido.estado);
            setMotivoCancelacion(pedido.motivo_cancelacion || '');
            setMontoVerificado(pedido.monto_pagado_verificado || '0');
        }
    }, [pedido]);

    const getOpcionesEstado = () => {
        const estadoActual = pedido.estado;
        let transiciones = TRANSICIONES_VALIDAS[estadoActual] || [];

        if (estadoActual === 'confirmado' && pedido.metodo_entrega === 'tienda') {
            transiciones = ['entregado'];
        }

        const opciones = [
        { key: estadoActual, value: ESTADO_CHOICES[estadoActual] },
        ...transiciones.map(key => ({
            key,
            value: ESTADO_CHOICES[key]
        }))
    ];

        if (!['cancelado', 'cancelado_por_inactividad', 'entregado'].includes(estadoActual) && !opciones.some(o => o.key === 'cancelado')) {
             opciones.push({ key: 'cancelado', value: ESTADO_CHOICES['cancelado'] });
        }
        
        return opciones;
    };

    const handleGuardarCambios = async () => {
        setIsSubmitting(true);
        const token = authTokens?.access;
        const body = { estado: nuevoEstado };
        let hasError = false;

        if (nuevoEstado === 'cancelado' && !motivoCancelacion.trim()) {
            toast.error("Debes especificar un motivo para la cancelación.");
            hasError = true;
        } else if (nuevoEstado === 'pago_incompleto' && (!montoVerificado || parseFloat(montoVerificado) <= 0)) {
            toast.error("Debes ingresar un monto verificado válido.");
            hasError = true;
        }

        if (hasError) {
            setIsSubmitting(false);
            return;
        }
        
        if (nuevoEstado === 'cancelado') body.motivo_cancelacion = motivoCancelacion;
        if (nuevoEstado === 'pago_incompleto') body.monto_pagado_verificado = montoVerificado;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/pedidos/${pedido.id}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al actualizar el estado.");
            }
            toast.success("Pedido actualizado con éxito.");
            onUpdate(); 
            onClose();
        } catch (err) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!pedido) return null;

    const opcionesEstado = getOpcionesEstado();
    const esEstadoFinal = ['entregado', 'cancelado', 'cancelado_por_inactividad'].includes(pedido.estado);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="venta-dialog">
            <DialogTitle className="venta-dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <InfoIcon sx={{verticalAlign: 'middle', mr: 1}}/>Detalle del Pedido #{pedido.id}
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Información</Typography>
                            <Box display="flex" alignItems="center" mb={1}><Person color="action" sx={{ mr: 1 }} /> <Typography><b>Recibe:</b> {pedido.nombre_receptor}</Typography></Box>
                            <Box display="flex" alignItems="center" mb={1}><Email color="action" sx={{ mr: 1 }} /> <Typography><b>Email:</b> {pedido.cliente?.correo || pedido.email_invitado}</Typography></Box>
                            <Box display="flex" alignItems="center" mb={2}><Phone color="action" sx={{ mr: 1 }} /> <Typography><b>Teléfono:</b> {pedido.telefono_receptor}</Typography></Box>
                            <Divider sx={{ my: 2 }} />
                            <Box display="flex" alignItems="center" mb={1}>
                                {pedido.metodo_entrega === 'domicilio' ? <LocalShipping color="action" sx={{ mr: 1 }} /> : <Store color="action" sx={{ mr: 1 }} />}
                                <Typography><b>Método:</b> {pedido.metodo_entrega === 'domicilio' ? 'Domicilio' : 'Reclama en Tienda'}</Typography>
                            </Box>
                            {pedido.metodo_entrega === 'domicilio' && (
                                <Box display="flex" alignItems="center"><RoomIcon  color="action" sx={{ mr: 1 }} /> <Typography><b>Dirección:</b> {pedido.direccion_entrega}</Typography></Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Typography variant="h6" gutterBottom>Artículos del Pedido</Typography>
                        <TableContainer component={Paper} variant="outlined" className="ttt">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">Producto</TableCell>
                                        <TableCell align="center">Cantidad</TableCell>
                                        <TableCell align="center">P.Unitario</TableCell>
                                        <TableCell align="center">Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pedido.detalles?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell align="center">{item.producto.nombre}</TableCell>
                                            <TableCell align="center">{item.cantidad}</TableCell>
                                            <TableCell align="center">{formatCurrency(item.precio_unitario)}</TableCell>
                                            <TableCell align="center">{formatCurrency(item.subtotal)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                         <Grid container spacing={2} sx={{ mt: 2 }} justifyContent="flex-end">
                            <Grid item xs={6} md={4}>
                                <Typography variant="body1" align="right">Subtotal:</Typography>
                                <Typography variant="body1" align="right">IVA (19%):</Typography>
                                <Typography variant="h6" align="right">Total:</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                                <Typography variant="body1" align="right">{formatCurrency(pedido.subtotal)}</Typography>
                                <Typography variant="body1" align="right">{formatCurrency(pedido.iva)}</Typography>
                                <Typography variant="h6" align="right">{formatCurrency(pedido.total)}</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Información de Pago</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {pedido.fue_pagado_con_credito ? (
                            <Alert severity="success" icon={<CreditCard fontSize="inherit" />}>
                                Este pedido fue cubierto en su totalidad ({formatCurrency(pedido.monto_usado_credito)}) utilizando el crédito del cliente.
                            </Alert>
                        ) : (
                            pedido.comprobantes && pedido.comprobantes.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {pedido.comprobantes.map(comp => (
                                        <Link href={comp.imagen} target="_blank" rel="noopener noreferrer" key={comp.id}>
                                            <img src={comp.imagen} alt="Comprobante" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                        </Link>
                                    ))}
                                </Box>
                            ) : (
                                <Typography color="text.secondary">No se han subido comprobantes para este pedido.</Typography>
                            )
                        )}
                    </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }}><Chip label="Acciones de Administrador" /></Divider>

                <Paper sx={{ p: 2, backgroundColor: '#f7f9fc' }} variant="outlined">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth disabled={esEstadoFinal}>
                                <InputLabel>Cambiar Estado</InputLabel>
                                <Select value={nuevoEstado} label="Cambiar Estado" onChange={(e) => setNuevoEstado(e.target.value)}>
                                    {opcionesEstado.map((opcion) => (
                                        <MenuItem key={opcion.key} value={opcion.key}>
                                            {opcion.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            {nuevoEstado === 'pago_incompleto' && (
                                <TextField fullWidth label="Monto Verificado" type="number" value={montoVerificado} onChange={(e) => setMontoVerificado(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                            )}
                            {nuevoEstado === 'cancelado' && (
                                <TextField fullWidth label="Motivo de Cancelación" value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)} />
                            )}
                            {esEstadoFinal && (
                                <Alert severity="info">Este pedido se encuentra en un estado final y no puede ser modificado.</Alert>
                            )}
                        </Grid>
                    </Grid>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{textTransform: 'none'}}  disabled={isSubmitting}>Cerrar</Button>
                <Button onClick={handleGuardarCambios} sx={{textTransform: 'none'}} color="primary" variant="contained" disabled={isSubmitting || nuevoEstado === pedido.estado || esEstadoFinal}>
                    {isSubmitting ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}