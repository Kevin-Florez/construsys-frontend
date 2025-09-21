// PaymentModal.jsx
import React, { useState, useEffect, useRef } from "react"; // Añadido useRef
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    Typography,
    Box,
    InputAdornment,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText, 
    IconButton // Añadido
} from "@mui/material";
import { AttachFile, Clear } from '@mui/icons-material'; // Añadidos iconos

// Función auxiliar para formatear moneda (Definición por defecto)
const formatCurrencyDefault = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const PaymentModal = ({
    open,
    onClose,
    onSave, // Esta función recibirá { fecha_pago, monto, metodo_pago, referencia_pago (archivo o null) }
    creditoInfo, 
    actionLoading,
    formatCurrency = formatCurrencyDefault,
    isLiquidation, 
    montoALiquidar, 
}) => {
    const initialPaymentState = {
        fecha_pago: new Date().toISOString().split("T")[0],
        monto: montoALiquidar ? String(parseFloat(montoALiquidar).toFixed(2)) : "0.00",
        metodo_pago: 'Transferencia', 
        referencia_pago: null, // Para el archivo
        referencia_pago_name: '' // Para mostrar el nombre del archivo
    };
    const [paymentForm, setPaymentForm] = useState(initialPaymentState);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null); // Para el input de archivo

    useEffect(() => {
        if (open) {
            setPaymentForm({
                fecha_pago: new Date().toISOString().split("T")[0],
                monto: montoALiquidar ? String(parseFloat(montoALiquidar).toFixed(2)) : "0.00",
                metodo_pago: 'Transferencia',
                referencia_pago: null,
                referencia_pago_name: ''
            });
            setErrors({});
            if (fileInputRef.current) { // Limpiar el input de archivo si existe
                fileInputRef.current.value = "";
            }
        }
    }, [open, montoALiquidar]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validación opcional de tipo de archivo y tamaño
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']; // PDF añadido como ejemplo
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, referencia_pago: "Tipo de archivo no permitido. Adjunte imágenes (JPG, PNG, GIF) o PDF." }));
                setPaymentForm(prev => ({ ...prev, referencia_pago: null, referencia_pago_name: '' }));
                e.target.value = null; // Limpiar el input
                return;
            }
            if (file.size > maxSize) {
                setErrors(prev => ({ ...prev, referencia_pago: "El archivo es demasiado grande (máx. 5MB)." }));
                setPaymentForm(prev => ({ ...prev, referencia_pago: null, referencia_pago_name: '' }));
                e.target.value = null; // Limpiar el input
                return;
            }

            setPaymentForm(prev => ({ ...prev, referencia_pago: file, referencia_pago_name: file.name }));
            if (errors.referencia_pago) setErrors(prev => ({ ...prev, referencia_pago: null }));
        } else {
            setPaymentForm(prev => ({ ...prev, referencia_pago: null, referencia_pago_name: '' }));
        }
    };
    
    const handleClearFile = () => {
        setPaymentForm(prev => ({ ...prev, referencia_pago: null, referencia_pago_name: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Limpiar el valor del input de archivo
        }
        if (errors.referencia_pago) setErrors(prev => ({ ...prev, referencia_pago: null }));
    };


    const validate = () => {
        let tempErrors = {};
        if (!paymentForm.fecha_pago) tempErrors.fecha_pago = "Fecha de liquidación es requerida.";
        if (!paymentForm.metodo_pago) tempErrors.metodo_pago = "Método de pago es requerido.";
        // El campo de archivo (referencia_pago) es opcional, pero si hay un error previo, se mantiene.
        if (errors.referencia_pago) tempErrors.referencia_pago = errors.referencia_pago;
        
        setErrors(tempErrors); // Actualiza los errores con los nuevos, manteniendo los existentes si no se revalidan aquí
        return Object.keys(tempErrors).filter(key => tempErrors[key] !== null).length === 0; // Solo cuenta errores activos
    };

    const handleInternalSave = () => {
        if (validate()) {
            onSave({ // El payload para el backend
                fecha_pago: paymentForm.fecha_pago,
                monto: paymentForm.monto, 
                metodo_pago: paymentForm.metodo_pago,
                referencia_pago: paymentForm.referencia_pago, // Aquí se pasa el objeto File o null
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {isLiquidation ? `Liquidar Línea de Crédito #${creditoInfo?.id}` : `Registrar Pago para Crédito #${creditoInfo?.id}`}
            </DialogTitle>
            <DialogContent dividers>
                {errors.api && <Alert severity="error" sx={{ mb: 2 }}>{errors.api}</Alert>} 

                {creditoInfo && (
                    <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="subtitle1">
                            Cliente: <strong>{creditoInfo.cliente_nombre_completo || creditoInfo.cliente_nombre}</strong> {/* Ajustado para usar cliente_nombre_completo si está disponible */}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Monto Otorgado Original: <strong>{formatCurrency(creditoInfo.monto_otorgado)}</strong>
                        </Typography>
                        {isLiquidation && (
                             <Typography variant="h6" color="primary" sx={{mt: 1}}>
                                Monto a Liquidar: <strong>{formatCurrency(montoALiquidar)}</strong>
                            </Typography>
                        )}
                        <Typography variant="caption" display="block" color="textSecondary">
                            ID Crédito: {creditoInfo.id}
                        </Typography>
                    </Box>
                )}

                <TextField
                    fullWidth
                    label="Monto de Liquidación"
                    type="number"
                    name="monto" 
                    value={paymentForm.monto} 
                    margin="normal"
                    InputProps={{
                        readOnly: true, 
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    variant="filled" 
                />

                <TextField
                    fullWidth
                    label="Fecha de Liquidación" type="date" name="fecha_pago"
                    value={paymentForm.fecha_pago} onChange={handleChange}
                    InputLabelProps={{ shrink: true }} margin="normal"
                    error={!!errors.fecha_pago} helperText={errors.fecha_pago} required
                    autoFocus
                />

                <FormControl fullWidth margin="normal" required error={!!errors.metodo_pago}>
                    <InputLabel id="metodo-pago-liquidacion-label">Método de Pago</InputLabel>
                    <Select
                        labelId="metodo-pago-liquidacion-label"
                        name="metodo_pago"
                        value={paymentForm.metodo_pago}
                        onChange={handleChange}
                        label="Método de Pago *"
                    >
                        <MenuItem value="Efectivo">Efectivo</MenuItem>
                        <MenuItem value="Transferencia">Transferencia</MenuItem>
                        <MenuItem value="Consignacion">Consignación Bancaria</MenuItem>
                        <MenuItem value="Otro">Otro</MenuItem>
                    </Select>
                    {errors.metodo_pago && <FormHelperText>{errors.metodo_pago}</FormHelperText>}
                </FormControl>

                {/* CAMBIO: Input para archivo de imagen */}
                <FormControl fullWidth margin="normal" error={!!errors.referencia_pago}>
                    <InputLabel shrink htmlFor="referencia-pago-file" sx={{position: 'relative', transform: 'none', mb:0.5}}>
                        Comprobante de Pago (Opcional)
                    </InputLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '8px 14px' }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFile />}
                            size="small"
                            sx={{ textTransform: 'none', mr: 1 }}
                        >
                            Seleccionar archivo
                            <input
                                id="referencia-pago-file"
                                type="file"
                                name="referencia_pago"
                                hidden
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/gif,application/pdf"
                            />
                        </Button>
                        {paymentForm.referencia_pago_name && (
                            <>
                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                                    {paymentForm.referencia_pago_name}
                                </Typography>
                                <IconButton onClick={handleClearFile} size="small" edge="end">
                                    <Clear fontSize="small" />
                                </IconButton>
                            </>
                        )}
                        {!paymentForm.referencia_pago_name && (
                             <Typography variant="body2" color="textSecondary">Ningún archivo seleccionado.</Typography>
                        )}
                    </Box>
                    {errors.referencia_pago && <FormHelperText>{errors.referencia_pago}</FormHelperText>}
                </FormControl>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }} variant="outlined" disabled={actionLoading}>Cancelar</Button>
                <Button
                    onClick={handleInternalSave}
                    variant="contained"
                    color="primary"
                    disabled={actionLoading || !!errors.referencia_pago} // Deshabilitar si hay error de archivo
                    sx={{ textTransform: 'none' }}
                >
                    {actionLoading ? <CircularProgress size={24}  color="inherit" /> : "Registrar Liquidación"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentModal;