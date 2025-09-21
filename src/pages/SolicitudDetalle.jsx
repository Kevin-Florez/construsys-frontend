import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Grid, CircularProgress, Alert, Divider, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, InputAdornment
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, History as HistoryIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import '../styles/soli.css';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const SolicitudDetalle = () => {
    const { solicitudId } = useParams();
    const navigate = useNavigate();
    const { authTokens, logout } = useAuth();

    const [solicitud, setSolicitud] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [motivo, setMotivo] = useState('');

    // --- NUEVOS ESTADOS AÑADIDOS ---
    const [montoAprobado, setMontoAprobado] = useState('');
    const [montoError, setMontoError] = useState('');
    
    const fetchDetails = useCallback(async (clienteId) => {
        const token = authTokens?.access;
        if (!token) {
            logout();
            return;
        }
        try {
            // Fetch de la solicitud y del historial en paralelo
            const [solicitudRes, historialRes] = await Promise.all([
                fetch(`${API_BASE_URL}/creditos/solicitudes/${solicitudId}/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/creditos/solicitudes/historial-cliente/${clienteId}/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!solicitudRes.ok) throw new Error('Error al cargar la solicitud.');
            const solicitudData = await solicitudRes.json();
            setSolicitud(solicitudData);

            if (historialRes.ok) {
                const historialData = await historialRes.json();
                setHistorial(historialData);
            }
            
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [solicitudId, authTokens, logout]);

    useEffect(() => {
        const getSolicitud = async () => {
            setLoading(true);
            const token = authTokens?.access;
            try {
                const res = await fetch(`${API_BASE_URL}/creditos/solicitudes/${solicitudId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();

                if (!res.ok) throw new Error("No se pudo cargar la solicitud.");

                setSolicitud(data);
                // Al cargar los datos, inicializamos el monto a aprobar con el monto solicitado.
                setMontoAprobado(data.monto_solicitado || '');

                if (data.cliente) {
                    await fetchDetails(data.cliente); // fetchDetails se encarga de setLoading(false)
                } else {
                    setLoading(false);
                }
            } catch (e) {
                setError(e.message || "No se pudo cargar la información inicial.");
                setLoading(false);
            }
        };
        getSolicitud();
    }, [solicitudId, authTokens, fetchDetails]);

    const handleDecision = async (decision) => {
        setMontoError(''); // Limpiar errores previos

        if (decision === 'Rechazada' && !motivo.trim()) {
            toast.error("Debe proporcionar un motivo para rechazar la solicitud.");
            return;
        }

        // Validación para la aprobación
        if (decision === 'Aprobada') {
            const montoNum = parseFloat(montoAprobado);
            if (isNaN(montoNum) || montoNum <= 0) {
                setMontoError("El monto a aprobar debe ser un número positivo.");
                toast.error("Por favor, ingrese un monto válido para aprobar.");
                return;
            }
        }

        setActionLoading(true);
        try {
            // Construimos el payload dinámicamente
            const payload = { 
                estado: decision, 
                motivo_decision: motivo 
            };
            if (decision === 'Aprobada') {
                payload.monto_aprobado = montoAprobado;
            }

            const response = await fetch(`${API_BASE_URL}/creditos/solicitudes/${solicitudId}/`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${authTokens?.access}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            // Mejoramos el manejo de errores del backend
            if (!response.ok) {
                const errorMsg = data.monto_aprobado?.[0] || data.detail || "Error al procesar la decisión.";
                throw new Error(errorMsg);
            }

            toast.success(`Solicitud ${decision.toLowerCase()} exitosamente.`);
            if (decision === 'Aprobada') {
                navigate(`/creditos/${data.credito_generado_id}`);
            } else {
                navigate('/solicitudes');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box>;
    if (error || !solicitud) return <Alert severity="error">{error || "No se encontró la solicitud."}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <div className="creditos-title-header">
                <h1>Revisión de Solicitud #{solicitud.id}</h1>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} sx={{textTransform: 'none'}} onClick={() => navigate('/solicitudes')}>
                    Volver a Solicitudes
                </Button>
            </div>

            <Grid container spacing={3} mt={1}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6">{solicitud.cliente_info}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography>Monto Solicitado: <strong>{formatCurrency(solicitud.monto_solicitado)}</strong></Typography>
                        <Typography>Plazo Solicitado: <strong>{solicitud.plazo_dias_solicitado} días</strong></Typography>
                        <Typography>Fecha de Solicitud: <strong>{formatDate(solicitud.fecha_solicitud)}</strong></Typography>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Tomar Decisión</Typography>
                        
                        <TextField
                            label="Monto a Aprobar"
                            fullWidth
                            type="number"
                            value={montoAprobado}
                            onChange={(e) => {
                                setMontoAprobado(e.target.value);
                                if(montoError) setMontoError('');
                            }}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                inputProps: { min: 1 }
                            }}
                            required
                            error={!!montoError}
                            helperText={montoError || "El valor por defecto es el monto solicitado."}
                        />

                        <TextField
                            label="Notas / Motivo de Decisión"
                            fullWidth multiline rows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            helperText="Opcional para aprobar, obligatorio para rechazar."
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Button
                                variant="contained" color="error" startIcon={<RejectIcon />}
                                disabled={actionLoading}
                                onClick={() => handleDecision('Rechazada')}
                                sx={{textTransform: 'none'}}
                            >
                                Rechazar
                            </Button>
                            <Button
                                variant="contained" color="success" startIcon={<ApproveIcon />}
                                disabled={actionLoading}
                                onClick={() => handleDecision('Aprobada')}
                                sx={{textTransform: 'none'}}
                            >
                                {actionLoading ? <CircularProgress size={24}/> : 'Aprobar y Crear Crédito'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                            <HistoryIcon sx={{ mr: 1 }}/> Historial del Cliente
                        </Typography>
                        <TableContainer sx={{ mt: 1 }} className='lll'>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">ID de Crédito</TableCell>
                                        <TableCell align="center">Fecha Otorg.</TableCell>
                                        <TableCell align="center">Monto</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historial.length > 0 ? historial.map(cred => (
                                        <TableRow key={cred.id}>
                                            <TableCell align="center">#{cred.id}</TableCell>
                                            <TableCell align="center">{formatDate(cred.fecha_otorgamiento)}</TableCell>
                                            <TableCell align="center">{formatCurrency(cred.cupo_aprobado)}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={cred.estado_display} size="small" color={cred.estado === 'Pagado' ? 'success' : 'default'}/>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">Este cliente no tiene historial de créditos.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SolicitudDetalle;