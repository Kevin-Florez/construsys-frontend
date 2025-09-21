import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, CircularProgress, TablePagination, Tooltip, IconButton,
    Dialog, DialogContent, DialogTitle, DialogActions, Grid, InputAdornment, Alert, TextField, Divider
} from '@mui/material';
import {
    Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon,
    Print as PrintIcon, Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon,
    ShoppingCartCheckout as ConvertIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext'; // ✨ 1. Importamos el hook useAuth
import { toast } from 'sonner'; // Usaremos toast para notificaciones
import '../styles/Cotizaciones.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CotizacionesLista = () => {
    const navigate = useNavigate();
    // ✨ 2. Obtenemos los datos de autenticación y privilegios del contexto
    const { authTokens, userPrivileges, logout } = useAuth();

    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [detailOpen, setDetailOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        // ✨ 3. Usamos el token del contexto
        const token = authTokens?.access;
        if (!token) {
            setError("No autenticado.");
            setLoading(false);
            logout();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar las cotizaciones.');
            const data = await response.json();
            setCotizaciones(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos dependencias
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchData();
        }
    }, [authTokens, fetchData]);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        setFilteredData(
            cotizaciones.filter(cot =>
                (cot.id?.toString().includes(lowerSearch)) ||
                (cot.cliente_info?.toLowerCase().includes(lowerSearch)) ||
                (cot.estado_display?.toLowerCase().includes(lowerSearch))
            )
        );
        setPage(0);
    }, [searchTerm, cotizaciones]);

    const handleVerDetalle = (cotizacion) => {
        setSelectedCotizacion(cotizacion);
        setDetailOpen(true);
    };

    const handleGeneratePdf = async (cotId) => {
        setActionLoading(`pdf-${cotId}`);
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/${cotId}/pdf/`, { headers: { 'Authorization': `Bearer ${authTokens?.access}` }});
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error al generar PDF`);
            }
            const blob = await response.blob();
            window.open(window.URL.createObjectURL(blob), '_blank');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleConvert = async (cotId) => {
        setActionLoading(`convert-${cotId}`);
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/${cotId}/convertir-a-venta/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authTokens?.access}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Error al convertir a venta.");
            toast.success(`Cotización convertida a Venta #${data.id}.`);
            navigate(`/ventas`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleDelete = (cot) => {
        setSelectedCotizacion(cot);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCotizacion) return;
        setActionLoading(`delete-${selectedCotizacion.id}`);
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/${selectedCotizacion.id}/`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${authTokens?.access}` }
            });
            if (response.status !== 204) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'No se pudo eliminar la cotización.');
            }
            toast.success('Cotización eliminada.');
            fetchData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
            setConfirmDeleteOpen(false);
        }
    };
    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando cotizaciones...</div>;
    if (error) return <Alert severity="error" sx={{m: 3}}>{error}</Alert>;

    return (
        <div className="cotizaciones-container">
            <div className="cotizaciones-title-header">
                <h1>Gestión de Cotizaciones</h1>
            </div>
            <Box className="cotizaciones-toolbar">
                <TextField
                    placeholder="Buscar por ID, cliente o estado..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
                {/* ✨ 5. Ocultamos el botón si no se tiene el privilegio */}
                {userPrivileges.includes('cotizaciones_crear') && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cotizaciones/nueva')} className="add-button">
                        Nueva Cotización
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} className="cotizaciones-table" elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Cotización</TableCell>
                            <TableCell align="center">Fecha</TableCell>
                            <TableCell align="center">Cliente</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((cot) => (
                            <TableRow key={cot.id} hover className={`estado-cotizacion-${cot.estado_display?.toLowerCase()}`}>
                                <TableCell align="center">#{cot.id}</TableCell>
                                <TableCell align="center">{new Date(cot.fecha_cotizacion).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</TableCell>
                                <TableCell>{cot.cliente_info}</TableCell>
                                <TableCell align="center">{formatCurrency(cot.total)}</TableCell>
                                <TableCell align="center">
                                    <Typography component="span" className={`estado-label estado-${cot.estado_display?.toLowerCase().replace(/ /g, '-')}`}>
                                        {cot.estado_display}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" className="action-buttons">
                                    <Tooltip title="Ver Detalle"><IconButton size="small" color="info" onClick={() => handleVerDetalle(cot)}><VisibilityIcon /></IconButton></Tooltip>
                                    
                                    {/* ✨ 5. Ocultamos/deshabilitamos botones según privilegios */}
                                    {cot.estado_display === 'Pendiente' && (
                                        <>
                                            <Tooltip title="Editar"><span><IconButton size="small" color="primary" onClick={() => navigate(`/cotizaciones/editar/${cot.id}`)} disabled={!userPrivileges.includes('cotizaciones_editar')}><EditIcon /></IconButton></span></Tooltip>
                                            <Tooltip title="Eliminar"><span><IconButton size="small" color="error" onClick={() => handleDelete(cot)} disabled={!userPrivileges.includes('cotizaciones_eliminar')}><DeleteIcon /></IconButton></span></Tooltip>
                                        </>
                                    )}
                                    {cot.estado_display === 'Aprobada' && (
                                        <Tooltip title="Convertir a Venta"><span><IconButton size="small" color="success" onClick={() => handleConvert(cot.id)} disabled={actionLoading === `convert-${cot.id}` || !userPrivileges.includes('ventas_crear')}>{actionLoading === `convert-${cot.id}` ? <CircularProgress size={20}/> : <ConvertIcon />}</IconButton></span></Tooltip>
                                    )}
                                    <Tooltip title="Generar PDF"><span><IconButton size="small" onClick={() => handleGeneratePdf(cot.id)} disabled={actionLoading === `pdf-${cot.id}`}><PrintIcon sx={{ color: "black" }} /></IconButton></span></Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center" className="no-data">No se encontraron cotizaciones.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredData.length}
                rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                className="table-pagination" labelRowsPerPage="Filas por página:"
            />

            {selectedCotizacion && 
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md" className="cotizacion-dialog">
                <DialogTitle className="cotizacion-dialog-title"><InfoIcon sx={{verticalAlign:'middle', mr:1}}/>Detalle Cotización #{selectedCotizacion.id}</DialogTitle>
                <DialogContent className="dialog-content">
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}><Typography variant="body2" color="text.secondary">Cliente</Typography><Typography>{selectedCotizacion.cliente_info}</Typography></Grid>
                        <Grid item xs={12} sm={4}><Typography variant="body2" color="text.secondary">Fecha Cotización</Typography><Typography>{new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</Typography></Grid>
                        <Grid item xs={12} sm={4}><Typography variant="body2" color="text.secondary">Vence</Typography><Typography>{new Date(selectedCotizacion.fecha_vencimiento).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</Typography></Grid>
                        {selectedCotizacion.observaciones && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Observaciones</Typography><Typography>{selectedCotizacion.observaciones}</Typography></Grid>}
                        <Grid item xs={12}><Divider sx={{my:1}} /></Grid>
                        <Grid item xs={12}>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="center">Cant.</TableCell><TableCell align="right">P. Unit.</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {selectedCotizacion.items.map(item => (
                                            <TableRow key={item.id}><TableCell>{item.producto_nombre_historico}</TableCell><TableCell align="center">{item.cantidad}</TableCell><TableCell align="right">{formatCurrency(item.precio_unitario)}</TableCell><TableCell align="right">{formatCurrency(item.subtotal)}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                        <Grid item xs={12} container justifyContent="flex-end">
                            <Box sx={{width: '300px', textAlign: 'right', mt: 1}}>
                                <Typography>Subtotal: {formatCurrency(selectedCotizacion.subtotal)}</Typography>
                                <Typography>IVA (19%): {formatCurrency(selectedCotizacion.iva)}</Typography>
                                <Typography variant="h6">Total Cotizado: {formatCurrency(selectedCotizacion.total)}</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={() => setDetailOpen(false)} variant="contained" sx={{textTransform: 'none'}}>Cerrar</Button>
                </DialogActions>
            </Dialog>}

            {selectedCotizacion &&
             <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} className="confirm-dialog" maxWidth="xs">
                   <DialogTitle className="confirm-dialog-title">Confirmar Eliminación</DialogTitle>
                   <DialogContent className="confirm-dialog-content"><Typography>¿Está seguro de eliminar la cotización #{selectedCotizacion.id}?</Typography></DialogContent>
                   <DialogActions className="dialog-actions">
                       <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">Cancelar</Button>
                       <Button onClick={confirmDelete} color="error" variant="contained" disabled={!!actionLoading}>Eliminar</Button>
                   </DialogActions>
             </Dialog>}
        </div>
    );
};

export default CotizacionesLista;