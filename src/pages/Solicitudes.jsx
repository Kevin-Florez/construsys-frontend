// src/pages/Solicitudes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, CircularProgress, Alert, Chip, Tooltip, IconButton,
    TextField, InputAdornment, TablePagination
} from '@mui/material';
import { 
    Add as AddIcon, RateReview as ReviewIcon, PlaylistAddCheck as SolicitudIcon,
    Visibility as VisibilityIcon, Info as InfoIcon, Search as SearchIcon, Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import '../styles/Creditos.css';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const EstadoChip = ({ estado }) => {
    const props = { label: estado, size: 'small' };
    switch (estado) {
        case 'Aprobada': props.color = 'success'; break;
        case 'Rechazada': props.color = 'error'; break;
        case 'Pendiente de Revisión': props.color = 'warning'; break;
        default: props.color = 'default'; break;
    }
    return <Chip {...props} />;
};

const Solicitudes = () => {
    const navigate = useNavigate();
    const { authTokens, userPrivileges, logout } = useAuth();

    const [solicitudes, setSolicitudes] = useState([]);
    const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // modal detalle
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);

    const handleOpenDetailModal = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setIsDetailModalOpen(true);
    };
    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedSolicitud(null);
    };

    const fetchSolicitudes = useCallback(async () => {
        setLoading(true);
        setError('');
        const token = authTokens?.access;
        if (!token) {
            logout();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/solicitudes/`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) throw new Error("Error al cargar las solicitudes.");
            const data = await response.json();
            setSolicitudes(Array.isArray(data) ? data : []);
            setFilteredSolicitudes(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchSolicitudes();
        }
    }, [authTokens, fetchSolicitudes]);

    // --- Filtrado buscador ---
    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        setFilteredSolicitudes(
            solicitudes.filter(s => {
                const valuesToSearch = [
                    s.id?.toString(),
                    s.cliente_info,
                    formatDate(s.fecha_solicitud),
                    s.monto_solicitado?.toString(),
                    s.monto_aprobado?.toString(),
                    s.estado_display,
                    s.motivo_decision
                ];
                return valuesToSearch.some(v => (v || "").toString().toLowerCase().includes(lowerSearch));
            })
        );
        setPage(0);
    }, [searchTerm, solicitudes]);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando solicitudes...</div>;

    return (
        <div className="creditos-container">
            <div className="creditos-title-header">
                <h1><SolicitudIcon sx={{verticalAlign:'middle', mr:1}}/>Gestión de Solicitudes de Crédito</h1>
                {userPrivileges.includes('solicitudes_crear') && (
                    <Button 
                        variant="contained"  
                        startIcon={<AddIcon />} 
                        sx={{textTransform: 'none'}} 
                        onClick={() => navigate('/solicitudes/nueva')} 
                        className="add-button"
                    >
                        Nueva Solicitud
                    </Button>
                )}
            </div>

            {/* Buscador */}
            <Box className="creditos-toolbar" sx={{ mb: 2 }}>
                <TextField
                    placeholder="Buscar..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><SearchIcon className='search-icon' /></InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <ClearIcon />
                            </IconButton>
                        )
                    }}
                    sx={{ minWidth: 400, background: 'white', borderRadius: '8px' }}
                />
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TableContainer component={Paper} className="creditos-table" elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Solicitud</TableCell>
                            <TableCell align="center">Cliente</TableCell>
                            <TableCell align="center">Fecha Solicitud</TableCell>
                            <TableCell align="center">Monto Solicitado</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSolicitudes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sol) => (
                            <TableRow key={sol.id} hover>
                                <TableCell align="center">#{sol.id}</TableCell>
                                <TableCell align="center">{sol.cliente_info}</TableCell>
                                <TableCell align="center">{formatDate(sol.fecha_solicitud)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: '500' }}>{formatCurrency(sol.monto_solicitado)}</TableCell>
                                <TableCell align="center"><EstadoChip estado={sol.estado_display} /></TableCell>
                                <TableCell align="center">
                                    {sol.estado === 'Pendiente' ? (
                                        userPrivileges.includes('solicitudes_gestionar') && (
                                            <Tooltip title="Revisar Solicitud">
                                                <IconButton color="primary" onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                                                    <ReviewIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    ) : (
                                        <Tooltip title="Ver Detalle de la Decisión">
                                            <IconButton color="info" onClick={() => handleOpenDetailModal(sol)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredSolicitudes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No se encontraron solicitudes.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredSolicitudes.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
            />

            {/* Modal Detalle */}
            <Dialog open={isDetailModalOpen} onClose={handleCloseDetailModal} maxWidth="sm" fullWidth className="detail-dialog">
                <DialogTitle sx={{ borderBottom: '1px solid #ddd' }}>
                    <InfoIcon sx={{ verticalAlign:'middle', mr:1 }} />Detalle de la Solicitud #{selectedSolicitud?.id}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedSolicitud && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography align="center" variant="subtitle2" color="textSecondary">Cliente</Typography>
                                <Typography align="center" variant="body1">{selectedSolicitud.cliente_info}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography align="center" variant="subtitle2" color="textSecondary">Fecha Solicitud</Typography>
                                <Typography align="center" variant="body1">{formatDate(selectedSolicitud.fecha_solicitud)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
                                    <EstadoChip estado={selectedSolicitud.estado_display} />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography align="center" variant="subtitle2" color="textSecondary">Monto Solicitado</Typography>
                                <Typography align="center" variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(selectedSolicitud.monto_solicitado)}
                                </Typography>
                            </Grid>
                            {selectedSolicitud.estado === 'Aprobada' && (
                                <Grid item xs={6}>
                                    <Typography align="center" variant="subtitle2" color="textSecondary">Monto Aprobado</Typography>
                                    <Typography align="center" variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(selectedSolicitud.monto_aprobado)}
                                    </Typography>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography align="center" variant="subtitle2" color="textSecondary">Notas / Motivo de la Decisión</Typography>
                                <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, background: '#f9f9f9' }}>
                                    <Typography align="center" variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
                                        {selectedSolicitud.motivo_decision || "No se proporcionaron notas para esta decisión."}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button sx={{textTransform: 'none'}} onClick={handleCloseDetailModal}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Solicitudes;
