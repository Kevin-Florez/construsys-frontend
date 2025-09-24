import React, { useState, useEffect, useCallback } from "react";
import {
    Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent,
    DialogTitle, IconButton, Typography, Snackbar, Alert, TablePagination,
    Tooltip, InputAdornment, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, FormHelperText,
    Box, Grid
} from "@mui/material";
import {
    Edit, Delete, Visibility, Add as AddIcon, Save as SaveIcon,
    Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon, Cancel as CancelIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "../styles/Clientes.css"; 

const API_BASE_URL = "http://localhost:8000";

const tiposDocumentoCliente = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT (Empresa o Persona Natural)" },
    { value: "PAS", label: "Pasaporte" },
    { value: "TI", label: "Tarjeta de Identidad" },
    { value: "RC", label: "Registro Civil" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
    { value: "PPT", label: "Permiso por Protección Temporal" },
];

// ✨ NUEVO: Función de ayuda para manejar errores del backend de forma consistente
const getBackendErrorMessage = (errorData, defaultMessage = "Ocurrió un error.") => {
    if (!errorData) return defaultMessage;
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.non_field_errors)) return errorData.non_field_errors.join('; ');
    if (typeof errorData === 'object') {
        return Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
    }
    return defaultMessage;
};

const Clientes = () => {
    const { authTokens, userPrivileges, logout } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [openFormModal, setOpenFormModal] = useState(false);
    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);

    const initialClienteState = {
        id: null, nombre: "", apellido: "", correo: "", telefono: "",
        tipo_documento: "CC", documento: "",
        direccion: "", activo: true
    };
    const [clienteActual, setClienteActual] = useState(initialClienteState);

    const initialFieldErrorsState = {
        nombre: "", apellido: "", correo: "", telefono: "",
        tipo_documento: "", documento: "", direccion: ""
    };
    const [fieldErrors, setFieldErrors] = useState(initialFieldErrorsState);

    const [modoEdicion, setModoEdicion] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [generalFormError, setGeneralFormError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
    const [clienteToToggle, setClienteToToggle] = useState(null);
    
    const showNotification = (message, severity = "success") => setSnackbar({ open: true, message, severity });
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const fetchClientes = useCallback(async () => {
        setLoading(true);
        const token = authTokens?.access;
        if (!token) {
            showNotification("Sesión no válida.", "error");
            logout();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/clientes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudieron cargar los clientes.");
            }
            const data = await response.json();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification(`Error al cargar clientes: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchClientes();
        }
    }, [authTokens, fetchClientes]);

    useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = clientes.filter(cliente => {
        const estadoTexto = cliente.activo ? "activo" : "inactivo"; // 👈 convertimos booleano a texto

        return (
            (cliente.nombre?.toLowerCase() || "").includes(lowerSearchTerm) ||
            (cliente.apellido?.toLowerCase() || "").includes(lowerSearchTerm) ||
            (cliente.correo?.toLowerCase() || "").includes(lowerSearchTerm) ||
            (cliente.documento?.toLowerCase() || "").includes(lowerSearchTerm) ||
            (cliente.telefono?.toLowerCase() || "").includes(lowerSearchTerm) ||
            estadoTexto.includes(lowerSearchTerm) // 👈 busca también por estado parcial
        );
    });
    setClientesFiltrados(filtered);
    setPage(0);
}, [searchTerm, clientes]);


    const validateField = (name, value) => {
        let error = "";
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        switch (name) {
            case "nombre":
            case "apellido":
                if (!trimmedValue) error = "Este campo es obligatorio.";
                else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) error = "Solo debe contener letras y espacios.";
                break;
            case "correo":
                if (!trimmedValue) error = "El correo electrónico es obligatorio.";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "Formato de correo inválido.";
                break;
            case "telefono":
                if (!trimmedValue) error = "El teléfono es obligatorio.";
                else if (!/^[0-9]{7,15}$/.test(trimmedValue)) error = "Debe contener solo números, entre 7 y 15 dígitos.";
                break;
            case "tipo_documento":
                if (!value) error = "Debe seleccionar un tipo de documento.";
                break;
            case "documento":
                if (!trimmedValue) error = "El número de documento es obligatorio.";
                else if (!/^[0-9]{6,20}$/.test(trimmedValue)) error = "Debe contener solo números, entre 6 y 20 dígitos.";
                break;
            case "direccion":
                if (!trimmedValue) error = "La dirección es obligatoria.";
                else if (trimmedValue.length < 3) error = "La dirección debe tener al menos 3 caracteres.";
                break;
            default: break;
        }
        return error;
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10)); setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");

    const handleOpenFormModal = (cliente = null) => {
        setModoEdicion(!!cliente);
        setClienteActual(cliente ? { ...cliente } : initialClienteState);
        setFieldErrors(initialFieldErrorsState);
        setGeneralFormError(null);
        setOpenFormModal(true);
    };

    const handleVerDetalle = (cliente) => {
        setClienteActual(cliente);
        setViewDetailsModalOpen(true);
    };

    const handleCloseModals = () => {
        setOpenFormModal(false);
        setViewDetailsModalOpen(false);
        setClienteActual(initialClienteState);
        setFieldErrors(initialFieldErrorsState);
        setGeneralFormError(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let processedValue = type === 'checkbox' ? checked : value;
        if (name === "nombre" || name === "apellido") {
            processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        } else if (name === "documento" || name === "telefono") {
            processedValue = value.replace(/[^0-9]/g, "");
        }
        setClienteActual(prev => ({ ...prev, [name]: processedValue }));
        
        // Valida en tiempo real solo si el campo ya tenía un error
        if (fieldErrors[name]) {
            const error = validateField(name, processedValue);
            setFieldErrors(prevErrors => ({ ...prevErrors, [name]: error }));
        }
    };

    // ✨ CORRECCIÓN: Se implementa la lógica de validación completa en handleGuardar
    const handleGuardar = async () => {
        const newErrors = {};
        let formIsValid = true;

        // Itera sobre el estado del formulario para validar cada campo
        Object.keys(clienteActual).forEach(key => {
            // Solo valida los campos que tienen una regla de validación
            if (key in initialFieldErrorsState) {
                const error = validateField(key, clienteActual[key]);
                if (error) {
                    newErrors[key] = error;
                    formIsValid = false;
                }
            }
        });
        
        setFieldErrors(newErrors);

        if (!formIsValid) {
            setGeneralFormError("Por favor, corrija los errores marcados en el formulario.");
            return; // Detiene la ejecución si hay errores
        }
        
        setGeneralFormError(null); // Limpia el error general si todo es válido
        setActionLoading(true);
        const token = authTokens?.access;
        const { id, ...payload } = clienteActual;
        const method = modoEdicion ? 'PUT' : 'POST';
        const url = modoEdicion ? `${API_BASE_URL}/api/clientes/${id}/` : `${API_BASE_URL}/api/clientes/`;
        try {
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(getBackendErrorMessage(errorData, "No se pudo guardar el cliente."));
            }
            showNotification(`Cliente ${modoEdicion ? 'actualizado' : 'creado'} correctamente.`);
            handleCloseModals();
            fetchClientes();
        } catch (error) {
            setGeneralFormError(error.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleDelete = (clienteId) => {
        setSelectedForDeletion(clienteId);
        setConfirmDialogOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!selectedForDeletion) return;
        setActionLoading(true);
        const token = authTokens?.access;
        try {
            const response = await fetch(`${API_BASE_URL}/api/clientes/${selectedForDeletion}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok && response.status !== 204) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al eliminar.");
            }
            showNotification("Cliente eliminado correctamente.");
            fetchClientes();
        } catch (error) {
            showNotification(`Error al eliminar: ${error.message}`, "error");
        } finally {
            setActionLoading(false);
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
        }
    };

    const handleOpenStateConfirmDialog = (cliente) => {
        if (actionLoading) return;
        setClienteToToggle(cliente);
        setConfirmStatusDialogOpen(true);
    };

    const handleConfirmToggleState = () => {
        if (clienteToToggle) {
            handleToggleActivo(clienteToToggle.id);
        }
        setConfirmStatusDialogOpen(false);
        setClienteToToggle(null);
    };

    const handleToggleActivo = async (id) => {
        const clienteAActualizar = clientes.find(c => c.id === id);
        if (!clienteAActualizar) return;
        
        setActionLoading(true);
        const token = authTokens?.access;
        const nuevoEstado = !clienteAActualizar.activo;
        try {
            const response = await fetch(`${API_BASE_URL}/api/clientes/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ activo: nuevoEstado }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudo cambiar el estado.");
            }
            fetchClientes(); // Vuelve a cargar todos los datos para asegurar consistencia
            showNotification("Estado del cliente actualizado.");
        } catch (error) {
            showNotification(`Error: ${error.message}`, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const paginatedClientes = clientesFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return <div className="loading-indicator"><CircularProgress /> Cargando clientes...</div>;
    }

    // El resto del JSX se mantiene igual, ya que los TextField ya están preparados para mostrar los errores.
    // ...

    return (
        <div className="clientes-container">
            <div className="clientes-title-header"><h1>Gestión de Clientes</h1></div>
            <Box className="clientes-toolbar">
                <TextField
                    placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined" className="search-input" size="small"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton></InputAdornment>),
                    }} sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }} 
                />
                {userPrivileges.includes('clientes_crear') && (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenFormModal(null)} className="add-button" sx={{ textTransform: 'none' }}>
                        Agregar Cliente
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} className="clientes-table" elevation={0} variant="outlined">
                <Table stickyHeader>
                    <TableHead><TableRow>
                        <TableCell align="center">Documento</TableCell>
                        <TableCell align="center">Nombres y Apellidos</TableCell>
                        <TableCell align="center">Contacto</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="center" style={{ minWidth: 130 }}>Acciones</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {paginatedClientes.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" className="no-data">
                                {clientes.length > 0 && searchTerm ? "No se encontraron clientes." : "No hay clientes registrados."}
                            </TableCell></TableRow>
                        ) : (
                            paginatedClientes.map((cliente) => (
                                <TableRow key={cliente.id} className={!cliente.activo ? "row-inactivo" : ""} hover>
                                    <TableCell align="center">{cliente.tipo_documento} - {cliente.documento}</TableCell>
                                    <TableCell align="center">{cliente.nombre} {cliente.apellido}</TableCell>
                                    <TableCell align="center">{cliente.correo}<br/>{cliente.telefono}</TableCell>
                                    <TableCell align="center">
                                        <Typography component="span"
                                            className={`estado-label ${cliente.activo ? "activo" : "inactivo"} ${userPrivileges.includes('clientes_editar') ? "estado-clickable" : ""}`}
                                            onClick={() => userPrivileges.includes('clientes_editar') && handleOpenStateConfirmDialog(cliente)}
                                            role="button" tabIndex={0}
                                        >
                                            {cliente.activo ? "Activo" : "Inactivo"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" className="actions-cell">
                                        <div className="action-buttons">
                                            <Tooltip title="Ver detalles" arrow><IconButton color="info" onClick={() => handleVerDetalle(cliente)} size="small"><Visibility /></IconButton></Tooltip>
                                            <Tooltip title="Editar" arrow>
                                                <span>
                                                    <IconButton color="primary" onClick={() => handleOpenFormModal(cliente)} size="small" disabled={!userPrivileges.includes('clientes_editar')}>
                                                        <Edit />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Eliminar" arrow>
                                                <span>
                                                    <IconButton color="error" onClick={() => handleDelete(cliente.id)} size="small" disabled={!userPrivileges.includes('clientes_eliminar') || (actionLoading && selectedForDeletion === cliente.id)}>
                                                        {actionLoading && selectedForDeletion === cliente.id ? <CircularProgress size={20} color="inherit" /> : <Delete />}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination 
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div" count={clientesFiltrados.length} rowsPerPage={rowsPerPage}
                    page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                />
            </TableContainer>

            <Dialog open={openFormModal} onClose={handleCloseModals} maxWidth="md" fullWidth className="cliente-dialog">
                <DialogTitle className="dialog-title">
                    <InfoIcon sx={{verticalAlign:'middle', mr:1}}/>
                    {modoEdicion ? "Editar Cliente" : "Agregar Nuevo Cliente"}
                </DialogTitle>
                <DialogContent dividers className="dialog-content">
                    {generalFormError && <Alert severity="error" sx={{ mb: 2 }}>{generalFormError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required error={!!fieldErrors.tipo_documento} disabled={modoEdicion && !!clienteActual.documento}>
                                <InputLabel id="tipo-documento-modal-label">Tipo de Documento</InputLabel>
                                <Select labelId="tipo-documento-modal-label" name="tipo_documento" value={clienteActual.tipo_documento} label="Tipo de Documento" onChange={handleChange}>
                                    <MenuItem value="" disabled><em>Seleccione...</em></MenuItem>
                                    {tiposDocumentoCliente.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                                </Select>
                                {fieldErrors.tipo_documento && <FormHelperText>{fieldErrors.tipo_documento}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="documento" label="Número de Documento" value={clienteActual.documento} onChange={handleChange} fullWidth required disabled={modoEdicion && !!clienteActual.documento} error={!!fieldErrors.documento} helperText={fieldErrors.documento} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="nombre" label="Nombres" value={clienteActual.nombre} onChange={handleChange} fullWidth required error={!!fieldErrors.nombre} helperText={fieldErrors.nombre} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="apellido" label="Apellidos" value={clienteActual.apellido} onChange={handleChange} fullWidth required error={!!fieldErrors.apellido} helperText={fieldErrors.apellido} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="correo" label="Correo Electrónico" type="email" value={clienteActual.correo} onChange={handleChange} fullWidth required disabled={modoEdicion && !!clienteActual.correo} error={!!fieldErrors.correo} helperText={fieldErrors.correo || (modoEdicion ? "El correo no se puede cambiar." : "")} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="telefono" label="Teléfono" value={clienteActual.telefono} onChange={handleChange} fullWidth required error={!!fieldErrors.telefono} helperText={fieldErrors.telefono} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="direccion" label="Dirección" value={clienteActual.direccion} onChange={handleChange} fullWidth required multiline rows={3} error={!!fieldErrors.direccion} helperText={fieldErrors.direccion} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCloseModals} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleGuardar} sx={{ textTransform: 'none' }} color="primary" variant="contained" startIcon={<SaveIcon />} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : (modoEdicion ? "Actualizar" : "Guardar")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewDetailsModalOpen} onClose={handleCloseModals} maxWidth="sm" fullWidth className="cliente-dialog">
                <DialogTitle className="dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Detalles del Cliente</DialogTitle>
                <DialogContent dividers className="dialog-content">
                    <Box sx={{ p: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Nombres</Typography><Typography align="center" variant="h6">{clienteActual.nombre}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Apellidos</Typography><Typography align="center" variant="h6">{clienteActual.apellido}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Documento</Typography><Typography align="center" variant="body1">{`${tiposDocumentoCliente.find(td => td.value === clienteActual.tipo_documento)?.label || ''} - ${clienteActual.documento}`}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Teléfono</Typography><Typography align="center" variant="body1">{clienteActual.telefono || "No especificado"}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Correo</Typography><Typography align="center" variant="body1">{clienteActual.correo}</Typography></Grid>
                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Dirección</Typography><Typography align="center" variant="body1">{clienteActual.direccion || "No especificada"}</Typography></Grid>
                            <Grid
  item
  xs={12}
  sm={6}
  container                // convierte el item en contenedor flex
  direction="column"       // apila los children verticalmente
  justifyContent="center"  // los centra verticalmente
  alignItems="center"      // los centra horizontalmente
>
  <Typography
    variant="body2"
    color="text.secondary"
    align="center"
  >
    Estado
  </Typography>

  <Typography
    component="span"
    className={`estado-label ${clienteActual.activo ? 'activo' : 'inactivo'}`}
  >
    {clienteActual.activo ? 'Activo' : 'Inactivo'}
  </Typography>
</Grid>

                            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary" align="center">Fecha de Registro</Typography><Typography align="center" variant="body1">{clienteActual.fecha_registro ? new Date(clienteActual.fecha_registro).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : "No disponible"}</Typography></Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCloseModals} sx={{ textTransform: 'none' }} color="primary" variant="contained">Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent className="confirm-dialog-content">
                    <Typography>¿Está seguro de que desea eliminar al cliente "<strong>{clientes.find(c => c.id === selectedForDeletion)?.nombre} {clientes.find(c => c.id === selectedForDeletion)?.apellido}</strong>"?</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions className="confirm-dialog-actions">
                    <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={confirmDelete} sx={{ textTransform: 'none' }} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>
            
            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} maxWidth="xs" fullWidth className="confirm-estado">
                <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas cambiar el estado del cliente "<strong>{clienteToToggle?.nombre} {clienteToToggle?.apellido}</strong>" a <strong>{clienteToToggle?.activo ? "Inactivo" : "Activo"}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={handleConfirmToggleState} sx={{ textTransform: 'none' }} color="success" variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default Clientes;