// src/pages/CreditoDetalle.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Button, Typography, Paper, Grid, CircularProgress, Alert, Divider,
    Dialog, DialogTitle, DialogContent, TextField, DialogActions
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Info as InfoIcon } from '@mui/icons-material';
import AbonoHistoryTable from '../components/AbonoHistoryTable';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-CO', { timeZone: 'UTC' });

const InfoRow = ({ label, value, color, bold }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
        <Typography sx={{ fontWeight: bold ? 'bold' : 'normal', fontSize: '0.9rem' }}>{label}:</Typography>
        <Typography sx={{ fontWeight: bold ? 'bold' : 'normal', color: color || 'inherit', fontSize: '0.9rem' }}>{value}</Typography>
    </Box>
);

const CreditoDetalle = () => {
    const { creditoId } = useParams();
    const navigate = useNavigate();
    const { authTokens, logout } = useAuth();

    const [credito, setCredito] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- NUEVO: Estados para manejar la verificación de abonos ---
    const [actionLoadingId, setActionLoadingId] = useState(null); // ID del abono que se está procesando
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [abonoToReject, setAbonoToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    
    const fetchCredito = useCallback(async () => {
        setLoading(true);
        setError('');
        const token = authTokens?.access;
        if (!token) {
            setError("No autenticado.");
            setLoading(false);
            logout();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/${creditoId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("Error al cargar el detalle del crédito.");
            const data = await response.json();
            setCredito(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [creditoId, authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchCredito();
        }
    }, [authTokens, fetchCredito]);

    // --- NUEVO: Lógica para aprobar un abono ---
    const handleApproveAbono = async (abonoId) => {
        setActionLoadingId(abonoId);
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/abonos/${abonoId}/verificar/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${authTokens?.access}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ accion: 'aprobar' })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error al aprobar el abono.");
            
            // La API devuelve el estado del crédito actualizado, lo usamos para refrescar la UI
            setCredito(data);
            toast.success("Abono aprobado y aplicado exitosamente.");

        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    // --- NUEVO: Lógica para rechazar un abono ---
    const handleOpenRejectModal = (abonoId) => {
        setAbonoToReject(abonoId);
        setRejectReason('');
        setRejectModalOpen(true);
    };
    
    const handleConfirmReject = async () => {
        if (!rejectReason) {
            toast.warning("Por favor, ingrese un motivo para el rechazo.");
            return;
        }
        setActionLoadingId(abonoToReject);
        setRejectModalOpen(false);

        try {
            const response = await fetch(`${API_BASE_URL}/creditos/abonos/${abonoToReject}/verificar/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${authTokens?.access}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ accion: 'rechazar', motivo: rejectReason })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error al rechazar el abono.");
            
            // Refrescamos los datos para ver el estado actualizado del abono
            fetchCredito();
            toast.success("Abono rechazado correctamente.");

        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoadingId(null);
            setAbonoToReject(null);
        }
    };
    
    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box>;
    if (error && !credito) return <Alert severity="error">{error}</Alert>;
    if (!credito) return null;

    return (
        <Box sx={{ p: 3 }}>
            <div className="creditos-title-header">
                <h1><InfoIcon sx={{verticalAlign:'middle', mr:1}}/>Detalle de Crédito #{credito.id}</h1>
                <Button variant="outlined" sx={{ textTransform: "none"}} startIcon={<ArrowBackIcon />} onClick={() => navigate('/creditos')}>
                    Volver a la Lista
                </Button>
            </div>

            {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">{credito.cliente_info}</Typography>
                        <InfoRow label="Estado" value={credito.estado_display} color={credito.estado === 'Activo' ? 'green' : 'red'} bold />
                        <Divider sx={{ my: 2 }} />
                        <InfoRow label="Otorgado" value={formatDate(credito.fecha_otorgamiento)} />
                        <InfoRow label="Vencimiento" value={`${formatDate(credito.fecha_vencimiento)} (${credito.plazo_dias} días)`} />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow label="Cupo Aprobado" value={formatCurrency(credito.cupo_aprobado)} />
                        <InfoRow label="Saldo Disponible (Compras)" value={formatCurrency(credito.saldo_disponible_para_ventas)} color="green" />
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        <InfoRow label="Deuda del Cupo" value={formatCurrency(credito.deuda_del_cupo)} />
                        <InfoRow label="Intereses Generados" value={formatCurrency(credito.intereses_acumulados)} />
                        <Divider sx={{ my: 2 }} />
                        <InfoRow label="Total a Pagar Hoy" value={formatCurrency(credito.deuda_total_con_intereses)} bold color="darkred" />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="h6">Historial de Abonos</Typography>
                        </Box>
                        {/* --- MODIFICADO: Pasamos las nuevas propiedades a la tabla --- */}
                        <AbonoHistoryTable 
                            abonos={credito.abonos} 
                            isAdminView={true}
                            onApprove={handleApproveAbono}
                            onReject={handleOpenRejectModal}
                            actionLoadingId={actionLoadingId}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* --- NUEVO: Modal para el motivo de rechazo --- */}
            <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Motivo del Rechazo</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Por favor, explique por qué se rechaza este abono"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmReject} variant="contained" color="error">Confirmar Rechazo</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreditoDetalle;