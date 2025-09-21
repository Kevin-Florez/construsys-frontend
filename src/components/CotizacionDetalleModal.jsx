// src/components/CotizacionDetalleModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { formatCurrency, formatFecha } from '../utils/formatters';
import { Loader2, ArrowLeft, ShoppingCart, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    CircularProgress, Box, Typography, Grid, IconButton, Tooltip
} from "@mui/material";
import { Close as CloseIcon, ShoppingCartCheckout, Info as InfoIcon } from '@mui/icons-material';
import '../styles/DetalleCotizacion.css'; // Usaremos el CSS para la estética interna del modal
import Alert from '@mui/material/Alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const getStatusInfo = (status) => {
    switch (status) {
        case 'vigente': return { icon: <CheckCircle />, text: 'Vigente', color: '#16a34a' };
        case 'vencida': return { icon: <XCircle />, text: 'Vencida', color: '#dc2626' };
        case 'convertida': return { icon: <ShoppingCart />, text: 'Convertida en Pedido', color: '#2563eb' };
        default: return { icon: <FileText />, text: status, color: '#475569' };
    }
};

export default function CotizacionDetalleModal({ open, onClose, cotizacionToken, onConvertSuccess }) {
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [cotizacion, setCotizacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConverting, setIsConverting] = useState(false);

    const fetchCotizacion = useCallback(async () => {
        if (!cotizacionToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/ver/${cotizacionToken}/`);
            if (!response.ok) {
                throw new Error('No se encontró la cotización o ha expirado el enlace.');
            }
            const data = await response.json();
            if (data.is_expired && data.estado === 'vigente') {
                data.estado = 'vencida';
            }
            setCotizacion(data);
        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [cotizacionToken]);

    useEffect(() => {
        fetchCotizacion();
    }, [fetchCotizacion]);
    
    const handleConvertToOrder = async () => {
        setIsConverting(true);
        toast.info("Convirtiendo cotización en un pedido...");

        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/convertir/${cotizacionToken}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const responseData = await response.json();
            if (!response.ok) {
                const errorMsg = responseData.detail || Object.values(responseData).flat().join(' ');
                throw new Error(errorMsg || "Hubo un error al procesar la cotización.");
            }
            clearCart();
            toast.success("¡Cotización convertida en pedido con éxito!");
            
            // Llama a la función de callback para actualizar la lista de cotizaciones
            if (onConvertSuccess) onConvertSuccess();
            onClose(); // Cierra el modal
            navigate(`/pedido/ver/${responseData.pedido_token_seguimiento}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsConverting(false);
        }
    };

    const statusInfo = cotizacion ? getStatusInfo(cotizacion.estado) : {};

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="coti-dialog">
            <DialogTitle sx={{ m: 0, p: 2 }} className="dialog-title">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        <InfoIcon sx={{verticalAlign:'middle', mr:1}}/>Detalle de la Cotización #{cotizacion?.id}
                    </Typography>
                    <IconButton aria-label="close" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /><span>Cargando...</span></Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    cotizacion && (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Información General</Typography>
                                <Box className="info-card">
                                    <Box className="info-item">
                                        <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                                        <Typography variant="body1">{cotizacion.cliente ? `${cotizacion.cliente.nombre} ${cotizacion.cliente.apellido}` : cotizacion.nombre_invitado}</Typography>
                                    </Box>
                                    <Box className="info-item">
                                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                                        <Typography variant="body1">{cotizacion.cliente ? cotizacion.cliente.correo : cotizacion.email_invitado}</Typography>
                                    </Box>
                                    <Box className="info-item">
                                        <Typography variant="body2" color="text.secondary">Fecha Creación:</Typography>
                                        <Typography variant="body1">{formatFecha(cotizacion.fecha_creacion)}</Typography>
                                    </Box>
                                    <Box className="info-item">
                                        <Typography variant="body2" color="text.secondary">Válida hasta:</Typography>
                                        <Typography variant="body1">{formatFecha(cotizacion.fecha_vencimiento)}</Typography>
                                    </Box>
                                    <Box className="status-item" sx={{ color: statusInfo.color }}>
                                        {statusInfo.icon}
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{statusInfo.text}</Typography>
                                    </Box>
                                </Box>
                                
                                {cotizacion.estado === 'vigente' && (
                                     <Button
                                         variant="contained"
                                         startIcon={isConverting ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartCheckout />}
                                         sx={{ mt: 3, textTransform: 'none' }}
                                         onClick={handleConvertToOrder}
                                         disabled={isConverting}
                                         fullWidth
                                     >
                                        Hacer Pedido
                                     </Button>
                                )}
                                {cotizacion.estado === 'vencida' && <Alert severity="error" sx={{ mt: 2 }}>Esta cotización ha vencido.</Alert>}
                                {cotizacion.estado === 'convertida' && <Alert severity="info" sx={{ mt: 2 }}>Esta cotización ya fue convertida en un pedido.</Alert>}
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ alignSelf: "flex-start" }}>
  <Typography variant="h6" sx={{ mb: 2 }}>Productos Cotizados</Typography>
  <Box className="productos-card" sx={{ p: 2 }}>
                                    {cotizacion.detalles.map(item => (
                                        <Box key={item.id} className="producto-item">
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.producto_nombre_historico} (x{item.cantidad})</Typography>
                                            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                                                <Typography variant="body2" color="text.secondary">P. Unit: {formatCurrency(item.precio_unitario_cotizado)}</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formatCurrency(item.subtotal)}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                    <Box className="total-summary" sx={{ mt: 2 }}>
                                        <Typography variant="body1">Subtotal:</Typography>
                                        <Typography variant="body1">{formatCurrency(cotizacion.subtotal)}</Typography>
                                        <Typography variant="body1">IVA (19%):</Typography>
                                        <Typography variant="body1">{formatCurrency(cotizacion.iva)}</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total Cotizado:</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{formatCurrency(cotizacion.total)}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
}