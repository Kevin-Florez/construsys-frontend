import React, { useState, useEffect, useCallback } from "react";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Snackbar, Alert, IconButton, Tooltip, TablePagination,
    InputAdornment, CircularProgress, Typography, Box
} from "@mui/material";
import {
    Visibility, Edit, Delete, Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon,
    Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext"; // ✨ 1. Importamos el hook useAuth
import "../styles/Categorias.css"; 

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const CategoriaProdutos = () => {
    // ✨ 2. Obtenemos los datos de autenticación y privilegios del contexto
    const { authTokens, userPrivileges } = useAuth();

    const [categorias, setCategorias] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [categoriaActual, setCategoriaActual] = useState({ 
        id: null, 
        nombre: "", 
        descripcion: "", 
        activo: true 
    });
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [apiError, setApiError] = useState(null); 

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredCategorias, setFilteredCategorias] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
    const [categoriaToToggle, setCategoriaToToggle] = useState(null);

    const showNotification = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchCategorias = useCallback(async () => {
        setLoading(true);
        setApiError(null); 
        // ✨ 3. Usamos el token del contexto
        const token = authTokens?.access;
        if (!token) {
            setApiError("Autenticación requerida.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/categorias/`, {
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error HTTP ${response.status}`);
            }
            const data = await response.json();
            setCategorias(Array.isArray(data) ? data : []);
        } catch (error) {
            setApiError(error.message); 
            showNotification(`Error al cargar categorías: ${error.message}`, "error");
            setCategorias([]); 
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos authTokens a la lista de dependencias
    }, [authTokens]);

    useEffect(() => {
        // Solo cargamos los datos si los tokens están disponibles
        if (authTokens) {
            fetchCategorias();
        }
    }, [fetchCategorias, authTokens]);

    useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredCategorias(
        categorias.filter(cat => {
            const valuesToSearch = [
                cat.id?.toString(),
                cat.nombre,
                cat.descripcion,
                cat.activo ? "activo" : "inactivo"
            ];

            return valuesToSearch.some(value =>
                (value || "").toString().toLowerCase().includes(term)
            );
        })
    );
    setPage(0);
}, [searchTerm, categorias]);


    const handleOpen = (categoria = null, mode = "add") => {
        setViewMode(mode === "view");
        setEditMode(mode === "edit");
        if (categoria) {
            setCategoriaActual({ 
                id: categoria.id,
                nombre: categoria.nombre || "",
                descripcion: categoria.descripcion || "",
                activo: categoria.activo !== undefined ? categoria.activo : true 
            });
        } else {
            setCategoriaActual({ id: null, nombre: "", descripcion: "", activo: true }); 
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setViewMode(false);
        setEditMode(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCategoriaActual(prev => ({ ...prev, [name]: value }));
    };
    
    const handleGuardar = async () => {
        if (!categoriaActual.nombre.trim() || !categoriaActual.descripcion.trim()) {
            showNotification("Nombre y descripción son obligatorios.", "error");
            return;
        }
        setActionLoading(true);
        const token = authTokens?.access;
        const method = editMode ? 'PUT' : 'POST';
        const url = editMode ? `${API_BASE_URL}/categorias/${categoriaActual.id}/` : `${API_BASE_URL}/categorias/`;
        const dataToSend = {
            nombre: categoriaActual.nombre,
            descripcion: categoriaActual.descripcion,
            activo: categoriaActual.activo
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dataToSend),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(Object.values(errorData).flat().join(' '));
            }
            showNotification(`Categoría ${editMode ? "actualizada" : "agregada"} correctamente`);
            fetchCategorias(); 
            handleClose();
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (categoria) => { 
        setSelectedForDeletion(categoria);
        setConfirmDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedForDeletion) return;
        setActionLoading(true);
        const token = authTokens?.access;
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${selectedForDeletion.id}/`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok && response.status !== 204) { 
                const errorData = await response.json();
                throw new Error(errorData.detail);
            }
            showNotification("Categoría eliminada correctamente");
            fetchCategorias();
        } catch (error) {
            showNotification(`Error al eliminar: ${error.message}`, "error");
        } finally {
            setActionLoading(false);
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
        }
    };
    
    const handleOpenStateConfirmDialog = (categoria) => {
        if (actionLoading) return;
        setCategoriaToToggle(categoria);
        setConfirmStatusDialogOpen(true);
    };

    const handleConfirmToggleState = () => {
        if (categoriaToToggle) {
            handleToggleActivoEnTabla(categoriaToToggle);
        }
        setConfirmStatusDialogOpen(false);
        setCategoriaToToggle(null);
    };

    const handleToggleActivoEnTabla = async (categoria) => { 
        setActionLoading(true);
        const token = authTokens?.access;
        const nuevoEstado = !categoria.activo;
        try {
            const response = await fetch(`${API_BASE_URL}/categorias/${categoria.id}/`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ activo: nuevoEstado }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail);
            }
            fetchCategorias(); 
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");

    if (loading && categorias.length === 0) {
        return <div className="loading-indicator"><CircularProgress /> Cargando categorías...</div>;
    }
    if (apiError && categorias.length === 0) {
        return <Alert severity="error" style={{ margin: '20px' }}>{`Error al cargar categorías: ${apiError}`}</Alert>;
    }

    return (
        <div className="categorias-container">
            <div className="categorias-title-header">
                <h1>Gestión de Categorías de Productos</h1>
            </div>

            <Box className="categorias-toolbar">
                <TextField
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input" 
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: ( <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch} edge="end"><ClearIcon fontSize="small" /></IconButton></InputAdornment>),
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }} 
                />
                {/* ✨ 5. Renderizado condicional del botón Agregar */}
                {userPrivileges.includes('categorias_crear') && (
                    <Button
                        variant="contained" color="primary" startIcon={<AddIcon />}
                        onClick={() => handleOpen(null, "add")} className="add-button"
                    >
                        Agregar Categoría
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} className="categorias-table" elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Nombre</TableCell>
                            <TableCell align="center">Descripción</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center" style={{minWidth: '130px'}}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategorias.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((cat) => (
                            <TableRow key={cat.id} className={!cat.activo ? "row-inactivo" : ""} hover>
                                <TableCell align="center">{cat.nombre}</TableCell>
                                <TableCell align="center">{cat.descripcion}</TableCell>
                                <TableCell align="center">
                                    <Typography
                                        component="span"
                                        className={`estado-label ${cat.activo ? "activo" : "inactivo"} ${userPrivileges.includes('categorias_editar') ? "estado-clickable" : ""}`}
                                        onClick={() => userPrivileges.includes('categorias_editar') && handleOpenStateConfirmDialog(cat)}
                                        tabIndex={userPrivileges.includes('categorias_editar') ? 0 : -1}
                                        role="button"
                                    >
                                        {cat.activo ? "Activo" : "Inactivo"}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" className="actions-cell">
                                    <div className="action-buttons">
                                        <Tooltip title="Ver detalles" arrow>
                                            <IconButton color="info" onClick={() => handleOpen(cat, "view")} size="small"><Visibility /></IconButton>
                                        </Tooltip>
                                        {/* ✨ 5. Renderizado condicional de los botones de acción */}
                                        <Tooltip title="Editar" arrow>
                                            <span>
                                                <IconButton color="primary" onClick={() => handleOpen(cat, "edit")} size="small" disabled={!userPrivileges.includes('categorias_editar')}>
                                                    <Edit />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" arrow>
                                            <span>
                                                <IconButton color="error" onClick={() => handleDelete(cat)} size="small" disabled={!userPrivileges.includes('categorias_eliminar') || (actionLoading && selectedForDeletion?.id === cat.id)}>
                                                    {actionLoading && selectedForDeletion?.id === cat.id ? <CircularProgress size={20} color="inherit"/> : <Delete />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={filteredCategorias.length} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    className="table-pagination"
                />
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className="categoria-dialog">
                <DialogTitle className="dialog-title"><InfoIcon sx={{verticalAlign:'middle', mr:1}}/>
                    {viewMode ? "Ver Categoría" : editMode ? "Editar Categoría" : "Agregar Categoría"}
                </DialogTitle>
                <DialogContent dividers className="dialog-content">
                    <TextField
                        fullWidth label="Nombre de categoría" name="nombre"
                        value={categoriaActual.nombre} onChange={handleChange}
                        disabled={viewMode} margin="normal" variant="outlined" className="form-field"
                        placeholder="Ej: Electrónicos, Hogar, etc."
                        required={!viewMode}
                    />
                    <TextField
                        fullWidth label="Descripción" name="descripcion"
                        value={categoriaActual.descripcion} onChange={handleChange}
                        disabled={viewMode} margin="normal" variant="outlined"
                        multiline rows={3} className="form-field"
                        placeholder="Ingrese una descripción detallada de la categoría"
                        required={!viewMode}
                    />
                    {viewMode && (
                        <div className="form-switch-container" style={{ marginTop: '16px', marginBottom: '8px' }}>
                            <span className="form-switch-label" style={{ marginRight: '10px', fontWeight: 'bold' }}>Estado:</span>
                            <span className={`estado-indicator ${categoriaActual.activo ? "activo" : "inactivo"}`}>
                                {categoriaActual.activo ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                    )}
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" startIcon={<CancelIcon />}>
                        {viewMode ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!viewMode && (
                        <Button
                            onClick={handleGuardar} sx={{ textTransform: 'none' }} variant="contained" color="primary"
                            startIcon={<SaveIcon />} disabled={actionLoading}
                        >
                           {actionLoading ? <CircularProgress size={24} color="inherit"/> : (editMode ? "Actualizar" : "Guardar")}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar la categoría "<strong>{selectedForDeletion?.nombre || ''}</strong>"? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)} disabled={actionLoading} sx={{textTransform:'none'}} >Cancelar</Button>
                    <Button onClick={confirmDelete} sx={{textTransform:'none'}} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit"/> : "Eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>
            
            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} maxWidth="xs" fullWidth className="confirm-estado">
                <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas cambiar el estado de la categoría "<strong>{categoriaToToggle?.nombre}</strong>" a <strong>{categoriaToToggle?.activo ? "Inactivo" : "Activo"}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} sx={{textTransform: 'none'}} color="inherit" variant="outlined" disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={handleConfirmToggleState} sx={{textTransform: 'none'}} color="success" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open} autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default CategoriaProdutos;