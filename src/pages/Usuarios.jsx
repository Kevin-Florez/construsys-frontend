import React, { useState, useEffect, useCallback } from "react";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Select,
    Snackbar, Alert, IconButton, Tooltip, TablePagination, InputAdornment,
    FormControl, InputLabel, CircularProgress, Typography, Box, FormHelperText,
    Grid
} from "@mui/material";
import {
    Visibility, Edit, Delete, Add as AddIcon, Save as SaveIcon,
    Search as SearchIcon, Clear as ClearIcon, Cancel as CancelIcon, Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "../styles/Usuarios.css"; 

const API_BASE_URL = "http://localhost:8000";
const API_USUARIOS_ENDPOINT = `${API_BASE_URL}/api/usuarios/`;
const API_ROLES_ENDPOINT = `${API_BASE_URL}/api/roles-permisos/roles/`;

const tiposDocumento = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "TI", label: "Tarjeta de Identidad" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" },
    { value: "PAS", label: "Pasaporte" },
    { value: "PPT", label: "Permiso por Protección Temporal" },
];

const Usuarios = () => {
    const { authTokens, user, logout } = useAuth();

    const loggedInUserId = user?.id;

    // Privilegios del usuario
    const canCreate = user?.privileges?.includes('usuarios_crear');
    const canEdit = user?.privileges?.includes('usuarios_editar');
    const canDelete = user?.privileges?.includes('usuarios_eliminar');

    // Estados del componente
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState(null);

    const initialFormState = {
        first_name: "", last_name: "", email: "", rolId: "",
        tipo_documento: "", numero_documento: "", telefono: "", direccion: ""
    };
    const [formState, setFormState] = useState(initialFormState);

    const initialFieldErrors = {
        first_name: "", last_name: "", email: "", rolId: "",
        tipo_documento: "", numero_documento: "", telefono: ""
    };
    const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [generalFormError, setGeneralFormError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);

    // --- MANEJO DE NOTIFICACIONES Y DATOS ---
    const showNotification = (message, severity = "success") => setSnackbar({ open: true, message, severity });
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const validateField = (name, value) => {
        let error = "";
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        switch (name) {
            case "first_name":
            case "last_name":
                if (!trimmedValue) error = "Este campo es obligatorio.";
                else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) error = "Solo debe contener letras y espacios.";
                break;
            case "email":
                if (!trimmedValue) error = "El correo electrónico es obligatorio.";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "Formato de correo inválido.";
                break;
            case "rolId":
                if (!value) error = "Debe seleccionar un rol.";
                break;
            case "tipo_documento":
                if (!value) error = "Debe seleccionar un tipo de documento.";
                break;
            case "numero_documento":
                if (!trimmedValue) error = "El número de documento es obligatorio.";
                else if (!/^[0-9]{6,20}$/.test(trimmedValue)) error = "Debe contener solo números, entre 6 y 20 dígitos.";
                break;
            case "telefono":
                if (trimmedValue && !/^[0-9]{7,15}$/.test(trimmedValue)) error = "Debe contener solo números, entre 7 y 15 dígitos.";
                break;
            default: break;
        }
        return error;
    };
    
    const fetchData = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) {
            logout();
            return;
        }

        setLoading(true);
        try {
            const [rolesRes, usuariosRes] = await Promise.all([
                fetch(API_ROLES_ENDPOINT, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(API_USUARIOS_ENDPOINT, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (rolesRes.status === 401 || usuariosRes.status === 401) {
                logout();
                return;
            }

            if (!rolesRes.ok) throw new Error("No se pudieron cargar los roles.");
            if (!usuariosRes.ok) throw new Error("No se pudieron cargar los usuarios.");

            const rolesData = await rolesRes.json();
            const usuariosData = await usuariosRes.json();

            setRoles(Array.isArray(rolesData) ? rolesData : []);
            setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredUsuarios = usuarios.filter(u => {
    const lowerSearch = searchTerm.toLowerCase();

    const campos = [
        `${u.first_name || ""} ${u.last_name || ""}`,
        u.tipo_documento && u.numero_documento ? `${u.tipo_documento}: ${u.numero_documento}` : "",
        u.email || "",
        u.rol?.nombre || "",
        (typeof u.is_active === "boolean" ? u.is_active : u.activo) ? "Activo" : "Inactivo"
    ];

    return campos.some(campo =>
        (campo ? campo.toString().toLowerCase() : "").includes(lowerSearch)
    );
});


    // --- MANEJO DE ACCIONES CRUD ---

    const handleSave = async () => {
        const token = authTokens?.access;
        if (!token) return;
        
        const newErrors = {};
        let formIsValid = true;
        
        Object.keys(formState).forEach(key => {
            const error = validateField(key, formState[key]);
            if (error) {
                newErrors[key] = error;
                formIsValid = false;
            }
        });

        setFieldErrors(newErrors);

        if (!formIsValid) {
            setGeneralFormError("Por favor, corrija los errores marcados en el formulario.");
            return;
        }
        
        setGeneralFormError(null);
        setActionLoading(true);

        const { rolId, ...restOfForm } = formState;
        let userData = { ...restOfForm, rol: rolId };
        
        if (!editMode) {
            delete userData.activo;
        }
        
        const url = editMode ? `${API_USUARIOS_ENDPOINT}${selectedUsuario.id}/` : API_USUARIOS_ENDPOINT;
        const method = editMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
    const errorData = await response.json();
    
    // Si hay errores de campos específicos (ej: numero_documento, email, etc.)
    if (typeof errorData === "object") {
        const firstKey = Object.keys(errorData)[0];
        const firstError = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
        throw new Error(firstError || "Error al guardar el usuario.");
    }

    // Fallback
    throw new Error(errorData.detail || "Error al guardar el usuario.");
}

            showNotification(`Usuario ${editMode ? 'actualizado' : 'creado'} correctamente.`);
            handleClose();
            await fetchData();
        } catch (error) {
            setGeneralFormError(error.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleDelete = (usuario) => {
        if (loggedInUserId === usuario.id) {
            showNotification("No puedes eliminar tu propia cuenta.", "warning");
            return;
        }
        setSelectedForDeletion(usuario);
        setConfirmDialogOpen(true);
    };

    const confirmDelete = async () => {
        const token = authTokens?.access;
        if (!selectedForDeletion || !token) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_USUARIOS_ENDPOINT}${selectedForDeletion.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.status === 204 || response.ok) {
                showNotification("Usuario eliminado correctamente.");
                await fetchData();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al eliminar el usuario.");
            }
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setActionLoading(false);
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
        }
    };

    const handleToggleActivo = async (usuario) => {
        const token = authTokens?.access;
        if (!token) return;

        setActionLoading(true);
        const nuevoEstado = !(typeof usuario.is_active === 'boolean' ? usuario.is_active : usuario.activo);
        
        try {
            const response = await fetch(`${API_USUARIOS_ENDPOINT}${usuario.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // ✨ CORRECCIÓN 2: Se envía 'activo' en lugar de 'is_active' para que coincida con el serializer.
                body: JSON.stringify({ activo: nuevoEstado }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al cambiar el estado.");
            }
            showNotification("Estado del usuario actualizado.");
            await fetchData(); // Refresca los datos para mostrar el cambio
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenStateConfirmDialog = (userToToggle) => {
        if (loggedInUserId === userToToggle.id) {
            showNotification("No puedes cambiar tu propio estado.", "warning");
            return;
        }
        if (!canEdit) {
            showNotification("No tienes permisos para editar usuarios.", "warning");
            return;
        }
        setUserToToggle(userToToggle);
        setConfirmStatusDialogOpen(true);
    };

    const handleConfirmToggleState = () => {
        if (userToToggle) {
            handleToggleActivo(userToToggle);
        }
        setConfirmStatusDialogOpen(false);
        setUserToToggle(null);
    };

    // --- MANEJO DE DIÁLOGOS Y FORMULARIO ---
    const handleOpen = (usuario = null, mode = "add") => {
        setViewMode(mode === "view");
        setEditMode(mode === "edit");
        setSelectedUsuario(usuario);
        if (usuario) {
            setFormState({
                first_name: usuario.first_name || "", last_name: usuario.last_name || "",
                email: usuario.email || "", rolId: usuario.rol?.id || "",
                activo: typeof usuario.is_active === 'boolean' ? usuario.is_active : true,
                tipo_documento: usuario.tipo_documento || "", numero_documento: usuario.numero_documento || "",
                telefono: usuario.telefono || "", direccion: usuario.direccion || ""
            });
        } else {
            setFormState(initialFormState);
        }
        setFieldErrors(initialFieldErrors);
        setGeneralFormError(null);
        setOpen(true);
    };
    
    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setViewMode(false); setEditMode(false);
            setSelectedUsuario(null); setFormState(initialFormState);
            setFieldErrors(initialFieldErrors); setGeneralFormError(null);
        }, 150);
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        let processedValue = value;
        if (name === "first_name" || name === "last_name") {
            processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        } else if (name === "numero_documento" || name === "telefono") {
            processedValue = value.replace(/[^0-9]/g, "");
        }

        setFormState(prev => ({ ...prev, [name]: processedValue }));
        
        if (fieldErrors[name]) {
            const error = validateField(name, processedValue);
            setFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
        }
    };

    // --- RENDERIZADO ---
    if (loading && usuarios.length === 0) {
        return <div className="loading-indicator"><CircularProgress /> Cargando usuarios...</div>;
    }

    return (
        <div className="usuarios-container">
            <div className="usuarios-title-header"><h1>Gestión de Usuarios</h1></div>
            <Box className="usuarios-toolbar">
                <TextField
                    placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined" size="small"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon fontSize="small" /></IconButton>),
                    }}
                    sx={{ minWidth: '400px', backgroundColor: 'white' }}
                />
                {canCreate && (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen(null, "add")} className="add-button"
                        sx={{ textTransform: 'none' }}>Agregar Usuario</Button>
                )}
            </Box>

            <TableContainer component={Paper} className="usuarios-table" variant="outlined">
                <Table stickyHeader>
                    <TableHead><TableRow>
                        <TableCell align="center">Nombre Completo</TableCell>
                        <TableCell align="center">Documento</TableCell>
                        <TableCell align="center">Correo Electrónico</TableCell>
                        <TableCell align="center">Rol</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {filteredUsuarios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u) => {
                            const esUsuarioLogueado = loggedInUserId === u.id;
                            const estadoUsuario = typeof u.is_active === 'boolean' ? u.is_active : u.activo;
                            return (
                                <TableRow key={u.id} className={!estadoUsuario ? "row-inactivo" : ""} hover>
                                    <TableCell align="center">{u.first_name} {u.last_name}</TableCell>
                                    <TableCell align="center">{u.tipo_documento && u.numero_documento ? `${u.tipo_documento}: ${u.numero_documento}` : "N/A"}</TableCell>
                                    <TableCell align="center">{u.email}</TableCell>
                                    <TableCell align="center">{u.rol?.nombre || "Sin rol"}</TableCell>
                                    <TableCell align="center">
                                        <Typography component="span"
                                            className={`estado-label ${estadoUsuario ? "activo" : "inactivo"} ${!esUsuarioLogueado && canEdit ? "estado-clickable" : "estado-not-clickable"}`}
                                            onClick={() => handleOpenStateConfirmDialog(u)}
                                        >{estadoUsuario ? "Activo" : "Inactivo"}</Typography>
                                    </TableCell>
                                    <TableCell align="center" className="actions-cell">
                                        <Box display="flex" justifyContent="center" gap={0.5}>
                                            <Tooltip title="Ver detalles" arrow><IconButton color="info" onClick={() => handleOpen(u, "view")} size="small"><Visibility /></IconButton></Tooltip>
                                            {/* ✨ CORRECCIÓN 1: Se añade 'esUsuarioLogueado' a la condición 'disabled' del botón de editar. */}
                                            <Tooltip title={esUsuarioLogueado ? "No puedes editar tu cuenta aquí" : "Editar"} arrow><span>
                                                <IconButton color="primary" onClick={() => handleOpen(u, "edit")} size="small" disabled={esUsuarioLogueado || !canEdit}><Edit /></IconButton>
                                            </span></Tooltip>
                                            <Tooltip title={esUsuarioLogueado ? "No te puedes eliminar a ti mismo" : "Eliminar"} arrow><span>
                                                <IconButton color="error" onClick={() => handleDelete(u)} size="small" disabled={esUsuarioLogueado || !canDelete}><Delete /></IconButton>
                                            </span></Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredUsuarios.length}
                    rowsPerPage={rowsPerPage} page={page} onPageChange={(event, newPage) => setPage(newPage)} 
                    onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Filas por página:"
                />
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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

                    {viewMode ? "Detalles del Usuario" : editMode ? "Editar Usuario" : "Agregar Nuevo Usuario"}
                </DialogTitle>
                <DialogContent dividers>
                    {generalFormError && <Alert severity="error" sx={{ mb: 2 }}>{generalFormError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth disabled={viewMode || (editMode && !!selectedUsuario?.numero_documento)} error={!!fieldErrors.tipo_documento}>
                                <InputLabel id="tipo-documento-label">Tipo de Documento *</InputLabel>
                                <Select labelId="tipo-documento-label" name="tipo_documento" value={formState.tipo_documento} label="Tipo de Documento *" onChange={handleFormChange}>
                                    {tiposDocumento.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                                </Select>
                                {fieldErrors.tipo_documento && <FormHelperText>{fieldErrors.tipo_documento}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="numero_documento" label="Número de Documento" value={formState.numero_documento} onChange={handleFormChange}
                                fullWidth required disabled={viewMode || (editMode && !!selectedUsuario?.numero_documento)}
                                error={!!fieldErrors.numero_documento} helperText={fieldErrors.numero_documento} inputProps={{ maxLength: 20 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="first_name" label="Nombres" value={formState.first_name} onChange={handleFormChange}
                                fullWidth required disabled={viewMode}
                                error={!!fieldErrors.first_name} helperText={fieldErrors.first_name} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="last_name" label="Apellidos" value={formState.last_name} onChange={handleFormChange}
                                fullWidth required disabled={viewMode}
                                error={!!fieldErrors.last_name} helperText={fieldErrors.last_name} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                             <TextField name="email" label="Correo Electrónico" type="email" value={formState.email} onChange={handleFormChange}
                                fullWidth required disabled={viewMode || editMode}
                                error={!!fieldErrors.email} helperText={fieldErrors.email || (editMode ? "El correo no se puede cambiar." : "")} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="telefono" label="Teléfono" value={formState.telefono} onChange={handleFormChange}
                                fullWidth disabled={viewMode}
                                error={!!fieldErrors.telefono} helperText={fieldErrors.telefono} inputProps={{ maxLength: 15 }} />
                        </Grid>
                        <Grid item xs={12}>
                             <FormControl fullWidth required={!viewMode} error={!!fieldErrors.rolId} disabled={viewMode || (editMode && selectedUsuario?.id === loggedInUserId)}>
                                <InputLabel id="rol-select-label">Rol</InputLabel>
                                <Select labelId="rol-select-label" name="rolId" value={formState.rolId} label="Rol *" onChange={handleFormChange}>
                                    {(roles || []).filter(r => r.activo).map((rol) => (<MenuItem key={rol.id} value={rol.id}>{rol.nombre}</MenuItem>))}
                                </Select>
                                <FormHelperText>{fieldErrors.rolId || (editMode && selectedUsuario?.id === loggedInUserId ? "No puedes cambiar tu propio rol." : "")}</FormHelperText>
                             </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="direccion" label="Dirección" value={formState.direccion} onChange={handleFormChange}
                                fullWidth disabled={viewMode} multiline rows={2} />
                        </Grid>
                        {viewMode && (
                            <Grid item xs={12}>
                                <Box sx={{ mt: 1, p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                                    <Typography component="span" sx={{ fontWeight: 'bold' }}>Estado: </Typography>
                                    <Typography component="span" className={`estado-label ${formState.activo ? "activo" : "inactivo"}`}>
                                        {formState.activo ? "Activo" : "Inactivo"}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleClose} color="inherit" variant="outlined" startIcon={<CancelIcon />} sx={{ textTransform: 'none' }}>
                        {viewMode ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!viewMode && (
                        <Button onClick={handleSave} color="primary" variant="contained" startIcon={<SaveIcon />} disabled={actionLoading} sx={{ textTransform: 'none' }}>
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : (editMode ? "Actualizar Cambios" : "Guardar Usuario")}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Diálogos de Confirmación */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar al usuario "<strong>{selectedForDeletion?.first_name} {selectedForDeletion?.last_name}</strong>"?</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{mt:1}}>Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions className="confirm-dialog-actions">
                    <Button onClick={() => setConfirmDialogOpen(false)} color="inherit" variant="outlined" sx={{ textTransform: 'none' }} disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: 'none' }} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit"/> : "Eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>
            
            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} maxWidth="xs" className="confirm-estado">
                <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Desea cambiar el estado del usuario "<strong>{userToToggle?.first_name} {userToToggle?.last_name}</strong>" a <strong>{(typeof userToToggle?.is_active === 'boolean' ? userToToggle?.is_active : userToToggle?.activo) ? "Inactivo" : "Activo"}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} color="inherit" variant="outlined" sx={{ textTransform: 'none' }} disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={handleConfirmToggleState} color="success" variant="contained" sx={{ textTransform: 'none' }} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default Usuarios;