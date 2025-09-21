// src/pages/GestionDevoluciones.jsx

import React, { useState, useEffect, useCallback, useMemo} from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Tooltip, IconButton, Chip,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField, Grid, Divider,
    TablePagination, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { 
    Send as SendIcon, CheckCircle as CheckCircleIcon, Visibility as VisibilityIcon, 
    Cancel as CancelIcon, Info as InfoIcon, ReceiptLong as VentaIcon,
    Person as PersonIcon, Event as EventIcon, Notes as NotesIcon,
    Inventory2 as InventoryIcon, MoveToInbox as EnvioIcon, Save as SaveIcon,
    Search as SearchIcon, Clear as ClearIcon
} from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import "../styles/GestionDevoluciones.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'N/A';

const getGestionStatusChip = (gestion, esDefectuoso) => {
    if (!gestion && esDefectuoso) {
        return { backgroundColor: '#ffedd5', color: '#9a3412', label: 'Pendiente de Gestión' };
    }
    if (!gestion) {
        return { backgroundColor: '#e5e7eb', color: '#4b5563', label: 'No Requiere Gestión' };
    }
    const styles = {
        PENDIENTE: { backgroundColor: '#e0f2fe', color: '#0284c7', label: 'Pendiente de Envío' },
        ENVIADA: { backgroundColor: '#cffafe', color: '#0891b2', label: 'Enviada a Proveedor' },
        RECIBIDO_PARCIAL: { backgroundColor: '#fef3c7', color: '#b45309', label: 'Recibido Parcial' },
        COMPLETADA: { backgroundColor: '#dcfce7', color: '#16a34a', label: 'Gestión Completada' },
    };
    return styles[gestion.estado] || { backgroundColor: '#f3f4f6', color: '#4b5563', label: gestion.estado_display };
};

const GestionDevoluciones = () => {
    const [devoluciones, setDevoluciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { authTokens, user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewFilter, setViewFilter] = useState('defectuosos');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [gestionModalOpen, setGestionModalOpen] = useState(false);
    const [recepcionModalOpen, setRecepcionModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDevolucion, setSelectedDevolucion] = useState(null);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [proveedoresList, setProveedoresList] = useState([]);
    const [itemsParaRecepcion, setItemsParaRecepcion] = useState([]);
    const [productosList, setProductosList] = useState([]);
    const [gestionParaRecepcion, setGestionParaRecepcion] = useState(null);
    const [saving, setSaving] = useState(false);
    const [fechaRecepcion, setFechaRecepcion] = useState(new Date().toISOString().slice(0, 10));

    const canCreateGestion = user?.privileges?.includes('devoluciones_crear_devolucion_proveedor');
    const canEditGestion = user?.privileges?.includes('devoluciones_editar_devolucion_proveedor');

    const fetchData = useCallback(async () => {
        if (!authTokens) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/devoluciones/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });
            if (!response.ok) throw new Error('No se pudo cargar la lista de devoluciones.');
            const data = await response.json();
            setDevoluciones(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 🔹 Función auxiliar para normalizar texto (quita acentos y pasa a minúsculas)
const normalizeText = (text) => {
    return (text || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const filteredDevoluciones = useMemo(() => {
    if (!Array.isArray(devoluciones)) return [];

    return devoluciones.filter(dev => {
        const cliente = dev.cliente?.nombre_completo || "";
        const ventaOriginal = dev.venta_original?.toString() || "";
        const fechaDevolucion = dev.fecha_devolucion || "";
        const fechaRecepcion = dev.gestion_proveedor?.fecha_recepcion_final || "";
        const itemsDefectuosos = dev.items_devueltos.filter(item => item.motivo === "PRODUCTO_DEFECTUOSO");
        const estadoGestion = dev.gestion_proveedor?.estado_display || "";

        // 🔹 unificamos toda la info de la fila
        const rowData = `
            ${dev.id}
            ${ventaOriginal}
            ${cliente}
            ${formatDate(fechaDevolucion)}
            ${formatDate(fechaRecepcion)}
            ${itemsDefectuosos.map(i => `${i.cantidad}x ${i.producto_nombre}`).join(" ")}
            ${estadoGestion}
        `;

        return normalizeText(rowData).includes(normalizeText(searchTerm));
    }).filter(dev => {
        // 🔹 luego aplicamos el filtro de vista
        const tieneDefectuosos = dev.items_devueltos.some(item => item.motivo === "PRODUCTO_DEFECTUOSO");
        const tieneGestion = !!dev.gestion_proveedor;

        if (viewFilter === "defectuosos") return tieneDefectuosos;
        if (viewFilter === "sin_gestion") return tieneDefectuosos && !tieneGestion;
        return true; // "todos"
    });
}, [devoluciones, searchTerm, viewFilter]);


    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setViewFilter(newFilter);
            setPage(0);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDetailModal = (devolucion) => {
        setSelectedDevolucion(devolucion);
        setDetailModalOpen(true);
    };
    const handleCloseDetailModal = () => setDetailModalOpen(false);

    const handleOpenGestionModal = async (devolucion) => {
        setSelectedDevolucion(devolucion);
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/proveedores/?activo=true`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } });
            if (!response.ok) throw new Error("No se pudo cargar la lista de proveedores.");
            const data = await response.json();
            setProveedoresList(Array.isArray(data) ? data : []);
            setGestionModalOpen(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCloseGestionModal = () => {
        setGestionModalOpen(false);
        setSelectedDevolucion(null);
        setSelectedProveedor(null);
    };

    const handleConfirmarEnvio = async () => {
        if (!selectedProveedor) {
            toast.error("Debe seleccionar un proveedor.");
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/devoluciones/${selectedDevolucion.id}/enviar-a-proveedor/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify({ proveedor_id: selectedProveedor.id })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "No se pudo iniciar la gestión con el proveedor.");
            }
            toast.success("Gestión con proveedor iniciada y marcada como 'Enviada'.");
            fetchData();
            handleCloseGestionModal();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenRecepcionModal = async (gestion) => {
        setGestionParaRecepcion(gestion);
        setItemsParaRecepcion(gestion.items.map(item => ({
            id: item.id,
            producto_original_nombre: item.producto_original_nombre,
            cantidad_enviada: item.cantidad_enviada,
            cantidad_recibida: item.cantidad_enviada,
            producto_recibido: null,
            notas_recepcion: ''
        })));
        setFechaRecepcion(new Date().toISOString().slice(0, 10));
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/productos/?activo=true`, { headers: { 'Authorization': `Bearer ${authTokens.access}` } });
            if (!response.ok) throw new Error("No se pudo cargar la lista de productos.");
            const data = await response.json();
            setProductosList(Array.isArray(data) ? data : []);
            setRecepcionModalOpen(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCloseRecepcionModal = () => setRecepcionModalOpen(false);
    
    const handleRecepcionItemChange = (itemId, field, value) => {
        setItemsParaRecepcion(prev => prev.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        ));
    };

    const handleConfirmarRecepcion = async () => {
        setSaving(true);
        const payload = {
            fecha_recepcion_final: fechaRecepcion,
            items_recepcion: itemsParaRecepcion.map(item => ({
                id: item.id,
                cantidad_recibida: parseInt(item.cantidad_recibida, 10) || 0,
                producto_recibido: item.producto_recibido ? item.producto_recibido.id : null,
                notas_recepcion: item.notas_recepcion
            }))
        };
        try {
            const response = await fetch(`${API_BASE_URL}/devoluciones/gestion-proveedor/${gestionParaRecepcion.id}/confirmar-recepcion/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Error al confirmar la recepción.");
            toast.success("Recepción confirmada y stock actualizado!");
            fetchData();
            handleCloseRecepcionModal();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}><CircularProgress /></div>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box className="marcas-container">
            <Box className="marcas-title-header">
                <h1>Gestión de Devoluciones</h1>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className='search-icon' /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>)
                    }}
                    sx={{minWidth: '400px', backgroundColor: 'white' }}
                />
                <ToggleButtonGroup
                    color="primary"
                    value={viewFilter}
                    exclusive
                    onChange={handleFilterChange}
                    aria-label="Filtro de devoluciones"
                >
                    <ToggleButton sx={{textTransform: 'none'}} value="defectuosos">Con Defectuosos</ToggleButton>
                    <ToggleButton sx={{textTransform: 'none'}} value="sin_gestion">Pendientes de Gestión</ToggleButton>
                    <ToggleButton sx={{textTransform: 'none'}} value="todos">Mostrar Todas</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <TableContainer component={Paper} className='ñññ'>
                <Table className="devoluciones-table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Devolución</TableCell>
                            <TableCell align="center">Venta Original</TableCell>
                            <TableCell align="center">Fecha Dev.</TableCell>
                            <TableCell align="center">Fecha Recepción</TableCell>
                            <TableCell align="center">Productos Defectuosos</TableCell>
                            <TableCell align="center">Estado Gestión</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredDevoluciones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((dev) => {
                            const itemsDefectuosos = dev.items_devueltos.filter(item => item.motivo === 'PRODUCTO_DEFECTUOSO');
                            const gestion = dev.gestion_proveedor;
                            const chipStyle = getGestionStatusChip(gestion, itemsDefectuosos.length > 0);
                            return (
                                <TableRow key={dev.id} hover>
                                    <TableCell align="center">#{dev.id}</TableCell>
                                    <TableCell align="center">#{dev.venta_original}</TableCell>
                                    <TableCell align="center">{formatDate(dev.fecha_devolucion)}</TableCell>
                                    <TableCell align="center">{formatDate(dev.gestion_proveedor?.fecha_recepcion_final)}</TableCell>
                                    <TableCell align="center">
                                        {itemsDefectuosos.length > 0 ? (
                                            <Tooltip title={itemsDefectuosos.map(i => `${i.cantidad}x ${i.producto_nombre}`).join(', ')}>
                                                <span>{`${itemsDefectuosos.length} item(s)`}</span>
                                            </Tooltip>
                                        ) : 'Ninguno'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={chipStyle.label} size="small" sx={{ ...chipStyle, fontWeight: 500 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalle">
                                            <IconButton color='primary' onClick={() => handleOpenDetailModal(dev)}><VisibilityIcon /></IconButton>
                                        </Tooltip>
                                        {itemsDefectuosos.length > 0 && !gestion && canCreateGestion && (
                                            <Tooltip title="Gestionar con Proveedor">
                                                <IconButton color="secondary" onClick={() => handleOpenGestionModal(dev)}><SendIcon /></IconButton>
                                            </Tooltip>
                                        )}
                                        {gestion?.estado === 'ENVIADA' && canEditGestion && (
                                            <Tooltip title="Confirmar Recepción">
                                                <IconButton color="success" onClick={() => handleOpenRecepcionModal(gestion)}><CheckCircleIcon /></IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredDevoluciones.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
            />

            <Dialog open={gestionModalOpen} onClose={handleCloseGestionModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><SendIcon sx={{ mr: 1 }}/> Iniciar Gestión con Proveedor</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Para la devolución <strong>#{selectedDevolucion?.id}</strong></Typography>
                    <Autocomplete
                        options={proveedoresList}
                        getOptionLabel={(option) => option.nombre}
                        value={selectedProveedor}
                        onChange={(event, newValue) => setSelectedProveedor(newValue)}
                        renderInput={(params) => <TextField {...params} label="Seleccionar Proveedor" margin="normal" required />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button sx={{textTransform: 'none'}} onClick={handleCloseGestionModal} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button sx={{textTransform: 'none'}} onClick={handleConfirmarEnvio} variant="contained" disabled={saving} startIcon={<SendIcon />}>
                        {saving ? <CircularProgress size={24} /> : "Marcar como Enviada"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={recepcionModalOpen} onClose={handleCloseRecepcionModal} maxWidth="md" fullWidth className="cliente-dialog">
                <DialogTitle className="dialog-title" sx={{ display: 'flex', alignItems: 'center' }}><CheckCircleIcon sx={{ mr: 1 }}/> Registrar Recepción de Productos</DialogTitle>
                <DialogContent>
                    <TextField
    label="Fecha de Recepción"
    type="date"
    value={fechaRecepcion}
    onChange={(e) => setFechaRecepcion(e.target.value)}
    fullWidth
    sx={{ mt: 2, mb: 2 }} // 🔹 separa un poco hacia abajo
    InputLabelProps={{ shrink: true }}
    inputProps={{
        max: new Date().toISOString().split("T")[0] // 🔹 bloquea fechas futuras
    }}
/>

                    {itemsParaRecepcion.map((item) => (
                        <Paper key={item.id} className="recepcion-item-card" variant="outlined">
                            <Typography className="recepcion-item-header">{item.producto_original_nombre}</Typography>
                            <Grid container spacing={2} className="recepcion-grid-container">
                                <Grid item xs={12} sm={4}><TextField label="Cantidad Enviada" value={item.cantidad_enviada} disabled fullWidth variant="filled" /></Grid>
                                <Grid item xs={12} sm={4}><TextField label="Cantidad Recibida" type="number" fullWidth value={item.cantidad_recibida} onChange={(e) => handleRecepcionItemChange(item.id, 'cantidad_recibida', e.target.value)} inputProps={{ min: 0, max: item.cantidad_enviada }} /></Grid>
                                <Grid item xs={12} sm={4}><Autocomplete options={productosList} getOptionLabel={(option) => option.nombre} value={productosList.find(p => p.id === (item.producto_recibido?.id || item.producto_recibido)) || null} onChange={(e, newValue) => handleRecepcionItemChange(item.id, 'producto_recibido', newValue)} renderInput={(params) => <TextField {...params} label="Producto Recibido (si es otro)" />} /></Grid>
                                <Grid item xs={12}><TextField label="Notas de Recepción" fullWidth value={item.notas_recepcion || ''} onChange={(e) => handleRecepcionItemChange(item.id, 'notas_recepcion', e.target.value)} /></Grid>
                            </Grid>
                        </Paper>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRecepcionModal} sx={{textTransform: 'none'}} startIcon={<CancelIcon />} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleConfirmarRecepcion} sx={{textTransform: 'none'}} variant="contained" color="success" startIcon={<SaveIcon />} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Confirmar y Actualizar Stock'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={detailModalOpen} onClose={handleCloseDetailModal} maxWidth="md" fullWidth className="detail-dialog">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><InfoIcon sx={{ mr: 1 }} /> Detalle de Devolución #{selectedDevolucion?.id}</DialogTitle>
                <DialogContent>
                    {selectedDevolucion && (
                        <Box>
                            <Paper className="detail-section" variant="outlined">
                                <Grid container spacing={0}>
                                    <Grid item xs={12} sm={6} sx={{ pr: { sm: 1 } }}>
                                        <Box className='detail-item'>
                                            <Typography className='detail-item-label'><PersonIcon fontSize="small" sx={{mr:1}}/>Cliente:</Typography>
                                            <Typography className='detail-item-value'>{selectedDevolucion.cliente.nombre_completo}</Typography>
                                        </Box>
                                        <Box className='detail-item'>
                                            <Typography className='detail-item-label'>Documento:</Typography>
                                            <Typography className='detail-item-value'>{selectedDevolucion.cliente.tipo_documento_display_corto} {selectedDevolucion.cliente.documento}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6} sx={{ pl: { sm: 1 }, borderLeft: { sm: '1px solid #eee' } }}>
                                        <Box className='detail-item'>
                                            <Typography className='detail-item-label'><VentaIcon fontSize="small" sx={{mr:1}}/>Venta Original:</Typography>
                                            <Typography className='detail-item-value'>#{selectedDevolucion.venta_original}</Typography>
                                        </Box>
                                        <Box className='detail-item'>
                                            <Typography className='detail-item-label'><EventIcon fontSize="small" sx={{mr:1}}/>Fecha:</Typography>
                                            <Typography className='detail-item-value'>{formatDate(selectedDevolucion.fecha_devolucion)}</Typography>
                                        </Box>
                                    </Grid>
                                    {selectedDevolucion.motivo_general && (
                                        <Grid item xs={12}>
                                            <Divider sx={{my:1}} />
                                            <Box sx={{mt:1}} className='detail-item'>
                                                <Typography className='detail-item-label'><NotesIcon fontSize="small" sx={{mr:1}}/>Motivo General:</Typography>
                                                <Typography className='detail-item-value'>{selectedDevolucion.motivo_general}</Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                            <Paper className="detail-section" variant="outlined">
                                <Typography variant="h6" className="detail-section-header"><InventoryIcon fontSize="small"/> Productos Devueltos por el Cliente</Typography>
                                <ul className="devolucion-productos-list">
                                    {selectedDevolucion.items_devueltos.map(item => <li key={item.id}>{item.cantidad} x {item.producto_nombre} <em>({item.motivo_display})</em></li>)}
                                </ul>
                            </Paper>
                            {selectedDevolucion.gestion_proveedor ? (
                                <Paper className="detail-section" variant="outlined">
                                    <Typography variant="h6" className="detail-section-header"><EnvioIcon fontSize="small"/> Gestión con Proveedor</Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><Box className='detail-item'><Typography className='detail-item-label'>Proveedor:</Typography><Typography className='detail-item-value'>{selectedDevolucion.gestion_proveedor.proveedor_nombre}</Typography></Box></Grid>
                                        <Grid item xs={6}><Box className='detail-item'><Typography className='detail-item-label'>Estado:</Typography><Chip label={selectedDevolucion.gestion_proveedor.estado_display} size="small" color="primary" /></Box></Grid>
                                        <Grid item xs={12}>
        <Box className='detail-item'>
            <Typography className='detail-item-label'><EventIcon fontSize="small" sx={{mr:1}}/>Fecha Recepción:</Typography>
            <Typography className='detail-item-value'>
                {formatDate(selectedDevolucion.gestion_proveedor.fecha_recepcion_final)}
            </Typography>
        </Box>
    </Grid>
                                    </Grid>
                                    <Divider sx={{ my: 2 }}><Typography variant="caption">Detalle de Recepción</Typography></Divider>
                                    {selectedDevolucion.gestion_proveedor.items.map(item => (
                                        <Box key={item.id} sx={{ mb: 1, borderLeft: '3px solid #e0e7ff', pl: 2, py:1 }}>
                                            <Typography><strong>Item:</strong> {item.producto_original_nombre}</Typography>
                                            <Box sx={{ pl: 2 }}>
                                                <Box className='detail-item'><Typography className='detail-item-label'>Cant. Enviada:</Typography><Typography className='detail-item-value'>{item.cantidad_enviada}</Typography></Box>
                                                {item.recepcion_confirmada ? (
                                                    <>
                                                        <Box className='detail-item'><Typography className='detail-item-label'>Cant. Recibida:</Typography><Typography className='detail-item-value' sx={{color:'success.main', fontWeight:'bold'}}>{item.cantidad_recibida}</Typography></Box>
                                                        <Box className='detail-item'><Typography className='detail-item-label'>Producto de Cambio:</Typography><Typography className='detail-item-value'>{item.producto_recibido_nombre || 'El mismo'}</Typography></Box>
                                                        {item.notas_recepcion && <Box className='detail-item'><Typography className='detail-item-label'>Notas:</Typography><Typography className='detail-item-value'>{item.notas_recepcion}</Typography></Box>}
                                                    </>
                                                ) : (<Typography variant="body2" sx={{color: 'text.secondary', mt:1}}><em>Aún no se ha registrado la recepción de este item.</em></Typography>)}
                                            </Box>
                                        </Box>
                                    ))}
                                </Paper>
                            ) : (
                                <Alert severity="info">
                                    {selectedDevolucion.items_devueltos.some(i => i.motivo === 'PRODUCTO_DEFECTUOSO') 
                                        ? "Esta devolución está pendiente de ser gestionada con un proveedor." 
                                        : "No se requiere gestión con proveedor para esta devolución."}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button sx={{textTransform: 'none'}} onClick={handleCloseDetailModal}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GestionDevoluciones;