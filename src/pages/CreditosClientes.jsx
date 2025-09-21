// src/pages/CreditosClientes.jsx

import React, { useState, useEffect, useRef, useCallback  } from "react";
import {
    Box, Typography, Paper, Divider, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Grid, Chip, TextField,
    InputAdornment, Alert, Tooltip, CircularProgress,
} from "@mui/material";
import { CreditCard, Payment, History as HistoryIcon, Add, CloudUpload, Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { styled } from '@mui/material/styles';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import '../styles/CreditosClientes.css';

// --- NUEVO: Importamos el componente de tabla actualizado ---
import AbonoHistoryTable from "../components/AbonoHistoryTable"; 

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

// --- Formateadores (si no los tienes en un archivo utils) ---
const formatCurrency = (value) => parseFloat(value).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatFecha = (dateString, includeTime = true) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('es-CO', options);
};

const PageContainer = styled(Box)(({ theme }) => ({ padding: theme.spacing(3), backgroundColor: '#f5f5f5', minHeight: '100vh' }));
const HeaderPaper = styled(Paper)(({ theme }) => ({ padding: theme.spacing(2, 3), marginBottom: theme.spacing(3), borderRadius: theme.shape.borderRadius * 2 }));
const InfoCard = styled(Paper)(({ theme }) => ({ padding: theme.spacing(3), height: '100%', borderRadius: theme.shape.borderRadius * 2, display: 'flex', flexDirection: 'column' }));
const HistoryCard = styled(Paper)(({ theme }) => ({ borderRadius: theme.shape.borderRadius * 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }));
const AbonoFormContainer = styled(Box)(({ theme }) => ({ position: 'relative', padding: theme.spacing(3), margin: theme.spacing(0, 3, 3), backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: theme.shape.borderRadius }));

export default function CreditosClientes() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { authTokens, logout } = useAuth();

    const [allCredits, setAllCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showAbonoForm, setShowAbonoForm] = useState(false);
    const [abonoAmount, setAbonoAmount] = useState("");
    const [comprobanteFile, setComprobanteFile] = useState(null);
    const [isSubmittingAbono, setIsSubmittingAbono] = useState(false);

    const fetchCreditHistory = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/creditos/mi-historial/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok) {
                throw new Error("No se pudo cargar tu historial de créditos.");
            }
            const data = await response.json();
            setAllCredits(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);
    
    useEffect(() => {
        setLoading(true);
        fetchCreditHistory();
    }, [fetchCreditHistory]);

    const activeCredit = allCredits.find(c => c.estado === 'Activo');
    const pastCredits = allCredits.filter(c => c.estado !== 'Activo');

    // --- MODIFICADO: La lógica de abonar ahora es más simple ---
    const handleAbonar = async () => {
        const token = authTokens?.access;
        if (!token) return;
        
        const montoAbono = parseFloat(abonoAmount);
        if (!montoAbono || montoAbono <= 0) {
            toast.error("Por favor, ingrese un monto válido.");
            return;
        }
        if (!comprobanteFile) {
            toast.error("Por favor, adjunte el comprobante de pago.");
            return;
        }

        setIsSubmittingAbono(true);
        const formData = new FormData();
        formData.append('monto', montoAbono);
        formData.append('fecha_abono', new Date().toISOString().split('T')[0]);
        formData.append('metodo_pago', 'Transferencia'); // Asumimos transferencia desde el portal
        formData.append('comprobante', comprobanteFile);

        try {
            const response = await fetch(`${API_BASE_URL}/creditos/${activeCredit.id}/abonos/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            
            const responseData = await response.json();
            if (!response.ok) {
                // El error puede venir en 'error' o 'detail' dependiendo de la validación
                throw new Error(responseData.error || responseData.detail || "Error al registrar el abono.");
            }
            
            // --- CAMBIO CLAVE: El mensaje al usuario ahora es sobre la verificación ---
            toast.success("Abono enviado. Será verificado por un administrador.");
            
            setShowAbonoForm(false);
            setAbonoAmount("");
            setComprobanteFile(null);
            
            // Recargamos el historial para que el cliente vea su abono en estado 'Pendiente'
            fetchCreditHistory(); 

        } catch (err) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsSubmittingAbono(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Límite de 5MB
                toast.error("El archivo es demasiado grande (máx 5MB).");
                return;
            }
            setComprobanteFile(file);
        }
    };
    
    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <PageContainer>
            <HeaderPaper elevation={0} variant="outlined">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CreditCard color="primary" sx={{ fontSize: 40 }}/>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Gestionar Mi Crédito</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {activeCredit ? "Consulta tu cupo, deudas y realiza abonos." : "Consulta tu historial de créditos."}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </HeaderPaper>

            {activeCredit ? (
                <Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={5} xl={4}>
                            <InfoCard variant="outlined">
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{activeCredit.cliente_info}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Estado:</Typography><Chip label={activeCredit.estado_display} color={activeCredit.estado === "Activo" ? "success" : "error"} size="small" sx={{ mt: 1, textTransform: 'capitalize', display: 'block', mx: 'auto', width: 'fit-content' }} /></Grid>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Otorgado:</Typography><Typography align="center" variant="body2">{formatFecha(activeCredit.fecha_otorgamiento, false)}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Vencimiento:</Typography><Typography align="center" variant="body2">{formatFecha(activeCredit.fecha_vencimiento, false)}</Typography></Grid>
                                    </Grid>
                                    <Divider sx={{ my: 2 }} />
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Cupo Aprobado:</Typography><Typography align="center" sx={{ fontWeight: '500' }}>{formatCurrency(activeCredit.cupo_aprobado)}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Saldo Disponible:</Typography><Typography align="center" sx={{ fontWeight: '500', color: 'success.dark' }}>{formatCurrency(activeCredit.saldo_disponible_para_ventas)}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Deuda del Cupo:</Typography><Typography align="center" sx={{ fontWeight: '500' }}>{formatCurrency(activeCredit.deuda_del_cupo)}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary" align="center">Intereses:</Typography><Typography align="center" sx={{ fontWeight: '500', color: 'warning.dark' }}>{formatCurrency(activeCredit.intereses_acumulados)}</Typography></Grid>
                                    </Grid>
                                </Box>
                                <Box sx={{ mt: 3, p: '5px 20px', background: 'linear-gradient(45deg, #b91c1c, #ef4444)', color: 'white', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', opacity: 0.8 }} align="center">Total a Pagar:</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }} align="center">{formatCurrency(activeCredit.deuda_total_con_intereses)}</Typography>
                                </Box>
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12} lg={7} xl={8}>
                            <HistoryCard variant="outlined">
                                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Historial de Abonos (Crédito Actual)</Typography>
                                    <Button variant="contained" startIcon={<Add />} onClick={() => setShowAbonoForm(prev => !prev)} disabled={activeCredit.deuda_total_con_intereses <= 0} sx={{textTransform: 'none'}}>Realizar Abono</Button>
                                </Box>
                                {showAbonoForm && (
                                    <AbonoFormContainer>
                                        <IconButton onClick={() => setShowAbonoForm(false)} sx={{ position: 'absolute', top: 8, right: 8 }}><Close /></IconButton>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>Registrar Nuevo Abono</Typography>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs><TextField label="Monto a abonar" variant="outlined" value={abonoAmount} onChange={(e) => setAbonoAmount(e.target.value.replace(/[^0-9.]/g, ''))} size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
                                            <Grid item xs="auto"><Button sx={{textTransform: 'none'}} component="label" variant="outlined" startIcon={<CloudUpload />}>Comprobante<input hidden type="file" onChange={handleFileChange} ref={fileInputRef} accept="image/*,.pdf"/></Button></Grid>
                                            <Grid item xs="auto" sx={{ ml: 'auto' }}><Button sx={{textTransform: 'none'}} variant="contained" startIcon={<Payment />} onClick={handleAbonar} disabled={!comprobanteFile || !abonoAmount || isSubmittingAbono}>{isSubmittingAbono ? <CircularProgress size={24}/> : 'Enviar para Verificar'}</Button></Grid>
                                        </Grid>
                                        {comprobanteFile && <Alert severity="info" sx={{ mt: 2 }}>Archivo adjunto: {comprobanteFile.name}</Alert>}
                                    </AbonoFormContainer>
                                )}
                                {/* --- MODIFICADO: Usamos el nuevo componente de tabla --- */}
                                <AbonoHistoryTable abonos={activeCredit.abonos} />
                            </HistoryCard>
                        </Grid>
                    </Grid>
                </Box>
            ) : (
                <Alert severity="info">Actualmente no tienes una línea de crédito activa. A continuación puedes ver tu historial.</Alert>
            )}

            <Box mt={4}>
                <HistoryCard variant="outlined">
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Historial de Créditos Anteriores</Typography>
                    </Box>
                    <Divider />
                    <TableContainer className="lll">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">N° Crédito</TableCell>
                                    <TableCell align="center">Fecha Otorgado</TableCell>
                                    <TableCell align="center">Monto Aprobado</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pastCredits.length > 0 ? (
                                    pastCredits.map(credit => (
                                        <TableRow key={credit.id} hover>
                                            <TableCell align="center">{`#${String(credit.id).padStart(4, "0")}`}</TableCell>
                                            <TableCell align="center">{formatFecha(credit.fecha_otorgamiento, false)}</TableCell>
                                            <TableCell align="center">{formatCurrency(credit.cupo_aprobado)}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={credit.estado_display} color={credit.estado === "Pagado" ? "info" : "default"} size="small"/>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">No tienes créditos anteriores en tu historial.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </HistoryCard>
            </Box>
        </PageContainer>
    );
}