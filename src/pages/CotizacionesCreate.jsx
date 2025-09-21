// src/pages/CotizacionesCreate.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Grid, Paper, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Tooltip, Autocomplete, Box,
    CircularProgress, InputAdornment, Snackbar, Alert,
    Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
    InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import {
    Delete as DeleteIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon,
    Add as AddIcon, Cancel as CancelIcon, Info as InfoIcon
} from "@mui/icons-material";
import ProductSearchInput from '../components/ProductSearchInput';
import SummaryCard from '../components/SummaryCard';
import { useAuth } from '../context/AuthContext'; // ✨ 1. Importamos el hook useAuth
import { toast } from 'sonner';
import '../styles/Cotizaciones.css';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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

const initialClienteState = {
    id: null, nombre: "", apellido: "", correo: "", telefono: "",
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
            if (!trimmedValue) error = "El correo electrónico es obligatorio.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "El formato del correo electrónico es inválido.";
            break;
        case "telefono":
            if (!trimmedValue) error = "El teléfono es obligatorio.";
            else if (!/^[0-9]{7,15}$/.test(trimmedValue)) error = "El teléfono debe contener solo números, entre 7 y 15 dígitos.";
            break;
        case "tipo_documento":
            if (!value) error = "Debe seleccionar un tipo de documento.";
            break;
        case "documento":
            if (!trimmedValue) error = "El número de documento es obligatorio.";
            else if (!/^[0-9]{6,20}$/.test(trimmedValue)) error = "El documento debe contener solo números, entre 6 y 20 dígitos.";
            break;
        case "direccion":
            if (!trimmedValue) error = "La dirección es obligatoria.";
            else if (trimmedValue.length < 3) error = "La dirección debe tener al menos 3 caracteres.";
            break;
        default:
            break;
    }
    return error;
};

const CotizacionesCreate = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    // ✨ 2. Obtenemos los datos de autenticación y privilegios del contexto
    const { authTokens, userPrivileges, logout } = useAuth();

    const [cliente, setCliente] = useState(null);
    const [fechaVencimiento, setFechaVencimiento] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0];
    });
    const [items, setItems] = useState([]);
    const [observaciones, setObservaciones] = useState('');
    
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const [clienteModalOpen, setClienteModalOpen] = useState(false);
    const [newClienteData, setNewClienteData] = useState(initialClienteState);
    const [newClienteErrors, setNewClienteErrors] = useState(initialClienteErrorsState);
    const [savingCliente, setSavingCliente] = useState(false);
    const [generalClienteError, setGeneralClienteError] = useState(null);
    
    const showNotification = (message, severity = "success") => setSnackbar({ open: true, message, severity });

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        // ✨ 3. Usamos el token del contexto
        const token = authTokens?.access;
        if (!token) {
            showNotification("Sesión no válida.", "error");
            logout();
            return;
        }
        try {
            const cliRes = await fetch(`${API_BASE_URL}/clientes/?activo=true`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!cliRes.ok) throw new Error("Error cargando clientes.");
            const cliData = await cliRes.json();
            setClientes(Array.isArray(cliData) ? cliData : []);

            if (isEditMode) {
                const cotRes = await fetch(`${API_BASE_URL}/cotizaciones/${id}/`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!cotRes.ok) throw new Error(`Error cargando la cotización #${id}.`);
                const cotData = await cotRes.json();
                
                const clienteSeleccionado = (Array.isArray(cliData) ? cliData : []).find(c => c.id === cotData.cliente.id);
                setCliente(clienteSeleccionado || null);
                setFechaVencimiento(cotData.fecha_vencimiento);
                setObservaciones(cotData.observaciones || '');
                setItems(cotData.items.map(it => ({
                    id: it.producto.id,
                    nombre: it.producto_nombre_historico,
                    marca: it.producto.marca,
                    cantidad: it.cantidad,
                    precio_unitario_cotizado: it.precio_unitario,
                    subtotal: it.subtotal
                })));
            }
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos dependencias
    }, [id, isEditMode, authTokens, logout]);

    useEffect(() => {
        if (authTokens) {
            fetchInitialData();
        }
    }, [authTokens, fetchInitialData]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario_cotizado), 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }, [items]);

    const handleAddProduct = (product) => {
        if (items.some(item => item.id === product.id)) {
            showNotification('Este producto ya está en la lista.', 'info');
            return;
        }
        const newItem = {
            id: product.id,
            nombre: product.nombre,
            marca: product.marca,
            cantidad: 1,
            precio_unitario_cotizado: parseFloat(product.precio_venta || 0),
            subtotal: parseFloat(product.precio_venta || 0),
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemCantidadChange = (index, nuevaCantidad) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        item.cantidad = Math.max(1, parseInt(nuevaCantidad, 10) || 0);
        item.subtotal = item.cantidad * item.precio_unitario_cotizado;
        setItems(updatedItems);
    };

    const handleRemoveItem = (indexToRemove) => setItems(prev => prev.filter((_, i) => i !== indexToRemove));

    const handleOpenClienteModal = () => {
        setNewClienteData(initialClienteState);
        setNewClienteErrors(initialClienteErrorsState);
        setGeneralClienteError(null);
        setClienteModalOpen(true);
    };

    const handleCloseClienteModal = () => {
        setClienteModalOpen(false);
    };

    const handleNewClienteChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === "nombre" || name === "apellido") {
            processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        } else if (name === "documento" || name === "telefono") {
            processedValue = value.replace(/[^0-9]/g, "");
        }
        setNewClienteData(prev => ({ ...prev, [name]: processedValue }));
        const error = validateClienteField(name, processedValue);
        setNewClienteErrors(prev => ({ ...prev, [name]: error }));
        if(generalClienteError) setGeneralClienteError(null);
    };

    const handleApiError = async (response, defaultMessage = "Ocurrió un error.") => {
        let errorMessage = defaultMessage;
        let specificFieldErrors = {};
        try {
            const data = await response.json();
            if (data) {
                if (data.detail) {
                    errorMessage = data.detail;
                } else if (typeof data === 'object') {
                    for (const key in data) {
                        if (Object.prototype.hasOwnProperty.call(initialClienteErrorsState, key)) {
                            specificFieldErrors[key] = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]);
                        }
                    }
                    if (Object.keys(specificFieldErrors).length > 0) {
                        errorMessage = "Por favor, revise los errores en el formulario.";
                    }
                }
            }
        } catch (e) { /* No hacer nada, usar el defaultMessage */ }
        
        return { general: errorMessage, specific: specificFieldErrors };
    };

    const handleSaveNewCliente = async () => {
        setGeneralClienteError(null);
        let formIsValid = true;
        const errors = {};
        Object.keys(initialClienteErrorsState).forEach(field => {
            const error = validateClienteField(field, newClienteData[field]);
            if (error) {
                errors[field] = error;
                formIsValid = false;
            }
        });
        setNewClienteErrors(errors);

        if (!formIsValid) {
            setGeneralClienteError("Por favor, corrija los errores en el formulario.");
            return;
        }

        setSavingCliente(true);
        const token = authTokens?.access;
        const payload = {
            ...newClienteData,
            nombre: newClienteData.nombre.trim(),
            apellido: newClienteData.apellido.trim(),
            correo: newClienteData.correo.trim(),
            documento: newClienteData.documento.trim(),
            telefono: newClienteData.telefono.trim(),
            direccion: newClienteData.direccion.trim(),
        };
        delete payload.id;

        try {
            const response = await fetch(`${API_BASE_URL}/clientes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await handleApiError(response, "Error al crear el cliente.");
                setGeneralClienteError(errorData.general);
                setNewClienteErrors(prev => ({...prev, ...errorData.specific}));
                return;
            }

            const clienteCreado = await response.json();
            showNotification(`Cliente "${clienteCreado.nombre} ${clienteCreado.apellido}" creado exitosamente.`);
            
            setClientes(prev => [...prev, clienteCreado]);
            setCliente(clienteCreado);
            
            handleCloseClienteModal();

        } catch (error) {
            setGeneralClienteError(error.message || "Ocurrió un error de red.");
        } finally {
            setSavingCliente(false);
        }
    };

    const handleSave = async () => {
        if (!cliente || items.length === 0) {
            showNotification("Debe seleccionar un cliente y agregar al menos un producto.", "error");
            return;
        }

        setSaving(true);
        const url = isEditMode ? `${API_BASE_URL}/cotizaciones/${id}/` : `${API_BASE_URL}/cotizaciones/`;
        const method = isEditMode ? 'PUT' : 'POST';
        
        const payload = {
            cliente: cliente.id,
            fecha_vencimiento: fechaVencimiento,
            observaciones: observaciones,
            items: items.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario_cotizado: item.precio_unitario_cotizado
            }))
        };
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens?.access}` },
                body: JSON.stringify(payload)
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.detail || "Error al guardar la cotización.");
            
            showNotification(`Cotización ${isEditMode ? 'actualizada' : 'creada'} con éxito.`);
            navigate('/cotizaciones');
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const today = new Date().toISOString().split("T")[0];

    if (loading) return <div className="loading-indicator"><CircularProgress /></div>;

    return (
        <div className="cotizaciones-container">
            <div className="cotizaciones-title-header">
                <h1>{isEditMode ? 'Editar Cotización' : 'Nueva Cotización'}</h1>
                <Button sx={{textTransform: "none"}} variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/cotizaciones')}>Volver a la Lista</Button>
            </div>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
                        <ProductSearchInput onProductSelect={handleAddProduct} label="Buscar producto para cotizar" />
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mt: 3 }} className="cotizaciones-table">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell align="center">Cantidad</TableCell>
                                        <TableCell align="center">Precio Unit.</TableCell>
                                        <TableCell align="center">Subtotal</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Añada productos</TableCell></TableRow>
                                    ) : (
                                        items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.nombre} <Typography variant="caption" color="textSecondary">({item.marca})</Typography></TableCell>
                                                <TableCell align="center">
                                                    <TextField type="number" value={item.cantidad} onChange={(e) => handleItemCantidadChange(index, e.target.value)} size="small" sx={{ width: '90px' }} inputProps={{ min: 1 }}/>
                                                </TableCell>
                                                <TableCell align="center">{formatCurrency(item.precio_unitario_cotizado)}</TableCell>
                                                <TableCell align="center">{formatCurrency(item.subtotal)}</TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Eliminar"><IconButton onClick={() => handleRemoveItem(index)} color="error" size="small"><DeleteIcon /></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <SummaryCard title="Resumen de Cotización" subtotal={totals.subtotal} iva={totals.iva} total={totals.total}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Autocomplete
                                sx={{ flexGrow: 1 }}
                                options={clientes}
                                getOptionDisabled={(option) => !option.activo}
                                getOptionLabel={(option) => `${option.nombre} ${option.apellido || ''} (${option.tipo_documento || 'CC'}: ${option.documento}) ${!option.activo ? '(Inactivo)' : ''}`}
                                value={cliente}
                                onChange={(e, newValue) => setCliente(newValue)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => <TextField {...params} label="Cliente" required />}
                                disabled={isEditMode}
                            />
                            {/* ✨ 5. Ocultamos el botón si el usuario no tiene el privilegio */}
                            {userPrivileges.includes('clientes_crear') && !isEditMode && (
                                <Tooltip title="Crear Nuevo Cliente">
                                    <Box>
                                        <Button
                                            onClick={handleOpenClienteModal}
                                            variant="contained" color="primary"
                                            sx={{ height: '56px', minWidth: 'auto', px: 2 }}
                                        >
                                            <AddIcon />
                                        </Button>
                                    </Box>
                                </Tooltip>
                            )}
                        </Box>
                        
                        <TextField
                            label="Fecha de Vencimiento"
                            type="date"
                            value={fechaVencimiento}
                            onChange={(e) => setFechaVencimiento(e.target.value)}
                            fullWidth
                            sx={{ mt: 2 }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: today }}
                        />
                        
                        <TextField label="Observaciones (Opcional)" multiline rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} fullWidth sx={{ mt: 2 }}/>
                        
                        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSave}
                            disabled={saving || !cliente || items.length === 0} fullWidth sx={{ mt: 3, py: 1.5, textTransform: 'none' }}>
                            {saving ? <CircularProgress size={26} color="inherit" /> : (isEditMode ? 'Actualizar Cotización' : 'Crear Cotización')}
                        </Button>
                    </SummaryCard>
                </Grid>
            </Grid>
            
            <Dialog open={clienteModalOpen} onClose={handleCloseClienteModal} maxWidth="md" fullWidth>
                <DialogTitle> <InfoIcon sx={{verticalAlign:'middle', mr:1}}/>Agregar Nuevo Cliente</DialogTitle>
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
                    <Button onClick={handleCloseClienteModal} startIcon={<CancelIcon />} sx={{ textTransform: 'none' }} color="inherit" variant="outlined">Cancelar</Button>
                    <Button onClick={handleSaveNewCliente} startIcon={<SaveIcon />} sx={{ textTransform: 'none' }} color="primary" variant="contained" disabled={savingCliente}>
                        {savingCliente ? <CircularProgress size={20} /> : "Guardar Cliente"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default CotizacionesCreate;