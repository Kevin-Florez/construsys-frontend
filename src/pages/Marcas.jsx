import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, TextField, Dialog, DialogActions, DialogContent,
    DialogTitle, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, IconButton, Tooltip,
    CircularProgress, Typography, InputAdornment, Switch, FormControlLabel
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import '../styles/Marcas.css'; // <-- 1. Importamos el nuevo CSS

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const Marcas = () => {
    const { authTokens, user } = useAuth();
    
    const canCreate = user?.privileges?.includes('marcas_crear');
    const canEdit = user?.privileges?.includes('marcas_editar');
    const canDelete = user?.privileges?.includes('marcas_eliminar');

    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    // --- 2. Añadimos 'activo' al estado del formulario ---
    const [currentMarca, setCurrentMarca] = useState({ id: null, nombre: '', activo: true });

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [marcaToDelete, setMarcaToDelete] = useState(null);

    // --- 3. Estados para el diálogo de cambio de estado ---
    const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
    const [marcaToToggle, setMarcaToToggle] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchMarcas = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/marcas/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las marcas.');
            const data = await response.json();
            setMarcas(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => {
        fetchMarcas();
    }, [fetchMarcas]);

    const handleOpenModal = (marca = null) => {
        setEditMode(!!marca);
        setCurrentMarca(marca ? { ...marca } : { id: null, nombre: '', activo: true });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        if (actionLoading) return;
        setModalOpen(false);
    };

    const handleSave = async () => {
        if (!currentMarca.nombre.trim()) {
            toast.error('El nombre de la marca es obligatorio.');
            return;
        }
        
        setActionLoading(true);
        const url = editMode
            ? `${API_BASE_URL}/marcas/${currentMarca.id}/`
            : `${API_BASE_URL}/marcas/`;
        
        const method = editMode ? 'PUT' : 'POST';
        // --- 4. Enviamos el estado 'activo' en el body ---
        const body = JSON.stringify({ nombre: currentMarca.nombre, activo: currentMarca.activo });

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                },
                body: body
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.nombre?.[0] || 'Ocurrió un error al guardar.');
            }
            toast.success(`Marca ${editMode ? 'actualizada' : 'creada'} exitosamente.`);
            handleCloseModal();
            fetchMarcas();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    // --- 5. Lógica para manejar el cambio de estado ---
    const handleOpenToggleDialog = (marca) => {
        if (!canEdit) {
            toast.error("No tienes permiso para editar marcas.");
            return;
        }
        setMarcaToToggle(marca);
        setConfirmStatusOpen(true);
    };

    const handleConfirmToggleState = async () => {
        if (!marcaToToggle) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/marcas/${marcaToToggle.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                },
                body: JSON.stringify({ activo: !marcaToToggle.activo })
            });
            if (!response.ok) throw new Error("Error al cambiar el estado de la marca.");
            toast.success("Estado de la marca actualizado.");
            fetchMarcas();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
            setConfirmStatusOpen(false);
            setMarcaToToggle(null);
        }
    };
    
    // ... (lógica de borrado sin cambios)
    const handleOpenDeleteDialog = (marca) => {
        setMarcaToDelete(marca);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!marcaToDelete) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/marcas/${marcaToDelete.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            });
            if (!response.ok && response.status !== 204) throw new Error('No se pudo eliminar la marca.');
            toast.success('Marca eliminada.');
            setConfirmDeleteOpen(false);
            fetchMarcas();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };


    const filteredMarcas = marcas.filter(m => {
    const term = searchTerm.toLowerCase();

    const valuesToSearch = [
        m.id?.toString(),
        m.nombre,
        m.activo ? "activo" : "inactivo"
    ];

    return valuesToSearch.some(value =>
        (value || "").toString().toLowerCase().includes(term)
    );
});


    if (loading) {
        return <div className="loading-indicator"><CircularProgress /></div>;
    }

    // --- 6. Aplicamos la nueva estructura visual (clases CSS) ---
    return (
        <div className="marcas-container">
            <div className="marcas-title-header">
                <h1>Gestión de Marcas</h1>
            </div>
            
            <Box className="marcas-toolbar">
                <TextField
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>
                    }}
                    sx={{ minWidth: '400px', backgroundColor: 'white' }}
                />
                {canCreate && (
                    <Button variant="contained" className="add-button" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                        Agregar Marca
                    </Button>
                )}
            </Box>
            
            <TableContainer component={Paper} className="marcas-table">
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Nombre de la Marca</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMarcas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((marca) => (
                            <TableRow key={marca.id} hover className={!marca.activo ? "row-inactivo" : ""}>
                                <TableCell align="center">{marca.nombre}</TableCell>
                                {/* --- 7. Celda de Estado --- */}
                                <TableCell align="center">
                                    <span
                                        className={`estado-label ${marca.activo ? "activo" : "inactivo"} ${canEdit ? "estado-clickable" : ""}`}
                                        onClick={() => handleOpenToggleDialog(marca)}
                                    >
                                        {marca.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip  title="Editar">
                                        <span><IconButton color='primary' onClick={() => handleOpenModal(marca)} disabled={!canEdit}><EditIcon /></IconButton></span>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <span><IconButton onClick={() => handleOpenDeleteDialog(marca)} color="error" disabled={!canDelete}><DeleteIcon /></IconButton></span>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredMarcas.length}
                                    rowsPerPage={rowsPerPage} page={page} onPageChange={(event, newPage) => setPage(newPage)} 
                                    onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
                                    labelRowsPerPage="Filas por página:"
                                />
            </TableContainer>

            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle
                  sx={{
                    background: 'linear-gradient(to right, #e0f2fe, #bfdbfe)',
                    color: '#1e40af',
                    p: '16px 24px',
                    fontWeight: 600,
                    borderBottom: '1px solid #bfdbfe'
                  }}
                >
                  <InfoIcon sx={{ verticalAlign:'middle', mr:1 }} />{editMode ? 'Editar Marca' : 'Crear Nueva Marca'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Nombre de la Marca" type="text" fullWidth
                        variant="outlined" value={currentMarca.nombre}
                        onChange={(e) => setCurrentMarca({ ...currentMarca, nombre: e.target.value })}
                        disabled={actionLoading}
                    />
                    {/* --- 8. Switch para el estado en el modal --- */}
                    
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={actionLoading} startIcon={<CancelIcon/>} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={handleSave} sx={{textTransform:'none'}} variant="contained" disabled={actionLoading} startIcon={<SaveIcon/>}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- 9. Diálogo de confirmación para el estado --- */}
            <Dialog open={confirmStatusOpen} onClose={() => setConfirmStatusOpen(false)} className="confirm-estado">
                 <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                 <DialogContent>
                     <Typography>¿Estás seguro de que deseas {marcaToToggle?.activo ? 'desactivar' : 'activar'} la marca "<strong>{marcaToToggle?.nombre}</strong>"?</Typography>
                 </DialogContent>
                 <DialogActions>
                     <Button onClick={() => setConfirmStatusOpen(false)} color="inherit" variant="outlined" disabled={actionLoading} sx={{textTransform:'none'}}>Cancelar</Button>
                     <Button onClick={handleConfirmToggleState} sx={{textTransform:'none'}} color="success" variant="contained" disabled={actionLoading}>
                         {actionLoading ? <CircularProgress size={24} /> : 'Confirmar'}
                     </Button>
                 </DialogActions>
            </Dialog>

            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} className='confirm-dialog'>
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de que deseas eliminar "<strong>{marcaToDelete?.nombre}</strong>"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} sx={{textTransform:'none'}} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Marcas;