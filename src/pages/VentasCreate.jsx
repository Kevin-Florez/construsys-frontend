import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid, Paper, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Tooltip, Autocomplete, Box,
    CircularProgress, InputAdornment, Snackbar, Alert, FormControl, InputLabel, Select,
    MenuItem, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, 
    DialogActions, FormHelperText
} from '@mui/material';
import Divider from '@mui/material/Divider';
import {
    Delete as DeleteIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon,
    CreditCard as CreditCardIcon, Money as MoneyIcon, Add as AddIcon, Cancel as CancelIcon, Info as InfoIcon
} from "@mui/icons-material";
import { Store, Truck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductSearchInput from '../components/ProductSearchInput';
import SummaryCard from '../components/SummaryCard';
import '../styles/Ventas.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// --- CONSTANTES Y FUNCIONES PARA EL MODAL DE CLIENTES ---
const tiposDocumentoCliente = [
    { value: "CC", label: "Cédula de Ciudadanía" }, { value: "CE", label: "Cédula de Extranjería" },
    { value: "NIT", label: "NIT" }, { value: "PAS", label: "Pasaporte" },
    { value: "TI", label: "Tarjeta de Identidad" }, { value: "RC", label: "Registro Civil" },
    { value: "PEP", label: "Permiso Especial de Permanencia" }, { value: "PPT", label: "Permiso por Protección Temporal" },
];

const initialClienteState = {
    id: null, nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "CC", documento: "", direccion: "", activo: true
};

const initialClienteErrorsState = {
    nombre: "", apellido: "", correo: "", telefono: "",
    tipo_documento: "", documento: "", direccion: ""
};

const validateClienteField = (name, value) => {
    // (Lógica de validación sin cambios)
    let error = "";
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    switch (name) {
        case "nombre": case "apellido":
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
        default: break;
    }
    return error;
};

const VentasCreate = () => {
    const navigate = useNavigate();
    // ✅ 1. Obtenemos 'authTokens' en lugar de 'token'
    const { authTokens, user, logout } = useAuth();

    // ✨ 3. Verificar privilegio para crear clientes
    const canCreateCliente = user?.privileges?.includes('clientes_crear');

    // (El resto de los estados se mantienen sin cambios)
    const [cliente, setCliente] = useState(null);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const [observaciones, setObservaciones] = useState('');
    const [clientes, setClientes] = useState([]);
    const [metodoEntrega, setMetodoEntrega] = useState('tienda');
    const [direccionEntrega, setDireccionEntrega] = useState('');
    const [creditoCliente, setCreditoCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingCredito, setLoadingCredito] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [usarCredito, setUsarCredito] = useState(true);
    const [metodoPagoAdicional, setMetodoPagoAdicional] = useState('');
    const [clienteModalOpen, setClienteModalOpen] = useState(false);
    const [newClienteData, setNewClienteData] = useState(initialClienteState);
    const [newClienteErrors, setNewClienteErrors] = useState(initialClienteErrorsState);
    const [savingCliente, setSavingCliente] = useState(false);
    const [generalClienteError, setGeneralClienteError] = useState(null);

    const showNotification = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleApiError = useCallback(async (response, defaultMessage = "Ocurrió un error.") => {
        // (Lógica de manejo de errores sin cambios)
        let errorMessage = defaultMessage;
        let specificFieldErrors = {};
        try {
            const data = await response.json();
            if (data) {
                if (data.detail) { errorMessage = data.detail; } 
                else if (typeof data === 'object') {
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
        } catch (e) { /* silent */ }
        return { general: errorMessage, specific: specificFieldErrors };
    }, []);

    useEffect(() => {
        const fetchClientes = async () => {
            // ✅ 2. Definimos 'token' aquí adentro
            const token = authTokens?.access;
            if (!token) return;
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/clientes/?activo=true`, { 
                    headers: { 'Authorization': `Bearer ${token}` } // ✨ 4. Usar el token del contexto
                });
                if (res.status === 401) { logout(); return; }
                if (!res.ok) throw new Error("Error cargando clientes.");
                const data = await res.json();
                setClientes(Array.isArray(data) ? data : []);
            } catch (error) {
                showNotification(error.message, "error");
            } finally {
                setLoading(false);
            }
        };
        fetchClientes();
    // ✅ 3. El 'useEffect' ahora depende de 'authTokens'
    }, [authTokens, logout]); // ✨ 5. La dependencia es el token

    useEffect(() => {
        const fetchCredito = async () => {
            // ✅ 2. Definimos 'token' aquí adentro
            const token = authTokens?.access;
            if (!cliente || !cliente.id || !token) {
                setCreditoCliente(null);
                return;
            }
            setLoadingCredito(true);
            try {
                const response = await fetch(`${API_BASE_URL}/creditos/?cliente=${cliente.id}&estado=Activo`, { 
                    headers: { 'Authorization': `Bearer ${token}` } // ✨ 4. Usar el token del contexto
                });
                if (response.status === 401) { logout(); return; }
                if (response.ok) {
                    const data = await response.json();
                    setCreditoCliente(data.length > 0 ? data[0] : null);
                } else {
                    setCreditoCliente(null);
                }
            } catch (error) {
                setCreditoCliente(null);
            } finally {
                setLoadingCredito(false);
            }
        };
        fetchCredito();
    // ✅ 3. El 'useEffect' ahora depende de 'authTokens'
    }, [cliente, authTokens, logout]);// ✨ 5. La dependencia es el token

    // (El resto de la lógica del componente (useMemo, handleAddProduct, etc.) se mantiene igual)
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }, [items]);

    const resumenPago = useMemo(() => {
        const totalVenta = totals.total;
        let montoCubiertoConCredito = 0;
        if (usarCredito && creditoCliente && creditoCliente.saldo_disponible_para_ventas > 0) {
            montoCubiertoConCredito = Math.min(totalVenta, parseFloat(creditoCliente.saldo_disponible_para_ventas));
        }
        const pagoAdicionalRequerido = totalVenta - montoCubiertoConCredito;
        return { totalVenta, montoCubiertoConCredito, pagoAdicionalRequerido };
    }, [totals.total, creditoCliente, usarCredito]);

    const handleAddProduct = (product) => {
        if (product.stock_actual <= 0) { showNotification('Este producto no tiene stock disponible.', 'warning'); return; }
        if (items.some(item => item.id === product.id)) { showNotification('Este producto ya está en la lista.', 'warning'); return; }
        const newItem = {
            id: product.id, nombre: product.nombre, marca: product.marca, cantidad: 1,
            precio_unitario_venta: parseFloat(product.precio_venta || 0),
            subtotal: parseFloat(product.precio_venta || 0),
            stock_disponible: product.stock_actual,
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemCantidadChange = (index, nuevaCantidad) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        const cantidadNum = parseInt(nuevaCantidad, 10) || 0;
        if (cantidadNum > item.stock_disponible) {
            showNotification(`Stock máximo para ${item.nombre} es ${item.stock_disponible}`, 'warning');
            item.cantidad = item.stock_disponible;
        } else {
            item.cantidad = Math.max(1, cantidadNum);
        }
        item.subtotal = item.cantidad * item.precio_unitario_venta;
        setItems(updatedItems);
    };

    const handleRemoveItem = (indexToRemove) => setItems(prev => prev.filter((_, i) => i !== indexToRemove));

    const handleSaveNewCliente = async () => {
        const token = authTokens?.access; // ✅ Definimos token aquí
        if (!token) return;
        // Lógica de validación
        let formIsValid = true;
        // ...
        if (!formIsValid) { setGeneralClienteError("Corrija los errores."); return; }

        setSavingCliente(true);
        const payload = { ...newClienteData }; // Datos del formulario de cliente
        try {
            const response = await fetch(`${API_CLIENTES_URL}/clientes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, // ✨ 4. Usar token
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await handleApiError(response);
                setGeneralClienteError(errorData.general);
                setNewClienteErrors(prev => ({...prev, ...errorData.specific}));
                return;
            }
            const clienteCreado = await response.json();
            showNotification(`Cliente "${clienteCreado.nombre} ${clienteCreado.apellido}" creado.`);
            setClientes(prev => [...prev, clienteCreado]);
            setCliente(clienteCreado);
            handleCloseClienteModal();
        } catch (error) {
            setGeneralClienteError(error.message);
        } finally {
            setSavingCliente(false);
        }
    };

    const handleSaveVenta = async () => {
        const token = authTokens?.access; // ✅ Definimos token aquí
        if (!token) return;
        // Lógica de validación
        if (!cliente || items.length === 0 || (resumenPago.pagoAdicionalRequerido > 0.01 && !metodoPagoAdicional)) {
            showNotification("Complete todos los campos requeridos.", "error");
            return;
        }
        if (metodoEntrega === 'domicilio' && !direccionEntrega.trim()) {
            showNotification("La dirección de entrega es requerida para el método 'Domicilio'.", "error");
            return;
        }

        setSaving(true);
        const formDataPayload = new FormData();
        formDataPayload.append('cliente', cliente.id);
        formDataPayload.append('fecha', fecha);
        formDataPayload.append('observaciones', observaciones || '');
        formDataPayload.append('estado', 'Completada');
        formDataPayload.append('monto_cubierto_con_credito', resumenPago.montoCubiertoConCredito.toFixed(2));
        formDataPayload.append('monto_pago_adicional', resumenPago.pagoAdicionalRequerido.toFixed(2));
        if (usarCredito && creditoCliente?.id && resumenPago.montoCubiertoConCredito > 0) {
            formDataPayload.append('credito_usado_id', creditoCliente.id);
        }
        if (resumenPago.pagoAdicionalRequerido > 0) {
            formDataPayload.append('metodo_pago_adicional', metodoPagoAdicional);
        }

        formDataPayload.append('metodo_entrega', metodoEntrega);
        if (metodoEntrega === 'domicilio') {
            formDataPayload.append('direccion_entrega', direccionEntrega);
        }
        const itemsPayload = items.map(item => ({
            producto_id: item.id, cantidad: item.cantidad, precio_unitario_venta: item.precio_unitario_venta.toFixed(2)
        }));
        formDataPayload.append('items_json', JSON.stringify(itemsPayload));

        try {
            const response = await fetch(`${API_BASE_URL}/ventas/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // ✨ 4. Usar token
                body: formDataPayload
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al guardar la venta");
            }
            const responseData = await response.json();
            showNotification(`Venta #${responseData.id} registrada exitosamente.`);
            navigate('/ventas');
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setSaving(false);
        }
    };
    
    // (El resto de handlers y renderizado se mantienen, pero usando `canCreateCliente`)
    const handleOpenClienteModal = () => { setNewClienteData(initialClienteState); setNewClienteErrors(initialClienteErrorsState); setGeneralClienteError(null); setClienteModalOpen(true); };
    const handleCloseClienteModal = () => setClienteModalOpen(false);
    const handleNewClienteChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (["nombre", "apellido"].includes(name)) processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        else if (["documento", "telefono"].includes(name)) processedValue = value.replace(/[^0-9]/g, "");
        setNewClienteData(prev => ({ ...prev, [name]: processedValue }));
        const error = validateClienteField(name, processedValue);
        setNewClienteErrors(prev => ({ ...prev, [name]: error }));
        if(generalClienteError) setGeneralClienteError(null);
    };
    const today = new Date().toISOString().split("T")[0];
    if (loading) return <div className="loading-indicator"><CircularProgress /> Cargando...</div>;

    return (
        <div className="ventas-container">
            <div className="ventas-title-header">
                <h1>Registrar Nueva Venta</h1>
                <Button variant="outlined" sx={{ textTransform: "none"}} startIcon={<ArrowBackIcon />} onClick={() => navigate('/ventas')}>
                    Volver a la Lista
                </Button>
            </div>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
                        <ProductSearchInput onProductSelect={handleAddProduct} label="Buscar y agregar producto a la venta" />
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mt: 3 }} className='mayus'>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: "#e8eaf6" }}>
                                    <TableRow>
                                        <TableCell align="center">Producto</TableCell>
                                        <TableCell align="center">Cantidad</TableCell>
                                        <TableCell align="center">Precio Unit.</TableCell>
                                        <TableCell align="center">Subtotal</TableCell>
                                        <TableCell align="center">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Añada productos a la venta</TableCell></TableRow>
                                    ) : (
                                        items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell align="center">{item.nombre} <Typography variant="caption" color="textSecondary">({item.marca?.nombre || 'Sin marca'})</Typography></TableCell>
                                                <TableCell align="center">
                                                    <TextField type="number" value={item.cantidad}
                                                        onChange={(e) => handleItemCantidadChange(index, e.target.value)}
                                                        size="small" sx={{ width: '90px' }}
                                                        inputProps={{ min: 1, max: item.stock_disponible }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">{formatCurrency(item.precio_unitario_venta)}</TableCell>
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
                    <SummaryCard title="Resumen y Pago" subtotal={totals.subtotal} iva={totals.iva} total={totals.total}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Autocomplete
                                sx={{ flexGrow: 1 }}
                                options={clientes}
                                getOptionDisabled={(option) => !option.activo}
                                getOptionLabel={(option) => 
  option ? `${option.nombre} ${option.apellido} (${option.tipo_documento}: ${option.documento}) ${!option.activo ? '(Inactivo)' : ''}` : ''
}

                                value={cliente}
                                onChange={(e, newValue) => setCliente(newValue)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => <TextField {...params} label="Cliente" required />}
                            />
                            {/* ✨ 6. Botón de agregar cliente condicionado por privilegio */}
                            {canCreateCliente && (
                                <Tooltip title="Crear Nuevo Cliente">
                                    <Button onClick={handleOpenClienteModal} variant="contained" color="primary" sx={{ height: '56px', minWidth: 'auto', px: 2 }}>
                                        <AddIcon />
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>

                        <Grid sx={{ mt: 2 }}>
                            <TextField 
                                label="Fecha de Venta" 
                                type="date" 
                                value={fecha} 
                                onChange={(e) => setFecha(e.target.value)} 
                                fullWidth 
                                InputLabelProps={{ shrink: true }} 
                                required 
                                inputProps={{ min: today, max: today }} 
                            />
                        </Grid>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{fontSize: '1rem', fontWeight: 'bold'}}>Método de Entrega</Typography>
                            <FormControl fullWidth>
                                <Select value={metodoEntrega} onChange={(e) => setMetodoEntrega(e.target.value)}>
                                    <MenuItem value="tienda"><Store sx={{mr:1}}/> Reclama en Tienda</MenuItem>
                                    <MenuItem value="domicilio"><Truck sx={{mr:1}}/> Domicilio</MenuItem>
                                </Select>
                            </FormControl>
                            {metodoEntrega === 'domicilio' && (
                                <TextField
                                    label="Dirección de Entrega"
                                    fullWidth
                                    required
                                    sx={{ mt: 2 }}
                                    value={direccionEntrega}
                                    onChange={(e) => setDireccionEntrega(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><MapPin /></InputAdornment> }}
                                />
                            )}
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ p: 2, mt: 2, border: '1px dashed #ccc', borderRadius: 2, backgroundColor: '#fafafa' }}>
                            <Typography variant="h6" gutterBottom sx={{fontSize: '1rem', fontWeight: 'bold'}}>Método de Pago</Typography>
                            {loadingCredito ? <CircularProgress size={24} /> : (
                                creditoCliente ? (
                                    <>
                                        <FormControlLabel control={<Switch checked={usarCredito} onChange={(e) => setUsarCredito(e.target.checked)} disabled={!(creditoCliente.saldo_disponible_para_ventas > 0)} />} label="Usar Crédito Disponible" />
                                        <Typography variant="body2" color="text.secondary">Saldo disponible: {formatCurrency(creditoCliente.saldo_disponible_para_ventas || 0)}</Typography>
                                    </>
                                ) : (
                                    cliente && <Typography variant="body2" color="textSecondary">El cliente seleccionado no tiene crédito activo.</Typography>
                                )
                            )}
                            
                            <TextField label="Monto cubierto con Crédito" value={formatCurrency(resumenPago.montoCubiertoConCredito)} fullWidth disabled variant="filled" sx={{ my: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardIcon fontSize="small"/></InputAdornment> }} />
                            <TextField label="Pago Requerido" value={formatCurrency(resumenPago.pagoAdicionalRequerido)} fullWidth disabled variant="filled" InputProps={{ startAdornment: <InputAdornment position="start"><MoneyIcon fontSize="small"/></InputAdornment> }} />
                            
                            {resumenPago.pagoAdicionalRequerido > 0.01 && (
                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Método de Pago</InputLabel>
                                    <Select value={metodoPagoAdicional} onChange={(e) => setMetodoPagoAdicional(e.target.value)} label="Método Pago Adicional">
                                        <MenuItem value="Efectivo">Efectivo</MenuItem>
                                        <MenuItem value="Transferencia">Transferencia</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                        
                        <TextField label="Observaciones (Opcional)" multiline rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} fullWidth sx={{ mt: 2 }}/>
                        
                        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSaveVenta}
                            disabled={saving || !cliente || items.length === 0}
                            fullWidth sx={{ mt: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold', textTransform: "none" }}>
                            {saving ? <CircularProgress size={26} color="inherit" /> : "Finalizar Venta"}
                        </Button>
                    </SummaryCard>
                </Grid>
            </Grid>

            {/* --- MODAL PARA CREAR CLIENTE --- */}
            <Dialog open={clienteModalOpen} onClose={handleCloseClienteModal} maxWidth="md" fullWidth>
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
Agregar Nuevo Cliente</DialogTitle>
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

export default VentasCreate;