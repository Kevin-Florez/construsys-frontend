// src/components/PedidoDetalleModal.jsx

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Typography, Grid, Box, Chip, Divider, List, ListItem,
    ListItemText, ListItemAvatar, Avatar, useTheme, Alert, Button, Link, CircularProgress,
    InputAdornment, TextField
} from '@mui/material';
import {
    Close as CloseIcon, CalendarToday, LocalShipping, Person, Phone,
    Home, Storefront, CreditCard, AttachMoney, Info as InfoIcon, UploadFile,
    Delete as DeleteIcon, Email as EmailIcon
} from '@mui/icons-material';
import {DollarSign} from 'lucide-react';
import { formatCurrency, formatNumeroPedido, formatFecha } from '../utils/formatters';
import { toast } from 'sonner';
import '../styles/PedidoDetalleModal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const InfoLine = ({ icon, primary, secondary }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        {icon}
        <Box ml={2}>
            <Typography variant="body2" color="text.secondary">{primary}</Typography>
            <Typography variant="body1" fontWeight={500}>{secondary}</Typography>
        </Box>
    </Box>
);

export default function PedidoDetalleModal({ pedido, open, onClose, onUpdate }) {
    const theme = useTheme();
    const [nuevosComprobantes, setNuevosComprobantes] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    if (!pedido) {
        return null;
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith("image/"));
        
        if (imageFiles.length !== files.length) {
            toast.error("Algunos archivos no eran imágenes válidas y fueron omitidos.");
        }

        setNuevosComprobantes(prev => [...prev, ...imageFiles]);
        
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };
    
    const handleRemovePreview = (indexToRemove) => {
        URL.revokeObjectURL(previews[indexToRemove]);
        setNuevosComprobantes(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleUploadAdicional = async () => {
        if (nuevosComprobantes.length === 0) {
            toast.error("Debes seleccionar al menos un archivo para subir.");
            return;
        }
        setIsUploading(true);

        const uploadPromises = nuevosComprobantes.map(file => {
            const formData = new FormData();
            formData.append('imagen', file);
            return fetch(`${API_BASE_URL}/pedidos/ver/${pedido.token_seguimiento}/agregar-comprobante/`, {
                method: 'POST',
                body: formData,
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            });
        });

        // ✅ USAMOS Promise.allSettled PARA REVISAR CADA RESULTADO
        const results = await Promise.allSettled(uploadPromises);

        const exitosos = results.filter(res => res.status === 'fulfilled');
        const fallidos = results.filter(res => res.status === 'rejected');

        // Mostramos un mensaje de error si algún archivo falló
        if (fallidos.length > 0) {
            toast.error(`${fallidos.length} de ${nuevosComprobantes.length} comprobantes no se pudieron subir.`);
        }

        // Mostramos un mensaje de éxito si algún archivo se subió bien
        if (exitosos.length > 0) {
            toast.success(`¡${exitosos.length} comprobante(s) subido(s) con éxito! Lo revisaremos pronto.`);
            
            // Limpiamos y actualizamos la vista solo si hubo éxito
            setNuevosComprobantes([]);
            setPreviews([]);
            onClose();
            onUpdate();
        }

        setIsUploading(false);
    };
    
     const getEstadoInfo = (estado) => {
        const estadoNormalizado = String(estado).toLowerCase();
        switch (estadoNormalizado) {
            case 'entregado': return { color: 'success', texto: 'Tu pedido ha sido entregado.' };
            case 'en_camino': return { color: 'info', texto: 'Tu pedido ya va en camino a la dirección de entrega.' };
            case 'confirmado': return { color: 'primary', texto: 'Hemos confirmado tu pago y estamos preparando tu pedido.' };
            case 'cancelado': return { color: 'error', texto: 'Este pedido ha sido cancelado.' };
            case 'pago_incompleto': return { color: 'secondary', texto: 'Revisamos tu pago y parece estar incompleto. Por favor, sube el comprobante restante.' };
            case 'pendiente_pago_temporal': return { color: 'warning', texto: 'Tu pedido está esperando el comprobante. Tienes 1 hora para subirlo.' };
            case 'en_verificacion': default: return { color: 'warning', texto: 'Recibimos tu comprobante y lo estamos verificando. Te notificaremos pronto.' };
        }
    };

    const { color: colorEstado, texto: textoEstado } = getEstadoInfo(pedido.estado);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ background: "linear-gradient(to right, #e0f2fe, #bfdbfe)", color: "#1e40af", p: "16px 24px", fontWeight: 600, borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    Detalles del Pedido: {formatNumeroPedido(pedido.id)}
                </Box>
                <IconButton aria-label="close" onClick={onClose} sx={{ color: "#000" }}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ backgroundColor: '#f8fafc' }}>
                <Alert severity={colorEstado} sx={{ mb: 2 }}>{textoEstado}</Alert>
                
                {pedido.estado === 'pago_incompleto' && (
  <Alert severity="error" sx={{ mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <DollarSign size={20} style={{ marginRight: "8px" }} />
      <span>
        Hemos recibido <strong>{formatCurrency(pedido.monto_pagado_verificado)}</strong>.{" "}
        Te falta por pagar{" "}
        <strong>{formatCurrency(pedido.total - pedido.monto_pagado_verificado)}</strong>.
      </span>
    </Box>
  </Alert>
)}

                {pedido.estado === 'cancelado' && pedido.motivo_cancelacion && (
                    <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
                        <strong>Motivo de cancelación:</strong> {pedido.motivo_cancelacion}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Información de Entrega</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <InfoLine icon={<Person color="action" />} primary="Recibe" secondary={pedido.nombre_receptor} />
                        <InfoLine icon={<Phone color="action" />} primary="Teléfono" secondary={pedido.telefono_receptor} />
                        {pedido.metodo_entrega === 'domicilio' ? (
                            <InfoLine icon={<Home color="action" />} primary="Dirección" secondary={pedido.direccion_entrega} />
                        ) : (
                            <InfoLine icon={<Storefront color="action" />} primary="Método" secondary="Reclama en Tienda" />
                        )}
                        <Divider sx={{ my: 2 }} />
                        {/* ✨ CORRECCIÓN: Muestra el correo del cliente si está logueado */}
                        <InfoLine 
                            icon={<EmailIcon color="action" />} 
                            primary="Email de Contacto" 
                            secondary={pedido.cliente?.correo || pedido.email_invitado} 
                        />
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Artículos del Pedido</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <List disablePadding>
                            {pedido.detalles.map((item) => (
                                <ListItem key={item.id} divider>
                                    <ListItemAvatar>
                                        <Avatar variant="rounded" src={item.producto.imagen_url || '/placeholder.svg'} alt={item.producto.nombre} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography variant="body1" fontWeight={500}>{item.producto.nombre}</Typography>}
                                        secondary={`Cantidad: ${item.cantidad} - Precio Unit: ${formatCurrency(item.precio_unitario)}`}
                                    />
                                    <Typography variant="body1" fontWeight={500}>{formatCurrency(item.subtotal)}</Typography>
                                </ListItem>
                            ))}
                        </List>
                        <Grid container spacing={2} sx={{ mt: 2 }} justifyContent="flex-end">
                            <Grid item xs={6} md={4}>
                                <Typography variant="body1" align="right">Subtotal:</Typography>
                                <Typography variant="body1" align="right">IVA (19%):</Typography>
                                {pedido.monto_usado_credito > 0 && <Typography variant="body1" align="right">Crédito Usado:</Typography>}
                                <Typography variant="h6" align="right">Total:</Typography>
                            </Grid>
                            <Grid item xs={6} md={4}>
                                <Typography variant="body1" align="right">{formatCurrency(pedido.subtotal)}</Typography>
                                <Typography variant="body1" align="right">{formatCurrency(pedido.iva)}</Typography>
                                {pedido.monto_usado_credito > 0 && <Typography variant="body1" align="right">- {formatCurrency(pedido.monto_usado_credito)}</Typography>}
                                <Typography variant="h6" align="right">{formatCurrency(pedido.total)}</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                {['pago_incompleto', 'pendiente_pago', 'pendiente_pago_temporal'].includes(pedido.estado) && (
                    <Box sx={{ p: 2, border: `1px solid ${theme.palette.warning.main}`, borderRadius: 2, backgroundColor: '#fffbe6', mb: 2 }}>
                        <Typography variant="h6" gutterBottom color="warning.dark">Acción Requerida</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                           {pedido.estado === 'pago_incompleto' 
                               ? "Para continuar con tu pedido, por favor sube el comprobante de pago restante."
                               : "Para procesar tu pedido, por favor sube tu comprobante de pago."}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {previews.map((src, index) => (
                                <Box key={index} sx={{ position: 'relative', width: '80px', height: '80px' }}>
                                    <img src={src} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                    <IconButton onClick={() => handleRemovePreview(index)} size="small" sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'rgba(255,255,255,0.7)', '&:hover': { backgroundColor: 'white' } }}>
                                        <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button variant="outlined" component="label" startIcon={<UploadFile />} disabled={isUploading}>
                                Seleccionar Archivo(s)
                                <input type="file" hidden accept="image/*" onChange={handleFileChange} multiple />
                            </Button>
                            <Button variant="contained" onClick={handleUploadAdicional} disabled={nuevosComprobantes.length === 0 || isUploading} sx={{ ml: 'auto' }}>
                                {isUploading ? <CircularProgress size={24} /> : `Subir ${nuevosComprobantes.length} Comprobante(s)`}
                            </Button>
                        </Box>
                    </Box>
                )}


<Typography variant="subtitle1" fontWeight={600} gutterBottom>
    Información de Pago
</Typography>
<Divider sx={{ mb: 2 }} />


{pedido.monto_usado_credito > 0 ? (
    <Alert severity="success" icon={<CreditCard fontSize="inherit" />}>
        Este pedido fue pagado en su totalidad utilizando tu cupo de crédito. No se requieren comprobantes.
    </Alert>
) : pedido.comprobantes && pedido.comprobantes.length > 0 ? (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 2,
            p: 1,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            backgroundColor: '#fff',
        }}
    >
        {pedido.comprobantes.map((comp) => (
            <Link
                href={comp.imagen}
                target="_blank"
                rel="noopener noreferrer"
                key={comp.id}
                underline="none"
            >
                <img
                    src={comp.imagen}
                    alt="Comprobante"
                    className="comprobante-thumbnail"
                />
            </Link>
        ))}
    </Box>
) : (
    <Typography color="text.secondary">
        Aún no has subido ningún comprobante.
    </Typography>
)}

            </DialogContent>
        </Dialog>
    );
}