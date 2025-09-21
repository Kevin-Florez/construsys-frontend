import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, TextField, Typography, CircularProgress, TablePagination, Tooltip, IconButton,
    Dialog, DialogContent, DialogTitle, DialogActions, Grid, InputAdornment, Alert
} from '@mui/material';
import {
    Add as AddIcon, Visibility as VisibilityIcon,
    Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext'; // ✨ 1. Importamos el hook useAuth
import '../styles/Compras.css';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });


const ComprasLista = () => {
    const navigate = useNavigate();
    // ✨ 2. Obtenemos los datos de autenticación y privilegios del contexto
    const { authTokens, userPrivileges, logout } = useAuth();

    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCompras, setFilteredCompras] = useState([]);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [compraSeleccionada, setCompraSeleccionada] = useState(null);

    const fetchCompras = useCallback(async () => {
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
            const response = await fetch(`${API_BASE_URL}/compras/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Error al cargar las compras.');
            }
            const data = await response.json();
            setCompras(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos dependencias
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchCompras();
        }
    }, [authTokens, fetchCompras]);


    useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    setFilteredCompras(
        compras.filter(compra => {
            // Listado de campos que quieres incluir en la búsqueda
            const campos = [
                compra.numero_factura,
                compra.proveedor_nombre,
                compra.total,
                new Date(compra.fecha_compra).toLocaleDateString('es-CO', { timeZone: 'UTC' }),
                formatDateTime(compra.fecha_registro),
                compra.estado_display,
            ];

            return campos.some(campo =>
                (campo ? campo.toString().toLowerCase() : "").includes(lowerSearchTerm)
            );
        })
    );
}, [searchTerm, compras]);



    const handleVerDetalle = (compra) => {
        setCompraSeleccionada(compra);
        setDetalleOpen(true);
    };
    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <div className="compras-container">
            <div className="compras-title-header">
                <h1>Gestión de Compras</h1>
            </div>

            <Box className="compras-toolbar">
                <TextField
                    placeholder="Buscar..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>,
                        endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
                {/* ✨ 5. Ocultamos el botón si el usuario no tiene el privilegio */}
                {userPrivileges.includes('compras_crear') && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/compras/nueva')} className="add-button">
                        Registrar Compra
                    </Button>
                )}
            </Box>

            {loading ? <div className="loading-indicator"><CircularProgress /></div> : error ? <Alert severity="error">{error}</Alert> : (
                <>
                    <TableContainer component={Paper} className="compras-table" elevation={2}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {/* ✨ Columna de ID cambiada a N° Factura */}
                                    <TableCell align="center">N° Factura</TableCell>
                                    <TableCell align="center">Proveedor</TableCell>
                                    <TableCell align="center">Total Compra</TableCell>
                                    <TableCell align="center">Fecha Compra</TableCell>
                                    <TableCell align="center">Fecha Registro</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCompras.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((compra) => (
                                    <TableRow key={compra.id} hover className={`estado-compra-${compra.estado?.toLowerCase()}`}>
                                        {/* ✨ Celda de ID cambiada a numero_factura */}
                                        <TableCell align="center" sx={{ fontWeight: 500 }}>{compra.numero_factura}</TableCell>
                                        <TableCell align="center">{compra.proveedor_nombre}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{formatCurrency(compra.total)}</TableCell>
                                        {/* ✨ Usamos fecha_compra */}
                                        <TableCell align="center">{new Date(compra.fecha_compra).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</TableCell>
                                        <TableCell align="center"> {/* 👈 Aquí usamos tu formatDateTime */}
                {formatDateTime(compra.fecha_registro)}
            </TableCell>
                                        <TableCell align="center">
                                            <Typography component="span" className={`estado-label estado-${compra.estado?.toLowerCase()}`}>
                                                {compra.estado_display}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" className="action-buttons">
                                            <Tooltip title="Ver Detalles"><IconButton size="small" color="info" onClick={() => handleVerDetalle(compra)}><VisibilityIcon /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCompras.length === 0 && (
                                    <TableRow><TableCell colSpan={7} align="center" className="no-data">No se encontraron compras.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredCompras.length}
                        rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage} className="table-pagination"
                        labelRowsPerPage="Filas por página:"
                    />
                </>
            )}
            
            <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} fullWidth maxWidth="md" className="compra-dialog">
                <DialogTitle className="compra-dialog-title">
                    <InfoIcon sx={{verticalAlign: 'middle', mr: 1}} />
                    {/* ✨ Título del modal actualizado */}
                    Detalle de Compra - Factura #{compraSeleccionada?.numero_factura}
                </DialogTitle>
                <DialogContent className="compra-dialog-content">
                    {compraSeleccionada && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}><Typography><strong>Proveedor:</strong> {compraSeleccionada.proveedor_nombre}</Typography></Grid>
                            {/* ✨ Mostramos ambas fechas */}
                            <Grid item xs={12} sm={6}><Typography><strong>Fecha Compra:</strong> {new Date(compraSeleccionada.fecha_compra).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography><strong>N° Factura:</strong> {compraSeleccionada.numero_factura}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography><strong>Fecha Registro:</strong> {formatDateTime(compraSeleccionada.fecha_registro)}</Typography></Grid>
                            <Grid item xs={12} className="compra-detalle-section">
                                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Productos</Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center">Producto</TableCell>
                                                <TableCell align="center">Cantidad</TableCell>
                                                <TableCell align="center">Costo Unitario</TableCell>
                                                <TableCell align="center">Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {compraSeleccionada.items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell align="center">{item.producto_nombre}</TableCell>
                                                    <TableCell align="center">{item.cantidad}</TableCell>
                                                    <TableCell align="center">{formatCurrency(item.costo_unitario)}</TableCell>
                                                    <TableCell align="center">{formatCurrency(item.subtotal)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                                <Typography>Subtotal: {formatCurrency(compraSeleccionada.subtotal)}</Typography>
                                <Typography>IVA (19%): {formatCurrency(compraSeleccionada.iva)}</Typography>
                                <Typography variant="h6">Total: {formatCurrency(compraSeleccionada.total)}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={() => setDetalleOpen(false)} variant="contained" sx={{textTransform: 'none'}}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ComprasLista;