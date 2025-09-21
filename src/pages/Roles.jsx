import React, { useState, useEffect, useCallback } from "react";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Checkbox, FormControlLabel, Chip, TablePagination, IconButton, Tooltip, InputAdornment,
    Snackbar, Alert, CircularProgress, Typography, Box, Divider, Grid, FormHelperText
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Cancel as CancelIcon,
    Save as SaveIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Visibility as VisibilityIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "../styles/Usuarios.css"; // Reutilizamos los estilos de Usuarios para consistencia

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const ADMINISTRADOR_ROLE_NAME = 'Administrador'; 

// Función mejorada para extraer mensajes de error del backend
const getBackendErrorMessage = (errorData, defaultMessage = "Ocurrió un error.") => {
    if (!errorData) return defaultMessage;
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.non_field_errors)) return errorData.non_field_errors.join('; ');
    if (typeof errorData === 'object') {
        if (errorData.nombre?.some(msg => msg.includes('ya existe'))) return `El rol con este nombre ya existe.`;
        return Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
    }
    return defaultMessage;
};

const Roles = () => {
    const { authTokens, user, logout } = useAuth();
    
    // Privilegios del usuario actual
    const canCreate = user?.privileges?.includes('roles_crear');
    const canEdit = user?.privileges?.includes('roles_editar');
    const canDelete = user?.privileges?.includes('roles_eliminar');
    
    // Estados del componente
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); 
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false); // Nuevo estado para modo "ver detalle"
    const [selectedRole, setSelectedRole] = useState(null);
    const [form, setForm] = useState({ nombre: "", permisos_ids: [], activo: true });
    const [formError, setFormError] = useState("");
    const [availablePermissions, setAvailablePermissions] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false); // Diálogo para estado
    const [roleToToggle, setRoleToToggle] = useState(null); // Rol para cambiar estado
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // --- MANEJO DE NOTIFICACIONES ---
    const showNotification = (message, severity = "success") => setSnackbar({ open: true, message, severity });
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    // --- CARGA DE DATOS ---
    const fetchAllData = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) {
            logout();
            return;
        }
        
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/roles-permisos/roles/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/roles-permisos/permisos/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (rolesRes.status === 401 || permsRes.status === 401) {
                logout();
                return;
            }
            if (!rolesRes.ok) throw new Error("Error cargando los roles.");
            if (!permsRes.ok) throw new Error("Error cargando los permisos.");
            
            const rolesData = await rolesRes.json();
            const permsData = await permsRes.json();
            
            setRoles(Array.isArray(rolesData) ? rolesData.sort((a, b) => a.nombre.localeCompare(b.nombre)) : []);
            setAvailablePermissions(permsData);
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- MANEJO DE DIÁLOGOS (CRUD y VISTA) ---
    const handleOpen = (role = null, mode = "add") => {
        const isProtected = role?.nombre.toLowerCase() === ADMINISTRADOR_ROLE_NAME.toLowerCase();
        if (mode === 'edit' && isProtected) {
            showNotification(`El rol '${ADMINISTRADOR_ROLE_NAME}' no puede ser editado.`, "warning");
            return;
        }
        
        setEditMode(mode === 'edit');
        setViewMode(mode === 'view');
        setSelectedRole(role);
        
        setForm({
            nombre: role ? role.nombre : "",
            permisos_ids: role ? role.permisos.map(p => p.id) : [],
            activo: role ? role.activo : true,
        });

        setFormError("");
        setOpen(true);
    };
    
    const handleClose = () => {
        setOpen(false);
        // Pequeño delay para que no se vea el reseteo del form al cerrar
        setTimeout(() => {
            setEditMode(false);
            setViewMode(false);
            setSelectedRole(null);
            setForm({ nombre: "", permisos_ids: [], activo: true });
            setFormError("");
        }, 150);
    };

    const handlePermissionChange = (permisoId) => {
        setForm(prev => ({
            ...prev,
            permisos_ids: prev.permisos_ids.includes(permisoId)
                ? prev.permisos_ids.filter(id => id !== permisoId)
                : [...prev.permisos_ids, permisoId]
        }));
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            setFormError("El nombre del rol es obligatorio.");
            return;
        }
        setFormError("");
        setActionLoading(true);
        const token = authTokens?.access;
        if (!token) return;

        const roleData = {
            nombre: form.nombre,
            permisos_ids: form.permisos_ids,
        };
        // No enviamos 'activo' en el PUT/POST, se maneja por separado
        
        const url = editMode ? `${API_BASE_URL}/roles-permisos/roles/${selectedRole.id}/` : `${API_BASE_URL}/roles-permisos/roles/`;
        const method = editMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(roleData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(getBackendErrorMessage(errorData, editMode ? "Error al actualizar el rol." : "Error al crear el rol."));
            }
            
            showNotification(editMode ? "Rol actualizado correctamente" : "Rol agregado correctamente");
            handleClose();
            await fetchAllData();
        } catch (error) {
            setFormError(error.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    // --- MANEJO DE ELIMINACIÓN ---
    const handleDelete = (role) => {
        if (role.nombre.toLowerCase() === ADMINISTRADOR_ROLE_NAME.toLowerCase()) {
            showNotification(`El rol '${ADMINISTRADOR_ROLE_NAME}' no puede ser eliminado.`, "warning");
            return;
        }
        setSelectedForDeletion(role);
        setConfirmDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedForDeletion) return;
        const token = authTokens?.access;
        if (!token) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/roles-permisos/roles/${selectedForDeletion.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(getBackendErrorMessage(errorData, "Error al eliminar el rol."));
            }
            
            showNotification("Rol eliminado correctamente.");
            await fetchAllData();
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
            setActionLoading(false);
        }
    };
    
    // --- MANEJO DE CAMBIO DE ESTADO (NUEVO) ---
    const handleOpenStateConfirmDialog = (role) => {
        if (!canEdit || role.nombre.toLowerCase() === ADMINISTRADOR_ROLE_NAME.toLowerCase()) {
            showNotification(`No tiene permisos para cambiar el estado o es un rol protegido.`, "warning");
            return;
        }
        setRoleToToggle(role);
        setConfirmStatusDialogOpen(true);
    };

    const handleConfirmToggleState = async () => {
        if (!roleToToggle) return;
        const token = authTokens?.access;
        if (!token) return;

        setActionLoading(true);
        const newStatus = !roleToToggle.activo;
        
        try {
            const response = await fetch(`${API_BASE_URL}/roles-permisos/roles/${roleToToggle.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ activo: newStatus }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(getBackendErrorMessage(errorData, "Error al cambiar el estado."));
            }
            
            showNotification("Estado del rol actualizado correctamente.");
            await fetchAllData();
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setConfirmStatusDialogOpen(false);
            setRoleToToggle(null);
            setActionLoading(false);
        }
    };

    // --- FILTRADO Y PAGINACIÓN ---
    const filteredRoles = roles.filter(role => {
    const lowerSearch = searchTerm.toLowerCase();

    const campos = [
        role.nombre || "",
        role.permisos.map(p => p.nombre).join(" "),  // busca dentro de los privilegios
        role.usuarios_asignados_count?.toString() || "",
        role.activo ? "Activo" : "Inactivo"          // busca por estado
    ];

    return campos.some(campo =>
        (campo ? campo.toLowerCase() : "").includes(lowerSearch)
    );
});

    
    if (loading) {
        return <div className="loading-indicator"><CircularProgress /> Cargando roles...</div>;
    }
    
    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="usuarios-container"> {/* Reutiliza la clase principal para consistencia */}
            <div className="usuarios-title-header"><h1>Gestión de Roles</h1></div>

            <Box className="usuarios-toolbar">
                <TextField
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: '400px', backgroundColor: 'white' }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon /></IconButton>),
                    }}
                />
                {canCreate && (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen(null, 'add')} className="add-button" sx={{ textTransform: 'none' }}>
                        Agregar Rol
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} className="usuarios-table" variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Nombre del Rol</TableCell>
                            <TableCell align="center">Privilegios Asignados</TableCell>
                            <TableCell align="center">Usuarios Asignados</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => {
                            const isProtected = role.nombre.toLowerCase() === ADMINISTRADOR_ROLE_NAME.toLowerCase();
                            return (
                                <TableRow key={role.id} hover className={!role.activo ? "row-inactivo" : ""}>
                                    <TableCell align="center" sx={{ fontWeight: '500' }}>{role.nombre}</TableCell>
                                    <TableCell >
                                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                                            {role.permisos.slice(0, 3).map(p => <Chip key={p.id} label={p.nombre} size="small" variant="outlined" />)}
                                            {role.permisos.length > 3 && <Chip label={`+${role.permisos.length - 3}`} size="small" />}
                                            {role.permisos.length === 0 && <Typography variant="caption" color="textSecondary">Sin privilegios</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">{role.usuarios_asignados_count}</TableCell>
                                    <TableCell align="center">
                                        <Typography component="span"
                                            className={`estado-label ${role.activo ? "activo" : "inactivo"} ${canEdit && !isProtected ? "estado-clickable" : "estado-not-clickable"}`}
                                            onClick={() => handleOpenStateConfirmDialog(role)}
                                        >
                                            {role.activo ? "Activo" : "Inactivo"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={0.5}>
                                            <Tooltip title="Ver detalles" arrow><IconButton color="info" size="small" onClick={() => handleOpen(role, 'view')}><VisibilityIcon /></IconButton></Tooltip>
                                            <Tooltip title={isProtected ? `Rol protegido` : "Editar"} arrow><span>
                                                <IconButton color="primary" size="small" onClick={() => handleOpen(role, 'edit')} disabled={!canEdit || isProtected}><EditIcon /></IconButton>
                                            </span></Tooltip>
                                            <Tooltip title={isProtected ? `Rol protegido` : "Eliminar"} arrow><span>
                                                <IconButton color="error" size="small" onClick={() => handleDelete(role)} disabled={!canDelete || isProtected}><DeleteIcon /></IconButton>
                                            </span></Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredRoles.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Filas por página:"
                />
            </TableContainer>

            {/* --- DIÁLOGO PRINCIPAL (CREAR/EDITAR/VER) --- */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth className="rol-dialog">
                <DialogTitle
  sx={{
    background: 'linear-gradient(to right, #e0f2fe, #bfdbfe)',
    color: '#1e40af',
    p: '16px 24px',
    fontWeight: 600,
    borderBottom: '1px solid #bfdbfe'
  }}
>
  <InfoIcon sx={{ verticalAlign:'middle', mr:1 }} />

                    {viewMode ? "Detalles del Rol" : editMode ? "Editar Rol" : "Agregar Nuevo Rol"}
                </DialogTitle>
                <DialogContent dividers>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    <TextField
                        fullWidth autoFocus margin="dense" label="Nombre del Rol"
                        value={form.nombre}
                        onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                        disabled={viewMode}
                        required
                    />
                    <Box mt={3}>
                        <Typography variant="h6" gutterBottom>Asignar Privilegios</Typography>
                        <FormHelperText sx={{mb: 1}}>Seleccione los privilegios que tendrán los usuarios con este rol.</FormHelperText>
                        
                        {Object.entries(availablePermissions).map(([modulo, permisos]) => (
                            <Paper key={modulo} variant="outlined" sx={{ p: 2, mt: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">{modulo}</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Grid container spacing={1}>
                                    {permisos.map(perm => (
                                        <Grid item xs={12} sm={6} md={4} key={perm.id}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={form.permisos_ids.includes(perm.id)}
                                                        onChange={() => handlePermissionChange(perm.id)}
                                                        disabled={viewMode}
                                                    />
                                                }
                                                label={perm.nombre}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleClose} color="inherit" variant="outlined" startIcon={<CancelIcon />} sx={{ textTransform: 'none' }}>
                        {viewMode ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!viewMode && (
                        <Button onClick={handleSave} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={actionLoading} sx={{ textTransform: 'none' }}>
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : (editMode ? "Actualizar" : "Guardar")}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* --- DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar el rol "<strong>{selectedForDeletion?.nombre}</strong>"?</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{mt:1}}>Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions className="confirm-dialog-actions">
                    <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined" color="inherit" sx={{ textTransform: 'none' }} disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: 'none' }} disabled={actionLoading}>
                         {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* --- DIÁLOGO DE CONFIRMACIÓN DE CAMBIO DE ESTADO --- */}
            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} maxWidth="xs" className="confirm-estado">
                <DialogTitle className="confirm-dialog-estado" ><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro de que desea cambiar el estado del rol "<strong>{roleToToggle?.nombre}</strong>" a <strong>{roleToToggle?.activo ? "Inactivo" : "Activo"}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions className="confirm-dialog-actions">
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} variant="outlined" color="inherit" sx={{ textTransform: 'none' }} disabled={actionLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmToggleState} color="success" variant="contained" sx={{ textTransform: 'none' }} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- SNACKBAR PARA NOTIFICACIONES --- */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Roles;