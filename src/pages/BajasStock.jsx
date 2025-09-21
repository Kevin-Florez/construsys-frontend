// src/pages/BajasStock.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, TextField, InputAdornment, 
    IconButton, TablePagination, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Autocomplete
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Add as AddIcon, Cancel as CancelIcon, Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import "../styles/BajasInventario.css"; // Puedes usar el mismo CSS

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const MOTIVO_BAJA_CHOICES = {
    'DANIO_INTERNO': 'Daño en almacén',
    'PERDIDA': 'Pérdida o hurto',
    'OTRO': 'Otro motivo'
};

const BajasStock = () => {
    const [bajas, setBajas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { authTokens, user } = useAuth();
    const canCreateBaja = user?.privileges?.includes('stock_registrar_baja');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newBajaData, setNewBajaData] = useState({ producto_id: null, cantidad: 1, motivo: 'DANIO_INTERNO', descripcion: '' });
    const [productosList, setProductosList] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchBajas = useCallback(async () => {
        if (!authTokens) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stock/bajas/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });
            if (!response.ok) throw new Error('Error al cargar la lista de bajas de stock.');
            const data = await response.json();
            setBajas(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => { fetchBajas(); }, [fetchBajas]);

    const handleOpenCreateModal = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/productos/?activo=true`, { headers: { 'Authorization': `Bearer ${authTokens.access}` }});
            if (!response.ok) throw new Error("No se pudo cargar la lista de productos.");
            const data = await response.json();
            setProductosList(Array.isArray(data) ? data : []);
            setCreateModalOpen(true);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCloseCreateModal = () => {
        setCreateModalOpen(false);
        setNewBajaData({ producto_id: null, cantidad: 1, motivo: 'DANIO_INTERNO', descripcion: '' });
    };

    const handleCreateBajaManual = async () => {
        if (!newBajaData.producto_id || !newBajaData.descripcion.trim()) {
            toast.error("Debe seleccionar un producto y describir el motivo.");
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stock/bajas/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(newBajaData)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(Object.values(errData).flat().join(' '));
            }
            toast.success("Baja manual registrada con éxito. El stock ha sido actualizado.");
            fetchBajas();
            handleCloseCreateModal();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredBajas = useMemo(() => {
    if (!Array.isArray(bajas)) return [];
    const term = searchTerm.toLowerCase();

    return bajas.filter(b => {
        const valuesToSearch = [
            b.id?.toString(),
            b.producto_nombre,
            b.descripcion,
            b.motivo_display,
            formatDate(b.fecha_baja) // convierte la fecha a texto legible
        ];

        return valuesToSearch.some(value =>
            (value || "").toString().toLowerCase().includes(term)
        );
    });
}, [bajas, searchTerm]);

    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando registros...</div>;
    if (error) return <Alert severity="error" sx={{m: 3}}>{error}</Alert>;

    return (
        <div className="marcas-container">
            <div className="marcas-title-header">
                <h1>Bajas de Stock</h1>
            </div>

            <Box className="bajas-inv-toolbar">
                <TextField
                    fullWidth size="small" placeholder="Buscar..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input" variant="outlined"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>)
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
                {canCreateBaja && (
                    <Button
                        variant="contained" startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal} className="add-button"
                    >
                        Registrar Baja Manual
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} className="bajas-inv-table" elevation={0} variant="outlined">
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Fecha de Baja</TableCell>
                            <TableCell align="center">Producto</TableCell>
                            <TableCell align="center">Cantidad</TableCell>
                            <TableCell align="center">Motivo</TableCell>
                            <TableCell align="center">Descripción</TableCell>
                            <TableCell align="center">Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBajas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((baja) => (
                            <TableRow key={baja.id} hover>
                                <TableCell align="center">{formatDate(baja.fecha_baja)}</TableCell>
                                <TableCell align="center">{baja.producto_nombre}</TableCell>
                                <TableCell align="center">{baja.cantidad}</TableCell>
                                <TableCell align="center">{baja.motivo_display}</TableCell>
                                <TableCell align="center">{baja.descripcion}</TableCell>
                                <TableCell align="center">
                                    <span className="resolucion-label desechado">Baja Definitiva</span>
                                </TableCell>
                            </TableRow>
                        ))}
                         {filteredBajas.length === 0 && !loading && (
                            <TableRow><TableCell colSpan={6} align="center" className="no-data">No se encontraron registros de bajas de stock.</TableCell></TableRow>
                         )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={filteredBajas.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} className="table-pagination" labelRowsPerPage="Filas por página:" />

            <Dialog open={createModalOpen} onClose={handleCloseCreateModal} fullWidth maxWidth="sm" className="baja-dialog">
                <DialogTitle className="dialog-title"><InfoIcon sx={{verticalAlign:'middle', mr:1}}/>Registrar Baja Manual de Stock</DialogTitle>
                <DialogContent className="dialog-content">
                    <Autocomplete
                        options={productosList}
                        getOptionLabel={(option) => `${option.nombre} (Stock: ${option.stock_actual})`}
                        onChange={(e, newValue) => setNewBajaData({ ...newBajaData, producto_id: newValue?.id || null })}
                        renderInput={(params) => <TextField {...params} label="Producto" margin="normal" required />}
                    />
                    <TextField
                        label="Cantidad a dar de baja" type="number" fullWidth margin="normal" required
                        value={newBajaData.cantidad}
                        onChange={(e) => setNewBajaData({ ...newBajaData, cantidad: parseInt(e.target.value) || 1 })}
                        inputProps={{ min: 1 }}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="motivo-baja-label">Motivo</InputLabel>
                        <Select
                            labelId="motivo-baja-label" value={newBajaData.motivo}
                            onChange={(e) => setNewBajaData({ ...newBajaData, motivo: e.target.value })}
                            label="Motivo"
                        >
                            {Object.entries(MOTIVO_BAJA_CHOICES).map(([key, value]) => (
                                <MenuItem key={key} value={key}>{value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Descripción detallada del Motivo" multiline rows={3} fullWidth margin="normal" required
                        value={newBajaData.descripcion}
                        onChange={(e) => setNewBajaData({ ...newBajaData, descripcion: e.target.value })}
                    />
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCloseCreateModal} startIcon={<CancelIcon />} sx={{textTransform: 'none'}} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleCreateBajaManual} variant="contained" startIcon={<SaveIcon />} sx={{textTransform: 'none'}} disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : 'Confirmar Baja'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default BajasStock;