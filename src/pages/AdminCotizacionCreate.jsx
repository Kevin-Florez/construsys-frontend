// src/pages/AdminCotizacionCreate.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid, Paper, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Tooltip, Autocomplete, Box,
    CircularProgress, Dialog, DialogTitle, DialogContent, 
    DialogActions, FormControl, InputLabel, Select, MenuItem, FormHelperText, Alert
} from '@mui/material';
import {
    Delete as DeleteIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon, 
    Add as AddIcon, Cancel as CancelIcon, Info as InfoIcon
} from "@mui/icons-material";
import { useAuth } from '../context/AuthContext';
import ProductSearchInput from '../components/ProductSearchInput'; // Asegúrate de que la ruta a este componente es correcta
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// --- CONSTANTES Y FUNCIONES PARA EL MODAL DE NUEVO CLIENTE ---
const tiposDocumentoCliente = [
    { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" }, { value: "PAS", label: "Pasaporte" },
    { value: "TI", label: "Tarjeta de Identidad" },
];

const initialClienteState = {
    nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "CC", documento: "", direccion: "", activo: true
};

const initialClienteErrorsState = {
    nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "", documento: "", direccion: ""
};

const validateClienteField = (name, value) => {
    let error = "";
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    switch (name) {
        case "nombre": case "apellido":
            if (!trimmedValue) error = "Este campo es obligatorio.";
            else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) error = "Solo debe contener letras y espacios.";
            break;
        case "correo":
            if (!trimmedValue) error = "El correo es obligatorio.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) error = "El formato del correo es inválido.";
            break;
        case "telefono":
            if (!trimmedValue) error = "El teléfono es obligatorio.";
            else if (!/^[0-9]{7,15}$/.test(trimmedValue)) error = "Debe contener solo números (7-15 dígitos).";
            break;
        case "documento":
            if (!trimmedValue) error = "El número de documento es obligatorio.";
            else if (!/^[0-9]{6,20}$/.test(trimmedValue)) error = "Debe contener solo números (6-20 dígitos).";
            break;
        case "direccion":
            if (!trimmedValue) error = "La dirección es obligatoria.";
            break;
        default: break;
    }
    return error;
};


export default function AdminCotizacionCreate() {
    const navigate = useNavigate();
    const { authTokens, user } = useAuth();
    
    // Estados principales
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [tipoDestinatario, setTipoDestinatario] = useState('existente'); // 'existente' o 'invitado'
    const [datosInvitado, setDatosInvitado] = useState({ nombre: '', email: '' });
    const [items, setItems] = useState([]);
    
    // Estados de soporte
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Estados para el modal de nuevo cliente
    const [clienteModalOpen, setClienteModalOpen] = useState(false);
    const [newClienteData, setNewClienteData] = useState(initialClienteState);
    const [newClienteErrors, setNewClienteErrors] = useState(initialClienteErrorsState);
    const [savingCliente, setSavingCliente] = useState(false);
    const [generalClienteError, setGeneralClienteError] = useState(null);
    
    const canCreateCliente = user?.privileges?.includes('clientes_crear');

    // Cargar clientes existentes al montar el componente
    useEffect(() => {
        const fetchClientes = async () => {
            if (!authTokens) return;
            try {
                const res = await fetch(`${API_BASE_URL}/clientes/?activo=true`, { 
                    headers: { 'Authorization': `Bearer ${authTokens.access}` }
                });
                if (!res.ok) throw new Error("Error cargando la lista de clientes.");
                const data = await res.json();
                setClientes(Array.isArray(data) ? data : []);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchClientes();
    }, [authTokens]);

    const totals = useMemo(() => {
        const TASA_IVA = 0.19; // O puedes obtenerlo desde la configuración del backend si es variable
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * TASA_IVA;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }, [items]);

    const handleAddProduct = (product) => {
        if (items.some(item => item.id === product.id)) {
            toast.warning('Este producto ya está en la lista.');
            return;
        }
        const newItem = {
            id: product.id,
            nombre: product.nombre,
            cantidad: 1,
            precio_unitario: parseFloat(product.precio_venta || 0),
            subtotal: parseFloat(product.precio_venta || 0),
        };
        setItems(prev => [...prev, newItem]);
    };
    
    const handleItemCantidadChange = (index, nuevaCantidad) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        const cantidadNum = Math.max(1, parseInt(nuevaCantidad, 10) || 1);
        item.cantidad = cantidadNum;
        item.subtotal = item.cantidad * item.precio_unitario;
        setItems(updatedItems);
    };

    const handleRemoveItem = (indexToRemove) => setItems(prev => prev.filter((_, i) => i !== indexToRemove));

    const handleSaveCotizacion = async () => {
        if (tipoDestinatario === 'existente' && !clienteSeleccionado) {
            toast.error("Debe seleccionar un cliente registrado.");
            return;
        }
        if (tipoDestinatario === 'invitado' && (!datosInvitado.nombre.trim() || !datosInvitado.email.trim())) {
            toast.error("Debe completar el nombre y el correo del invitado.");
            return;
        }
        if (items.length === 0) {
            toast.error("Debe agregar al menos un producto a la cotización.");
            return;
        }
        
        setSaving(true);
        const payload = {
            detalles: items.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
        };
        if (tipoDestinatario === 'existente') {
            payload.cliente_id = clienteSeleccionado.id;
        } else {
            payload.nombre_invitado = datosInvitado.nombre;
            payload.email_invitado = datosInvitado.email;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/admin/crear/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || Object.values(errorData).join(' ') || "Error al crear la cotización.";
                throw new Error(errorMessage);
            }
            toast.success("Cotización creada exitosamente.");
            navigate('/cotizaciones');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };
    
    // --- Lógica del Modal de Cliente ---
    const handleOpenClienteModal = () => { 
        setNewClienteData(initialClienteState); 
        setNewClienteErrors(initialClienteErrorsState); 
        setGeneralClienteError(null); 
        setClienteModalOpen(true); 
    };

    const handleCloseClienteModal = () => setClienteModalOpen(false);

    const handleNewClienteChange = (e) => {
        const { name, value } = e.target;
        setNewClienteData(prev => ({ ...prev, [name]: value }));
        const error = validateClienteField(name, value);
        setNewClienteErrors(prev => ({ ...prev, [name]: error }));
        if (generalClienteError) setGeneralClienteError(null);
    };

    const handleSaveNewCliente = async () => {
        let formIsValid = true;
        const newErrors = {};
        for (const key in initialClienteErrorsState) {
            const error = validateClienteField(key, newClienteData[key]);
            if (error) {
                newErrors[key] = error;
                formIsValid = false;
            }
        }
        setNewClienteErrors(newErrors);
        if (!formIsValid) {
            setGeneralClienteError("Por favor, corrija los errores en el formulario.");
            return;
        }
    
        setSavingCliente(true);
        setGeneralClienteError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(newClienteData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                setGeneralClienteError(errorData.detail || "Hubo un error al guardar.");
                // Opcional: Mapear errores de la API a los campos
                if (typeof errorData === 'object') {
                    setNewClienteErrors(prev => ({...prev, ...errorData}));
                }
                return;
            }
            const clienteCreado = await response.json();
            toast.success(`Cliente "${clienteCreado.nombre} ${clienteCreado.apellido}" creado.`);
            setClientes(prev => [...prev, clienteCreado]);
            setClienteSeleccionado(clienteCreado); // Selecciona el nuevo cliente automáticamente
            handleCloseClienteModal();
        } catch (error) {
            setGeneralClienteError("Error de conexión. Intente de nuevo.");
        } finally {
            setSavingCliente(false);
        }
    };
    

    if (loading) {
        return <div className="loading-indicator" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /> <Typography sx={{ml: 2}}>Cargando datos...</Typography></div>;
    }

    return (
        <div className="ventas-container" style={{ padding: '24px' }}>
            <div className="ventas-title-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>Crear Nueva Cotización</h1>
                <Button variant="outlined" sx={{textTransform: 'none'}} startIcon={<ArrowBackIcon />} onClick={() => navigate('/cotizaciones')}>
                    Volver a la Lista
                </Button>
            </div>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
                        <Typography variant="h6" gutterBottom>Productos</Typography>
                        <ProductSearchInput onProductSelect={handleAddProduct} label="Buscar y agregar producto..." />
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mt: 3 }} className='ccc'>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: "#f4f5f7" }}>
                                    <TableRow>
                                        <TableCell align="center">Producto</TableCell>
                                        <TableCell align="center" sx={{ width: '120px' }}>Cantidad</TableCell>
                                        <TableCell align="center">Precio Unit.</TableCell>
                                        <TableCell align="center">Subtotal</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Añada productos a la cotización</TableCell></TableRow>
                                    ) : (
                                        items.map((item, index) => (
                                            <TableRow key={item.id} hover>
                                                <TableCell align="center">{item.nombre}</TableCell>
                                                <TableCell align="center">
                                                    <TextField type="number" value={item.cantidad}
                                                        onChange={(e) => handleItemCantidadChange(index, e.target.value)}
                                                        size="small" sx={{ width: '90px' }} inputProps={{ min: 1 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">{formatCurrency(item.precio_unitario)}</TableCell>
                                                <TableCell align="center" sx={{fontWeight: 500}}>{formatCurrency(item.subtotal)}</TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Eliminar">
                                                        <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
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
                    <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
                        <Typography variant="h6" gutterBottom>Destinatario</Typography>
                        
                        <FormControl fullWidth margin="normal">
                          <Select value={tipoDestinatario} onChange={(e) => setTipoDestinatario(e.target.value)}>
                            <MenuItem value="existente">Cliente Existente</MenuItem>
                            <MenuItem value="invitado">Cliente Invitado</MenuItem>
                          </Select>
                        </FormControl>
                        
                        {tipoDestinatario === 'existente' ? (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
                                <Autocomplete
                                    sx={{ flexGrow: 1 }}
                                    options={clientes}
                                    getOptionLabel={(option) => `${option.nombre} ${option.apellido} (${option.documento})`}
                                    value={clienteSeleccionado}
                                    onChange={(e, newValue) => setClienteSeleccionado(newValue)}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => <TextField {...params} label="Buscar Cliente" />}
                                />
                                {canCreateCliente && (
                                    <Tooltip title="Crear Nuevo Cliente">
                                        <Button onClick={handleOpenClienteModal} variant="contained" sx={{ height: '56px', minWidth: 'auto', px: 2 }}>
                                            <AddIcon />
                                        </Button>
                                    </Tooltip>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <TextField label="Nombre del Invitado" required fullWidth value={datosInvitado.nombre} onChange={(e) => setDatosInvitado({...datosInvitado, nombre: e.target.value})} sx={{ mb: 2 }} />
                                <TextField label="Email del Invitado" required type="email" fullWidth value={datosInvitado.email} onChange={(e) => setDatosInvitado({...datosInvitado, email: e.target.value})} />
                            </Box>
                        )}
                        
                        <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
                            <Typography variant="h6" gutterBottom sx={{fontSize: '1.1rem'}}>Resumen de Cotización</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Subtotal:</Typography>
                                <Typography>{formatCurrency(totals.subtotal)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>IVA (19%):</Typography>
                                <Typography>{formatCurrency(totals.iva)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5, borderTop: '1px solid #ccc' }}>
                                <Typography variant="h6" component="p">Total:</Typography>
                                <Typography variant="h6" component="p">{formatCurrency(totals.total)}</Typography>
                            </Box>
                        </Box>

                        <Button 
                            variant="contained" 
                            size="large" 
                            startIcon={<SaveIcon />} 
                            onClick={handleSaveCotizacion}
                            disabled={saving}
                            fullWidth sx={{ mt: 3, py: 1.5, fontSize: '1rem', textTransform: 'none' }}
                        >
                            {saving ? <CircularProgress size={26} color="inherit" /> : "Guardar Cotización"}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* --- MODAL PARA CREAR CLIENTE --- */}
            <Dialog open={clienteModalOpen} onClose={handleCloseClienteModal} maxWidth="md" fullWidth>
                <DialogTitle sx={{
    background: 'linear-gradient(to right, #e0f2fe, #bfdbfe)',
    color: '#1e40af',
    p: '16px 24px',
    fontWeight: 600,
    borderBottom: '1px solid #bfdbfe'
  }}>
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
                            <TextField name="direccion" label="Dirección" value={newClienteData.direccion} onChange={handleNewClienteChange} fullWidth required error={!!newClienteErrors.direccion} helperText={newClienteErrors.direccion} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={handleCloseClienteModal} startIcon={<CancelIcon />} sx={{ textTransform: 'none' }} color="inherit">Cancelar</Button>
                    <Button onClick={handleSaveNewCliente} startIcon={<SaveIcon />} sx={{ textTransform: 'none' }} color="primary" variant="contained" disabled={savingCliente}>
                        {savingCliente ? <CircularProgress size={20} color="inherit" /> : "Guardar Cliente"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}