// src/pages/SolicitudCreate.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Button, TextField, Typography, Paper, Grid, Autocomplete, 
    CircularProgress, Alert, InputAdornment, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import { 
    Save as SaveIcon, ArrowBack as ArrowBackIcon, PlaylistAddCheck as SolicitudIcon,
    Add as AddIcon, Cancel as CancelIcon, Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import '../styles/Creditos.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// --- INICIO: LÓGICA Y DATOS PARA EL MODAL DE CREAR CLIENTE ---
const tiposDocumentoCliente = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" },
    { value: "PAS", label: "Pasaporte" },
    { value: "TI", label: "Tarjeta de Identidad" },
];

const initialClienteState = {
    nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "CC", documento: "",
    direccion: "", activo: true
};

const initialClienteErrorsState = {
    nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "", documento: "", direccion: ""
};

const validateClienteField = (name, value) => {
    let error = "";
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    switch (name) {
        case "nombre":
        case "apellido":
            if (!trimmedValue) error = "Este campo es obligatorio.";
            else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) error = "Solo debe contener letras y espacios.";
            break;
        case "correo":
            if (!trimmedValue) error = "El correo es obligatorio.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "Formato de correo inválido.";
            break;
        case "telefono":
            if (!trimmedValue) error = "El teléfono es obligatorio.";
            else if (!/^[0-9]{7,15}$/.test(trimmedValue)) error = "Debe contener solo números, entre 7 y 15 dígitos.";
            break;
        case "documento":
            if (!trimmedValue) error = "El documento es obligatorio.";
            else if (!/^[a-zA-Z0-9-]{6,20}$/.test(trimmedValue)) error = "El documento debe tener entre 6 y 20 caracteres (letras, números, guiones).";
            break;
        case "direccion":
            if (!trimmedValue) error = "La dirección es obligatoria.";
            break;
        default:
            break;
    }
    return error;
};
// --- FIN: LÓGICA PARA EL MODAL ---

const SolicitudCreate = () => {
    const navigate = useNavigate();
    const { authTokens, userPrivileges, logout } = useAuth(); // Incluimos userPrivileges

    const [clientes, setClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [monto, setMonto] = useState('');
    const [plazo, setPlazo] = useState('30');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // --- INICIO: ESTADOS PARA EL MODAL DE CREAR CLIENTE ---
    const [clienteModalOpen, setClienteModalOpen] = useState(false);
    const [newClienteData, setNewClienteData] = useState(initialClienteState);
    const [newClienteErrors, setNewClienteErrors] = useState(initialClienteErrorsState);
    const [savingCliente, setSavingCliente] = useState(false);
    const [generalClienteError, setGeneralClienteError] = useState(null);
    // --- FIN: ESTADOS PARA EL MODAL ---
    
    const fetchClientes = useCallback(async () => {
        setLoading(true);
        const token = authTokens?.access;
        if (!token) {
            toast.error("Sesión no válida.");
            logout();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/?activo=true`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("No se pudieron cargar los clientes.");
            const data = await response.json();
            setClientes(Array.isArray(data) ? data : []);
        } catch (err) {
            setFormError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchClientes();
        }
    }, [authTokens, fetchClientes]);

    // --- INICIO: FUNCIONES PARA MANEJAR EL MODAL ---
    const handleOpenClienteModal = () => {
        setNewClienteData(initialClienteState);
        setNewClienteErrors(initialClienteErrorsState);
        setGeneralClienteError(null);
        setClienteModalOpen(true);
    };

    const handleNewClienteChange = (e) => {
        const { name, value } = e.target;
        setNewClienteData(prev => ({ ...prev, [name]: value }));
        if (newClienteErrors[name] || generalClienteError) {
            const error = validateClienteField(name, value);
            setNewClienteErrors(prev => ({ ...prev, [name]: error }));
            setGeneralClienteError(null);
        }
    };

    const handleSaveNewCliente = async () => {
        setGeneralClienteError(null);
        let formIsValid = true;
        const errors = {};
        for (const field in initialClienteErrorsState) {
            const error = validateClienteField(field, newClienteData[field]);
            if (error) {
                errors[field] = error;
                formIsValid = false;
            }
        }
        setNewClienteErrors(errors);

        if (!formIsValid) {
            setGeneralClienteError("Por favor, corrija los errores en el formulario.");
            return;
        }

        setSavingCliente(true);
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(newClienteData)
            });
            const data = await response.json();
            if (!response.ok) {
                const errorMsg = Object.values(data).flat().join(' ');
                throw new Error(errorMsg || "Error al crear el cliente.");
            }
            
            toast.success(`Cliente "${data.nombre} ${data.apellido}" creado exitosamente.`);
            setClientes(prev => [...prev, data]);
            setSelectedCliente(data);
            setClienteModalOpen(false);

        } catch (error) {
            setGeneralClienteError(error.message);
        } finally {
            setSavingCliente(false);
        }
    };
    // --- FIN: FUNCIONES PARA MANEJAR EL MODAL ---
    
    const handleSave = async () => {
        // ... (lógica de guardado sin cambios)
        setFormError('');
        if (!selectedCliente || !monto || parseFloat(monto) <= 0 || !plazo || parseInt(plazo, 10) <= 0) {
            setFormError("Por favor, complete todos los campos con valores válidos.");
            return;
        }
        setSaving(true);
        const payload = {
            cliente: selectedCliente.id,
            monto_solicitado: parseFloat(monto),
            plazo_dias_solicitado: parseInt(plazo, 10)
        };
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/solicitudes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens?.access}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                const errorMsg = Object.values(data).join(' ');
                throw new Error(errorMsg);
            }
            toast.success("Solicitud de crédito creada exitosamente. Ahora está pendiente de revisión.");
            navigate('/solicitudes');
        } catch (err) {
            setFormError(err.message);
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-indicator"><CircularProgress /></div>;

    return (
        <div className="creditos-container">
            <div className="creditos-title-header">
                <h1><SolicitudIcon sx={{verticalAlign:'middle', mr:1}}/>Crear Solicitud de Crédito</h1>
                <Button variant="outlined" sx={{ textTransform: 'none' }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/solicitudes')}>
                    Volver a Solicitudes
                </Button>
            </div>

            <Paper sx={{ p: 3, mt: 2, borderRadius: '12px' }} elevation={2}>
                {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}
                <Grid container spacing={3}>
                    {/* --- INICIO: CAMBIO EN EL CAMPO DE CLIENTE PARA AÑADIR BOTÓN --- */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Autocomplete
                                sx={{ flexGrow: 1 }}
                                options={clientes}
                                getOptionLabel={(option) => `${option.nombre} ${option.apellido || ''} (${option.documento})`}
                                value={selectedCliente}
                                onChange={(e, newValue) => setSelectedCliente(newValue)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => <TextField {...params} label="Seleccionar Cliente" required />}
                            />
                            {userPrivileges?.includes('clientes_crear') && (
                                <Tooltip title="Crear Nuevo Cliente">
                                    <Button
                                        onClick={handleOpenClienteModal}
                                        variant="contained"
                                        color="primary"
                                        sx={{ height: '56px', minWidth: 'auto', px: 2 }}
                                    >
                                        <AddIcon />
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>
                    </Grid>
                    {/* --- FIN: CAMBIO EN EL CAMPO DE CLIENTE --- */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Monto Solicitado"
                            type="number"
                            fullWidth
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            InputProps={{ inputProps: { min: 1 }, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Plazo Solicitado (días)"
                            type="number"
                            fullWidth
                            value={plazo}
                            onChange={(e) => setPlazo(e.target.value)}
                            InputProps={{ inputProps: { min: 1 } }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", mt:2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                            size="large"
                            sx={{ textTransform: "none", fontSize: "1rem", minWidth: "200px" }}
                        >
                            {saving ? <CircularProgress size={24} color="inherit" /> : "Guardar Solicitud"}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- INICIO: MODAL COMPLETO PARA CREAR CLIENTE --- */}
            <Dialog open={clienteModalOpen} onClose={() => setClienteModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(to right, #e0f2fe, #bfdbfe)', color: '#1e40af' }}>
                    <InfoIcon sx={{ verticalAlign:'middle', mr:1 }} />
                    Agregar Nuevo Cliente
                </DialogTitle>
                <DialogContent dividers>
                    {generalClienteError && <Alert severity="error" sx={{ mb: 2 }}>{generalClienteError}</Alert>}
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required error={!!newClienteErrors.tipo_documento}>
                                <InputLabel>Tipo de Documento</InputLabel>
                                <Select name="tipo_documento" value={newClienteData.tipo_documento} label="Tipo de Documento" onChange={handleNewClienteChange}>
                                    {tiposDocumentoCliente.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                </Select>
                                {newClienteErrors.tipo_documento && <FormHelperText>{newClienteErrors.tipo_documento}</FormHelperText>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="documento" label="Número de Documento" value={newClienteData.documento} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.documento} helperText={newClienteErrors.documento} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="nombre" label="Nombres" value={newClienteData.nombre} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.nombre} helperText={newClienteErrors.nombre} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="apellido" label="Apellidos" value={newClienteData.apellido} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.apellido} helperText={newClienteErrors.apellido} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="correo" label="Correo Electrónico" type="email" value={newClienteData.correo} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.correo} helperText={newClienteErrors.correo} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField name="telefono" label="Teléfono" value={newClienteData.telefono} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.telefono} helperText={newClienteErrors.telefono} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="direccion" label="Dirección" value={newClienteData.direccion} onChange={handleNewClienteChange} fullWidth required multiline rows={3} error={!!newClienteErrors.direccion} helperText={newClienteErrors.direccion} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClienteModalOpen(false)} startIcon={<CancelIcon />} sx={{textTransform: 'none'}} color="inherit" variant="outlined">Cancelar</Button>
                    <Button onClick={handleSaveNewCliente} startIcon={<SaveIcon />} sx={{textTransform: 'none'}} color="primary" variant="contained" disabled={savingCliente}>
                        {savingCliente ? <CircularProgress size={20} /> : "Guardar Cliente"}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- FIN: MODAL COMPLETO --- */}
        </div>
    );
};

export default SolicitudCreate;