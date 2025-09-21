import React, { useState, useEffect, useCallback } from "react";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Select,
    Snackbar, Alert, IconButton, Tooltip, TablePagination,
    InputAdornment, FormControlLabel, Checkbox, CircularProgress, Typography,
    Box, FormControl, InputLabel, FormHelperText, Grid
} from "@mui/material";
import {
    Visibility, Edit, Delete, Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon,
    Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from '../context/AuthContext';
import "../styles/Proveedores.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const tiposDocumentoPersonaNatural = [
    { value: "CC", label: "Cédula de Ciudadanía (C.C)" },
    { value: "TI", label: "Tarjeta de Identidad (T.I)" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PPT", label: "Permiso por Protección Temporal" },
    { value: "Pasaporte", label: "Pasaporte" },
];

const tiposDocumentoEmpresa = [
    { value: "NIT", label: "Número de Identificación Tributaria (NIT)" },
];

const getBackendErrorMessage = (errorData, defaultMessage = "Ocurrió un error.") => {
    if (!errorData) return defaultMessage;
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.non_field_errors)) return errorData.non_field_errors.join('; ');
    if (typeof errorData === 'object') {
        if (errorData.documento) return `Documento: ${errorData.documento[0]}`;
        if (errorData.correo) return `Correo: ${errorData.correo[0]}`;
        return Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
    }
    return defaultMessage;
};

const Proveedores = () => {
    const { authTokens, user, logout } = useAuth();

    const canCreate = user?.privileges?.includes('proveedores_crear');
    const canEdit = user?.privileges?.includes('proveedores_editar');
    const canDelete = user?.privileges?.includes('proveedores_eliminar');

    const [proveedores, setProveedores] = useState([]);
    const [openFormModal, setOpenFormModal] = useState(false);
    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false); // ✨ RESTAURADO
    const [editMode, setEditMode] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);

    const initialFormState = {
        nombre: "", tipo_documento: "", documento: "", telefono: "",
        correo: "", direccion: "", contacto: "", estado: 'Activo', es_empresa: false,
    };
    const [formState, setFormState] = useState(initialFormState);

    const initialFieldErrorsState = {
        nombre: "", tipo_documento: "", documento: "", telefono: "",
        correo: "", direccion: "", contacto: ""
    };
    const [fieldErrors, setFieldErrors] = useState(initialFieldErrorsState);

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProveedores, setFilteredProveedores] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [generalFormError, setGeneralFormError] = useState(null);
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
    const [proveedorToToggle, setProveedorToToggle] = useState(null);

    const showNotification = (message, severity = "success") => setSnackbar({ open: true, message, severity });
    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const validateField = (name, value, currentFormState) => {
  let error = "";
  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  switch (name) {
    case "nombre":
      if (!trimmedValue) error = "El nombre es obligatorio.";
      else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,'&-/]+$/.test(trimmedValue)) error = "El nombre contiene caracteres inválidos.";
      break;

    case "tipo_documento":
      if (!trimmedValue) error = "El tipo de documento es obligatorio.";
      break;

    case "documento": {
      if (!trimmedValue) { error = "El número de documento es obligatorio."; break; }

      const esNIT = currentFormState.es_empresa || currentFormState.tipo_documento === "NIT";
      const esPasaporte = currentFormState.tipo_documento === "Pasaporte";

      if (esNIT) {
        // acepta 123456789-0 o 10 dígitos sin guion
        if (!/^[0-9]{9}(?:-[0-9])?$/.test(trimmedValue) && !/^[0-9]{10}$/.test(trimmedValue)) {
          error = "NIT inválido. Formato: 123456789 o 123456789-0.";
        }
      } else if (esPasaporte) {
        if (!/^[A-Za-z0-9]{6,20}$/.test(trimmedValue)) {
          error = "El pasaporte debe ser alfanumérico (6 a 20 caracteres).";
        }
      } else {
        if (!/^[0-9]{6,20}$/.test(trimmedValue)) {
          error = "Debe ser numérico, entre 6 y 20 dígitos.";
        }
      }
      break;
    }

    case "telefono":
      if (!trimmedValue) error = "El teléfono es obligatorio.";
      else if (!/^[0-9]{7,15}$/.test(trimmedValue)) error = "Debe contener solo números, entre 7 y 15 dígitos.";
      break;

    case "correo":
      if (!trimmedValue) error = "El correo es obligatorio.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "Formato de correo inválido.";
      break;

    case "direccion":
      if (!trimmedValue) error = "La dirección es obligatoria.";
      break;

    case "contacto":
      if (currentFormState.es_empresa && !trimmedValue) error = "El nombre de contacto es obligatorio para empresas.";
      else if (trimmedValue && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) error = "El contacto solo debe contener letras y espacios.";
      break;

    default: break;
  }
  return error;
};

    const fetchData = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) { logout(); return; }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/proveedores/`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) logout();
                throw new Error("Error al cargar los proveedores.");
            }
            const data = await response.json();
            setProveedores(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    setFilteredProveedores(
        proveedores.filter(prov => {
            // Campos que aparecen en la tabla
            const campos = [
                `${prov.tipo_documento}: ${prov.documento}`,
                prov.nombre,
                prov.telefono,
                prov.correo,
                prov.direccion,
                prov.contacto,
                prov.estado, // "Activo" o "Inactivo"
            ];

            return campos.some(campo =>
                (campo ? campo.toString().toLowerCase() : "").includes(lowerSearchTerm)
            );
        })
    );
    setPage(0);
}, [searchTerm, proveedores]);


    const handleSave = async () => {
        const newErrors = {};
        let formIsValid = true;
        Object.keys(initialFieldErrorsState).forEach(key => {
            const error = validateField(key, formState[key], formState);
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
        const token = authTokens?.access;
        const proveedorData = {
            ...formState,
            contacto: formState.es_empresa ? formState.contacto : null,
        };
        const url = editMode ? `${API_PROVEEDORES_ENDPOINT}${selectedProveedor.id}/` : API_PROVEEDORES_ENDPOINT;
        const method = editMode ? "PUT" : "POST";
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(proveedorData)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(getBackendErrorMessage(errorData));
            }
            showNotification(`Proveedor ${editMode ? "actualizado" : "agregado"} correctamente.`);
            fetchData();
            handleCloseModals();
        } catch (err) {
            setGeneralFormError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        const token = authTokens?.access;
        if (!selectedForDeletion || !token) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_PROVEEDORES_ENDPOINT}${selectedForDeletion.id}/`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok && res.status !== 204) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Error al eliminar el proveedor.");
            }
            showNotification("Proveedor eliminado correctamente.");
            fetchData();
        } catch (err) {
            showNotification(err.message, "error");
        } finally {
            setActionLoading(false);
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
        }
    };

    const handleToggleActivo = async (proveedor) => {
    const token = authTokens?.access;
    if (!token) return;
    setActionLoading(true);

    // Mapear estado actual a string
    const nuevoEstado = proveedor.estado === "Activo" ? "Inactivo" : "Activo";

    try {
        const res = await fetch(`${API_PROVEEDORES_ENDPOINT}${proveedor.id}/`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ estado: nuevoEstado }) // 👈 aquí va "Activo"/"Inactivo"
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Error al cambiar el estado.");
        }
        fetchData();
    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        setActionLoading(false);
    }
};

    // ✨ RESTAURADO: Función para abrir modal de detalles
    const handleVerDetalle = (proveedor) => {
        setSelectedProveedor(proveedor);
        setViewDetailsModalOpen(true);
    };

    const handleOpenModal = (proveedor = null) => {
        const isEditMode = !!proveedor;
        setEditMode(isEditMode);
        setSelectedProveedor(proveedor);

        if (proveedor) {
            setFormState({
                nombre: proveedor.nombre || "",
                tipo_documento: proveedor.tipo_documento || "",
                documento: proveedor.documento || "",
                telefono: proveedor.telefono || "",
                correo: proveedor.correo || "",
                direccion: proveedor.direccion || "",
                contacto: proveedor.contacto || "",
                estado: proveedor.estado,
                es_empresa: proveedor.es_empresa,
            });
        } else {
            setFormState(initialFormState);
        }
        
        setFieldErrors(initialFieldErrorsState);
        setGeneralFormError(null);
        setOpenFormModal(true);
    };

    const handleCloseModals = () => {
        setOpenFormModal(false); 
        setViewDetailsModalOpen(false);
        setSelectedProveedor(null);
    };

    const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  const isCheckbox = type === 'checkbox';

  setFormState(prev => {
    // 1) Punto de partida
    let next = { ...prev };

    // 2) Cambios especiales de es_empresa y tipo_documento
    if (name === 'es_empresa') {
      next.es_empresa = checked;
      next.tipo_documento = checked ? 'NIT' : '';
      next.documento = '';
      if (!checked) next.contacto = '';
    } else if (name === 'tipo_documento') {
      next.tipo_documento = value;
      // si el usuario elige NIT desde el select, forzamos es_empresa
      next.es_empresa = value === 'NIT';
      // al cambiar tipo, limpiamos documento para volver a validar con la nueva regla
      next.documento = '';
    } else {
      next[name] = isCheckbox ? checked : value;
    }

    // 3) Saneado/bloqueo de entrada en tiempo real
    const esNIT = next.es_empresa || next.tipo_documento === 'NIT';
    const esPasaporte = next.tipo_documento === 'Pasaporte';

    if (name === 'documento' || name === 'tipo_documento') {
      let doc = next.documento || '';
      if (esNIT) {
        // Solo dígitos y un guion máximo
        doc = doc.replace(/[^0-9-]/g, "");
        const hyphens = (doc.match(/-/g) || []).length;
        if (hyphens > 1) {
          // recorta hasta el último guion válido
          const idx = doc.lastIndexOf('-');
          doc = doc.slice(0, idx) + doc.slice(idx + 1);
        }
        // evita "--"
        doc = doc.replace(/--+/g, "-");
      } else if (esPasaporte) {
        doc = doc.replace(/[^A-Za-z0-9]/g, "");
      } else {
        doc = doc.replace(/[^0-9]/g, "");
      }
      next.documento = doc;
    }

    if (name === 'telefono') {
      next.telefono = (next.telefono || '').replace(/[^0-9]/g, "");
    }

    if (name === 'nombre') {
      next.nombre = (next.nombre || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,'&-/]/g, "");
    }

    if (name === 'contacto') {
      // solo letras y espacios
      next.contacto = (next.contacto || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }

    // 4) Revalidación inmediata del campo editado
    const err = validateField(name, next[name], next);
    setFieldErrors(prevErrs => ({ ...prevErrs, [name]: err }));

    // 5) Revalidación cruzada doc/tipo
    if (name === 'tipo_documento' || name === 'documento') {
      const docErr = validateField('documento', next.documento, next);
      const tipoErr = validateField('tipo_documento', next.tipo_documento, next);
      setFieldErrors(prevErrs => ({ ...prevErrs, documento: docErr, tipo_documento: tipoErr }));
    }

    // 6) Si había error general, lo limpiamos al escribir
    if (generalFormError) setGeneralFormError(null);

    return next;
  });
};


    const handleDelete = (proveedor) => { setSelectedForDeletion(proveedor); setConfirmDialogOpen(true); };
    const handleOpenStateConfirmDialog = (proveedor) => {
        if (!canEdit || actionLoading) return;
        setProveedorToToggle(proveedor);
        setConfirmStatusDialogOpen(true);
    };
    const handleConfirmToggleState = () => {
        if (proveedorToToggle) handleToggleActivo(proveedorToToggle);
        setConfirmStatusDialogOpen(false);
        setProveedorToToggle(null);
    };
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10)); setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");
    const paginatedProveedores = filteredProveedores.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
    if (loading) {
        return <div className="loading-indicator"><CircularProgress /> Cargando proveedores...</div>;
    }

    return (
        <div className="proveedores-container">
            <div className="proveedores-title-header"><h1>Gestión de Proveedores</h1></div>
            <Box className="proveedores-toolbar">
                <TextField placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined" size="small"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>),
                    }} sx={{ minWidth: '400px', backgroundColor: 'white' }} />
                
                {canCreate && (
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenModal(null)} className="add-button"
                    sx={{ textTransform: 'none' }}>Agregar Proveedor</Button>
                )}
            </Box>

            <TableContainer component={Paper} className="proveedores-table" variant="outlined">
                <Table stickyHeader>
                    {/* ✨ RESTAURADO: Columnas originales de la tabla */}
                    <TableHead><TableRow>
                        <TableCell align="center">Documento</TableCell>
                        <TableCell align="center">Nombre / Razón Social</TableCell>
                        <TableCell align="center">Teléfono</TableCell>
                        <TableCell align="center">Correo</TableCell>
                        <TableCell align="center">Dirección</TableCell>
                        <TableCell align="center">Contacto</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="center" style={{ minWidth: '130px' }}>Acciones</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {paginatedProveedores.length > 0 ? paginatedProveedores.map((p) => (
                            <TableRow key={p.id} className={!p.estado ? "row-inactivo" : ""} hover>
                                <TableCell align="center">{`${p.tipo_documento}: ${p.documento}`}</TableCell>
                                <TableCell align="center">{p.nombre}</TableCell>
                                <TableCell align="center">{p.telefono || "N/A"}</TableCell>
                                <TableCell align="center">{p.correo || "N/A"}</TableCell>
                                <TableCell align="center">{p.direccion || "N/A"}</TableCell>
                                <TableCell align="center">{p.contacto || "N/A"}</TableCell>
                                <TableCell align="center">
  <Typography 
    component="span"
    className={`estado-label ${p.estado === "Activo" ? "activo" : "inactivo"} ${canEdit ? "estado-clickable" : ""}`}
    onClick={() => handleOpenStateConfirmDialog(p)}
  >
    {p.estado === "Activo" ? "Activo" : "Inactivo"}
  </Typography>
</TableCell>

                                <TableCell align="center" className="actions-cell">
                                    {/* ✨ RESTAURADO: Botón para ver detalles */}
                                    <Box display="flex" justifyContent="center" gap={0.5}>
                                        <Tooltip title="Ver detalles" arrow><span><IconButton color="info" onClick={() => handleVerDetalle(p)} size="small"><Visibility /></IconButton></span></Tooltip>
                                        <Tooltip title="Editar" arrow><span><IconButton color="primary" onClick={() => handleOpenModal(p)} size="small" disabled={!canEdit}><Edit /></IconButton></span></Tooltip>
                                        <Tooltip title="Eliminar" arrow><span><IconButton color="error" onClick={() => handleDelete(p)} size="small" disabled={!canDelete}><Delete /></IconButton></span></Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={8} align="center">No hay proveedores para mostrar.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={filteredProveedores.length} rowsPerPage={rowsPerPage}
                    page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                />
            </TableContainer>

            <Dialog open={openFormModal} onClose={handleCloseModals} maxWidth="md" fullWidth>
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

                    {editMode ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
                </DialogTitle>
                <DialogContent dividers>
                    {generalFormError && <Alert severity="error" sx={{ mb: 2 }}>{generalFormError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Checkbox checked={formState.es_empresa} onChange={handleChange} name="es_empresa" disabled={editMode} />} label="Este proveedor es una empresa" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="nombre" label={formState.es_empresa ? "Razón Social" : "Nombre Completo"} value={formState.nombre} onChange={handleChange} fullWidth required error={!!fieldErrors.nombre} helperText={fieldErrors.nombre} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required error={!!fieldErrors.tipo_documento} disabled={editMode}>
                                <InputLabel id="tipo-doc-label">Tipo de Documento</InputLabel>
                                <Select labelId="tipo-doc-label" name="tipo_documento" value={formState.tipo_documento} label="Tipo de Documento" onChange={handleChange} disabled={editMode || formState.es_empresa}>
                                    {(formState.es_empresa ? tiposDocumentoEmpresa : tiposDocumentoPersonaNatural).map(tipo => (<MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>))}
                                </Select>
                                {fieldErrors.tipo_documento && <FormHelperText>{fieldErrors.tipo_documento}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="documento" label="Número de Documento" value={formState.documento} onChange={handleChange} fullWidth required disabled={editMode} error={!!fieldErrors.documento} helperText={fieldErrors.documento} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="correo" label="Correo Electrónico" type="email" value={formState.correo} onChange={handleChange} fullWidth required error={!!fieldErrors.correo} helperText={fieldErrors.correo} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="telefono" label="Teléfono" value={formState.telefono} onChange={handleChange} fullWidth required error={!!fieldErrors.telefono} helperText={fieldErrors.telefono} />
                        </Grid>
                        {formState.es_empresa && (
                            <Grid item xs={12} sm={6}>
                                <TextField name="contacto" label="Nombre del Contacto" value={formState.contacto} onChange={handleChange} fullWidth required={formState.es_empresa} error={!!fieldErrors.contacto} helperText={fieldErrors.contacto} />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={formState.es_empresa ? 6 : 12}>
                            <TextField name="direccion" label="Dirección" value={formState.direccion} onChange={handleChange} fullWidth required error={!!fieldErrors.direccion} helperText={fieldErrors.direccion} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCloseModals} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSave} sx={{ textTransform: 'none' }} color="primary" variant="contained" startIcon={<SaveIcon />} disabled={actionLoading}>{actionLoading ? <CircularProgress size={24} color="inherit" /> : (editMode ? "Actualizar" : "Guardar")}</Button>
                </DialogActions>
            </Dialog>
            
            {/* ✨ RESTAURADO: Modal para ver detalles */}
            <Dialog open={viewDetailsModalOpen} onClose={handleCloseModals} maxWidth="sm" fullWidth>
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

                    Detalles del Proveedor
                </DialogTitle>
                <DialogContent dividers>
                    {selectedProveedor && (
                        <Grid container spacing={2} sx={{ p: 2 }}>
                            <Grid item xs={12} sm={6}>
  <Box textAlign="center">   {/* centra todo el contenido */}
    <Typography variant="caption" color="textSecondary">
      Nombre / Razón Social
    </Typography>
    <Typography variant="body1">
      {selectedProveedor.nombre}
    </Typography>
  </Box>
</Grid>

                            <Grid item xs={12} sm={6}>
  <Box textAlign="center">
    <Typography variant="caption" color="textSecondary">
      Documento
    </Typography>
    <Typography variant="body1">
      {`${selectedProveedor.tipo_documento}: ${selectedProveedor.documento}`}
    </Typography>
  </Box>
</Grid>

                            <Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <Box textAlign="center">
      <Typography variant="caption" color="textSecondary">
        Correo Electrónico
      </Typography>
      <Typography variant="body1">
        {selectedProveedor.correo}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12} sm={6}>
    <Box textAlign="center">
      <Typography variant="caption" color="textSecondary">
        Teléfono
      </Typography>
      <Typography variant="body1">
        {selectedProveedor.telefono}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12}>
    <Box textAlign="center">
      <Typography variant="caption" color="textSecondary">
        Dirección
      </Typography>
      <Typography variant="body1">
        {selectedProveedor.direccion}
      </Typography>
    </Box>
  </Grid>

  {selectedProveedor.es_empresa && (
    <Grid item xs={12} sm={6}>
      <Box textAlign="center">
        <Typography variant="caption" color="textSecondary">
          Nombre del Contacto
        </Typography>
        <Typography variant="body1">
          {selectedProveedor.contacto || 'N/A'}
        </Typography>
      </Box>
    </Grid>
  )}

  <Grid item xs={12} sm={6}>
    <Box textAlign="center">
      <Typography variant="caption" color="textSecondary">
        Estado
      </Typography>
      <Typography
        component="div"
        className={`estado-label ${selectedProveedor.estado ? 'activo' : 'inactivo'}`}
        sx={{ width: 'fit-content', mx: 'auto' }}
      >
        {selectedProveedor.estado ? 'Activo' : 'Inactivo'}
      </Typography>
    </Box>
  </Grid>
</Grid>

                        </Grid>
                    )}
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCloseModals} color="primary" variant="contained" sx={{ textTransform: 'none' }}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Eliminación</DialogTitle>
                <DialogContent><Typography>¿Está seguro de que desea eliminar al proveedor "<strong>{selectedForDeletion?.nombre || ''}</strong>"?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" sx={{textTransform:'none'}} variant="contained" disabled={actionLoading}>{actionLoading ? <CircularProgress size={24} /> : "Eliminar"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} maxWidth="xs" className="confirm-estado">
                <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent><Typography>¿Estás seguro de que deseas cambiar el estado del proveedor "<strong>{proveedorToToggle?.nombre}</strong>" a <strong>{proveedorToToggle?.estado ? "Inactivo" : "Activo"}</strong>?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} sx={{textTransform: 'none'}} color="inherit" variant="outlined" disabled={actionLoading}>Cancelar</Button>
                    <Button onClick={handleConfirmToggleState} color="success" sx={{textTransform: 'none'}} variant="contained" disabled={actionLoading}>{actionLoading ? <CircularProgress size={24} /> : "Confirmar"}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default Proveedores;