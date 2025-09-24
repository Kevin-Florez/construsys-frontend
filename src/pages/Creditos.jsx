import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Box, Typography, CircularProgress, Tooltip, IconButton, TextField, InputAdornment, Alert, TablePagination 
} from '@mui/material';
import { 
    Add as AddIcon, Visibility as VisibilityIcon, Search as SearchIcon, Clear as ClearIcon, 
    Print as PrintIcon, AddCard as AbonoIcon 
} from '@mui/icons-material';
import AbonoModal from '../components/AbonoModal';
import { useAuth } from '../context/AuthContext'; // ✨ 1. Importamos el hook useAuth
import { toast } from 'sonner'; // Usamos toast para notificaciones
import '../styles/Creditos.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-CO', { timeZone: 'UTC' });
 
const getEstadoStyles = (estado) => {
    const estadoNormalizado = estado?.toLowerCase() || 'desconocido';
    switch (estadoNormalizado) {
        case 'activo': return { backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' };
        case 'pagado': return { backgroundColor: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' };
        case 'vencido': return { backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' };
        case 'anulado': return { backgroundColor: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' };
        case 'agotado': return { backgroundColor: '#ffedd5', color: '#f97316', borderColor: '#fed7aa' };
        default: return { backgroundColor: '#e2e8f0', color: '#475569' };
    }
};

const Creditos = () => {
    const navigate = useNavigate();
    // ✨ 2. Obtenemos los datos de autenticación y privilegios del contexto
    const { authTokens, userPrivileges, logout } = useAuth();

    const [creditos, setCreditos] = useState([]);
    const [filteredCreditos, setFilteredCreditos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCredito, setSelectedCredito] = useState(null);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [abonoError, setAbonoError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCreditos = useCallback(async () => {
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
            const response = await fetch(`${API_BASE_URL}/creditos/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("Error al cargar los créditos.");
            const data = await response.json();
            setCreditos(Array.isArray(data) ? data : []);
            setFilteredCreditos(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos dependencias
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchCreditos();
        }
    }, [authTokens, fetchCreditos]);

    useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    setFilteredCreditos(
        creditos.filter(c => {
            const valuesToSearch = [
                c.id?.toString(),
                c.cliente_info,
                formatDate(c.fecha_otorgamiento),
                c.cupo_aprobado?.toString(),
                c.deuda_del_cupo?.toString(),
                c.intereses_acumulados?.toString(),
                c.deuda_total_con_intereses?.toString(),
                c.estado_display
            ];

            return valuesToSearch.some(value =>
                (value || "").toString().toLowerCase().includes(lowerSearchTerm)
            );
        })
    );

    setPage(0);
}, [searchTerm, creditos]);

    
    const handleOpenAbonoModal = (credito) => {
        setSelectedCredito(credito);
        setAbonoError('');
        setModalOpen(true);
    };

    const handleGeneratePdf = async (creditoId) => {
        setPdfLoadingId(creditoId);
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/${creditoId}/pdf/`, { headers: { 'Authorization': `Bearer ${authTokens?.access}` }});
            if (!response.ok) throw new Error("Error al generar el PDF.");
            const blob = await response.blob();
            window.open(window.URL.createObjectURL(blob), '_blank');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setPdfLoadingId(null);
        }
    };

    const handleSaveAbono = async (abonoData) => {
        if (!selectedCredito) return;
        setAbonoError('');
        setActionLoading(true);
        const formData = new FormData();
        formData.append('monto', abonoData.monto);
        formData.append('fecha_abono', abonoData.fecha_abono);
        formData.append('metodo_pago', abonoData.metodo_pago);
        if (abonoData.comprobante) {
            formData.append('comprobante', abonoData.comprobante);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/creditos/${selectedCredito.id}/abonos/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authTokens?.access}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al procesar el abono.');
            
            toast.success("Abono registrado con éxito.");
            setModalOpen(false);
            setSelectedCredito(null);
            fetchCreditos();
        } catch (err) {
            setAbonoError(err.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando créditos...</div>;

    return (
        <div className="creditos-container">
            <div className="creditos-title-header">
                <h1>Gestión de Créditos</h1>
            </div>
            <Box className="creditos-toolbar">
                <TextField
                    placeholder="Buscar..." variant="outlined" size="small"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>),
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
                {/* ✨ 5. Ocultamos el botón si no se tiene el privilegio */}
                {userPrivileges.includes('solicitudes_crear') && ( // Usa el nuevo privilegio
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/solicitudes/nueva')} // Cambia la ruta
            className="add-button"
        >
            Nueva Solicitud
        </Button>
    )}
</Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TableContainer component={Paper} className="creditos-table" elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Crédito</TableCell>
                            <TableCell align="center">Cliente</TableCell>
                            <TableCell align="center">F. Otorg.</TableCell>
                            <TableCell align="center">Cupo Total</TableCell>
                            <TableCell align="center">Deuda Cupo</TableCell>
                            <TableCell align="center">Intereses</TableCell>
                            <TableCell align="center">Deuda Total</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCreditos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((credito) => (
                            <TableRow key={credito.id} hover>
                                <TableCell align="center">#{credito.id}</TableCell>
                                <TableCell align="center">{credito.cliente_info}</TableCell>
                                <TableCell align="center">{formatDate(credito.fecha_otorgamiento)}</TableCell>
                                <TableCell align="center">{formatCurrency(credito.cupo_aprobado)}</TableCell>
                                <TableCell align="center">{formatCurrency(credito.deuda_del_cupo)}</TableCell>
                                <TableCell align="center" sx={{ color: 'darkorange' }}>{formatCurrency(credito.intereses_acumulados)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'darkred' }}>{formatCurrency(credito.deuda_total_con_intereses)}</TableCell>
                                <TableCell align="center">
    <Typography 
        component="span" 
        className={`estado-label ${credito.estado_display.toLowerCase()}`}
    >
        {credito.estado_display}
    </Typography>
</TableCell>
                                <TableCell align="center" sx={{ p: 0, whiteSpace: 'nowrap' }}>
                                    <Tooltip title="Ver Detalle"><IconButton color="primary" onClick={() => navigate(`/creditos/${credito.id}`)}><VisibilityIcon /></IconButton></Tooltip>
                                    {/* ✨ 5. Deshabilitamos botones según privilegios */}
                                    <Tooltip title="Realizar Abono">
                                        <span>
                                            <IconButton color="success" onClick={() => handleOpenAbonoModal(credito)} disabled={credito.estado !== 'Activo' || !userPrivileges.includes('creditos_abonar')}>
                                                <AbonoIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Imprimir Estado de Cuenta">
                                        <span>
                                            <IconButton onClick={() => handleGeneratePdf(credito.id)} disabled={pdfLoadingId === credito.id}>
                                                {pdfLoadingId === credito.id ? <CircularProgress size={20}/> : <PrintIcon sx={{ color: "black" }} />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCreditos.length === 0 && (
                            <TableRow><TableCell colSpan={9} align="center" className="no-data">No se encontraron créditos.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredCreditos.length}
                rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage} className="table-pagination"
                labelRowsPerPage="Filas por página:"
            />
            {selectedCredito && (
                <AbonoModal 
                    open={modalOpen} 
                    onClose={() => setModalOpen(false)} 
                    onSave={handleSaveAbono} 
                    deudaTotal={parseFloat(selectedCredito.deuda_total_con_intereses)}
                    creditoId={selectedCredito.id}
                    apiError={abonoError}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
};

export default Creditos;