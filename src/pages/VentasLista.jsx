import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, TextField, Typography, CircularProgress, TablePagination, Tooltip, IconButton,
    Dialog, DialogContent, DialogTitle, DialogActions, Grid, InputAdornment, Alert, Divider, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';

import {
    Add as AddIcon, Visibility as VisibilityIcon, Print as PrintIcon,
    Search as SearchIcon, Clear as ClearIcon, SyncAlt as DevolucionIcon, Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import '../styles/Ventas.css';
import { MapPin, Store, Truck } from 'lucide-react';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const Estado = styled('span')(({ estado }) => {
    const estilos = {
        'Completada': { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' },
        'Anulada': { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
        'Pendiente': { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }
    }[estado] || {};

    return {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: estilos.background,
        color: estilos.color,
        border: estilos.border,
        fontWeight: 500,
        textTransform: 'capitalize'
    };
});

const VentasLista = () => {
    const navigate = useNavigate();
    const { authTokens, user, logout } = useAuth();

    const canCreateVenta = user?.privileges?.includes('ventas_crear');
    const canProcessReturn = user?.privileges?.includes('ventas_devolucion');

    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVentas, setFilteredVentas] = useState([]);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [detalleLoading, setDetalleLoading] = useState(false);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);

    const fetchVentas = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) return;

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/ventas/`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Error al cargar la lista de ventas.');
            }
            const data = await response.json();
            setVentas(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    useEffect(() => {
  const lowerSearchTerm = searchTerm.toLowerCase();

  const filtered = ventas.filter(venta => {
    const rawFecha = venta.fecha || "";
    const formattedFecha = new Date(venta.fecha).toLocaleDateString("es-CO", { timeZone: "UTC" });

    const rawTotal = venta.total?.toString() || "";
    const formattedTotal = formatCurrency(venta.total);

    const rowData = `
      ${venta.id}
      ${rawFecha} ${formattedFecha}
      ${venta.cliente_info || ""}
      ${venta.resumen_pago || ""}
      ${rawTotal} ${formattedTotal}
      ${venta.estado || ""} ${venta.estado_display || ""}
    `.toLowerCase();

    return rowData.includes(lowerSearchTerm);
  });

  setFilteredVentas(filtered);
  setPage(0);
}, [searchTerm, ventas]);


    const handleVerDetalle = async (ventaResumen) => {
        setVentaSeleccionada(ventaResumen);
        setDetalleOpen(true);
        setDetalleLoading(true);
        
        const token = authTokens?.access;
        try {
            const response = await fetch(`${API_BASE_URL}/ventas/${ventaResumen.id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error("No se pudieron cargar los detalles de la venta.");
            }
            const dataCompleta = await response.json();
            setVentaSeleccionada(dataCompleta);
        } catch (err) {
            console.error(err);
            setError("Error al cargar detalles: " + err.message);
        } finally {
            setDetalleLoading(false);
        }
    };

    const handleGeneratePdf = async (ventaId) => {
        const token = authTokens?.access;
        if (!token) return;

        setPdfLoadingId(ventaId);
        try {
            const response = await fetch(`${API_BASE_URL}/ventas/${ventaId}/pdf/`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `Error al generar PDF`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            alert(err.message);
        } finally {
            setPdfLoadingId(null);
        }
    };
    
    const getDevolucionTooltip = (venta) => {
        if (venta.devolucion) return "Esta venta ya tiene una devolución registrada.";
        if (venta.estado !== 'Completada') return "Solo se pueden procesar devoluciones de ventas completadas.";
        if (!venta.es_ajustable) return "El plazo para devoluciones ha vencido.";
        return "Registrar Devolución/Cambio";
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando ventas...</div>;

    return (
        <div className="ventas-container">
            <div className="ventas-title-header">
                <h1>Gestión de Ventas</h1>
            </div>
            <Box className="ventas-toolbar">
                <TextField
                    placeholder="Buscar..." variant="outlined" size="small"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
                {canCreateVenta && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/ventas/nueva')} className="add-button">
                        Registrar Venta
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TableContainer component={Paper} className="ventas-table" elevation={0} variant="outlined">
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Venta</TableCell>
                            <TableCell align="center">Fecha</TableCell>
                            <TableCell align="center">Cliente</TableCell>
                            <TableCell align="center">Resumen de Pago</TableCell>
                            <TableCell align="center">Total Venta</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVentas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((venta) => (
                            <TableRow key={venta.id} hover>
                                <TableCell align="center">#{venta.id}</TableCell>
                                <TableCell align="center">{new Date(venta.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</TableCell>
                                <TableCell align="center">{venta.cliente_info}</TableCell>
                                <TableCell align="center">{venta.resumen_pago}</TableCell>
                                <TableCell align="center" sx={{fontWeight: 'bold'}}>{formatCurrency(venta.total)}</TableCell>
                                <TableCell align="center">
                                    <Estado estado={venta.estado}>
                                        {venta.estado_display}
                                    </Estado>
                                </TableCell>
                                <TableCell align="center" className="action-buttons">
                                    <Tooltip title="Ver Detalle"><IconButton size="small" color="info" onClick={() => handleVerDetalle(venta)}><VisibilityIcon /></IconButton></Tooltip>
                                    
                                    <Tooltip title={getDevolucionTooltip(venta)}>
                                        <span>
                                            <IconButton size="small" color="success" disabled={!venta.es_ajustable || !canProcessReturn} onClick={() => navigate(`/ventas/${venta.id}/devolucion`)}>
                                                <DevolucionIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Imprimir Factura">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleGeneratePdf(venta.id)}
                                                disabled={pdfLoadingId === venta.id || (venta.estado !== 'Completada' && !venta.devolucion)}
                                            >
                                                {pdfLoadingId === venta.id ? <CircularProgress size={20} /> : <PrintIcon sx={{ color: "black" }} />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredVentas.length === 0 && !loading && (
                            <TableRow><TableCell colSpan={7} align="center" className="no-data">No se encontraron ventas.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredVentas.length}
                rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                className="table-pagination"
                labelRowsPerPage="Filas por página:"
            />

            <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} fullWidth maxWidth="md" className="venta-dialog">
                <DialogTitle className="venta-dialog-title"><InfoIcon sx={{verticalAlign: 'middle', mr: 1}}/>Detalle de Venta #{ventaSeleccionada?.id}</DialogTitle>
                <DialogContent className="dialog-content">
                    {detalleLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                            <CircularProgress />
                        </Box>
                    ) : ventaSeleccionada && (
                        <>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary" align="center">Cliente</Typography>
                                    <Typography variant="h6" align="center">{ventaSeleccionada.cliente_info}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3} align="center">
                                    <Typography variant="body2" color="text.secondary" >Fecha</Typography>
                                    <Typography variant="body1">{new Date(ventaSeleccionada.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3} align="center">
                                    <Typography variant="body2" color="text.secondary">Estado</Typography>
                                    <Estado estado={ventaSeleccionada.estado}>{ventaSeleccionada.estado_display}</Estado>
                                </Grid>
                                <Grid item xs={12} align="center">
                                    <Typography variant="body2" color="text.secondary">Método de Entrega</Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5}}>
                                        {ventaSeleccionada.metodo_entrega === 'tienda' ? <Store size={18} /> : <Truck size={18} />}
                                        <Typography variant="body1" sx={{ml: 1}}>
                                            {ventaSeleccionada.metodo_entrega_display}
                                            {ventaSeleccionada.direccion_entrega && (
                                                <Tooltip title={ventaSeleccionada.direccion_entrega} placement="bottom">
                                                    <MapPin size={16} style={{marginLeft: '8px', cursor: 'pointer'}} />
                                                </Tooltip>
                                            )}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" align="center">Forma de Pago</Typography>
                                    <Typography align="center" variant="body1">{ventaSeleccionada.resumen_pago}</Typography>
                                </Grid>
                                {ventaSeleccionada.observaciones && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Observaciones</Typography><Typography>{ventaSeleccionada.observaciones}</Typography></Grid>}
                                
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Productos Vendidos</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center">Producto</TableCell>
                                                    <TableCell align="center">Cant.</TableCell>
                                                    <TableCell align="center">P. Unit.</TableCell>
                                                    <TableCell align="center">Subtotal</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {ventaSeleccionada?.detalles && ventaSeleccionada.detalles.length > 0 ? (
                                                    ventaSeleccionada.detalles.map((detalle) => (
                                                        <TableRow key={detalle.id}>
                                                            <TableCell align="center">{detalle.producto_nombre}</TableCell>
                                                            <TableCell align="center">{detalle.cantidad}</TableCell>
                                                            <TableCell align="center">{formatCurrency(detalle.precio_unitario_venta)}</TableCell>
                                                            <TableCell align="center">{formatCurrency(detalle.subtotal)}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center">
                                                            No se encontraron detalles para esta venta.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12} container justifyContent="flex-end">
                                    <Box sx={{width: '300px', textAlign: 'right', mt: 1}}>
                                        <Typography>Subtotal: {formatCurrency(ventaSeleccionada.subtotal)}</Typography>
                                        <Typography>IVA (19%): {formatCurrency(ventaSeleccionada.iva)}</Typography>
                                        <Typography variant="h6">Total Venta: {formatCurrency(ventaSeleccionada.total)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            
                            {ventaSeleccionada.devolucion && (
                                <Box mt={4} p={2} sx={{ border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                                    <Divider sx={{ mb: 2 }}><Chip label="Detalle de la Devolución" color="primary" /></Divider>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2"><b>Fecha Devolución:</b> {new Date(ventaSeleccionada.devolucion.fecha_devolucion).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2"><b>Reembolso:</b> {ventaSeleccionada.devolucion.tipo_reembolso_display}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2"><b>Motivo General:</b> {ventaSeleccionada.devolucion.motivo_general || 'No especificado'}</Typography>
                                        </Grid>
                                    </Grid>

                                    {ventaSeleccionada.devolucion.items_devueltos?.length > 0 && (
                                        <>
                                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>Productos Devueltos</Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead><TableRow><TableCell align="center">Producto</TableCell><TableCell align="center">Cant.</TableCell><TableCell align="center">Motivo</TableCell><TableCell align="center">Subtotal</TableCell></TableRow></TableHead>
                                                    <TableBody>
                                                        {ventaSeleccionada.devolucion.items_devueltos.map((item, i) => (
                                                            <TableRow key={`d-${i}`}><TableCell align="center">{item.producto_nombre}</TableCell><TableCell align="center">{item.cantidad}</TableCell><TableCell>{item.motivo_display}</TableCell><TableCell align="center">{formatCurrency(item.subtotal)}</TableCell></TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </>
                                    )}
                                    {ventaSeleccionada.devolucion.items_cambio?.length > 0 && (
                                        <>
                                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>Productos de Cambio Entregados</Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead><TableRow><TableCell>Producto</TableCell><TableCell align="center">Cant.</TableCell><TableCell align="right">P. Unit.</TableCell><TableCell align="right">Subtotal</TableCell></TableRow></TableHead>
                                                    <TableBody>
                                                        {ventaSeleccionada.devolucion.items_cambio.map((item, i) => (
                                                            <TableRow key={`n-${i}`}><TableCell>{item.producto_nombre}</TableCell><TableCell align="center">{item.cantidad}</TableCell><TableCell align="right">{formatCurrency(item.precio_unitario_actual)}</TableCell><TableCell align="right">{formatCurrency(item.subtotal)}</TableCell></TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </>
                                    )}

                                    <Box sx={{width: '100%', textAlign: 'right', mt: 2}}>
                                        <Typography>Total Devolución: <span style={{color: 'green'}}>{formatCurrency(ventaSeleccionada.devolucion.total_productos_devueltos)}</span></Typography>
                                        <Typography>Total Cambio: <span style={{color: 'red'}}>{formatCurrency(ventaSeleccionada.devolucion.total_productos_cambio)}</span></Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Balance de la Devolución: {formatCurrency(ventaSeleccionada.devolucion.balance_final)}</Typography>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={() => setDetalleOpen(false)} variant="contained" sx={{textTransform: 'none'}}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default VentasLista;