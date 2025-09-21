// src/components/AbonoModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, CircularProgress, Box, FormControl, InputLabel, Select, MenuItem, FormHelperText, Typography, IconButton } from '@mui/material';
import { AttachFile, Clear, Info as InfoIcon } from '@mui/icons-material';

const AbonoModal = ({ open, onClose, onSave, deudaTotal, creditoId, actionLoading, apiError }) => {
    const initialState = {
        monto: '',
        fecha_abono: new Date().toISOString().split('T')[0],
        metodo_pago: 'Transferencia',
        comprobante: null,
        comprobanteName: ''
    };
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setForm(initialState);
            setErrors({});
            if (apiError) {
                setErrors({ api: apiError });
            }
        }
    }, [open, apiError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setErrors(prev => ({ ...prev, comprobante: "El archivo es muy grande (máx. 5MB)." }));
                return;
            }
            setForm(prev => ({ ...prev, comprobante: file, comprobanteName: file.name }));
            if (errors.comprobante) setErrors(prev => ({ ...prev, comprobante: null }));
        }
    };

    const handleClearFile = () => {
        setForm(prev => ({ ...prev, comprobante: null, comprobanteName: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const validate = () => {
        const newErrors = {};
        const montoNum = parseFloat(form.monto);

        if (!form.monto || isNaN(montoNum) || montoNum <= 0) {
            newErrors.monto = 'El monto debe ser un número positivo.';
        } else if (montoNum > deudaTotal) {
            newErrors.monto = `El monto no puede superar la deuda total de ${deudaTotal.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}.`;
        }

        if (!form.fecha_abono) newErrors.fecha_abono = 'La fecha es requerida.';
        if (!form.metodo_pago) newErrors.metodo_pago = 'El método de pago es requerido.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInternalSave = () => {
        if (validate()) {
            onSave({
                monto: form.monto,
                fecha_abono: form.fecha_abono,
                metodo_pago: form.metodo_pago,
                comprobante: form.comprobante
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
            Realizar Abono a Crédito #{creditoId}</DialogTitle>
            <DialogContent dividers>
                {errors.api && <Alert severity="error" sx={{ mb: 2 }}>{errors.api}</Alert>}
                <Typography>Deuda Total Actual: <strong>${deudaTotal.toLocaleString('es-CO')}</strong></Typography>
                <TextField autoFocus margin="normal" label="Monto del Abono" type="number" name="monto" fullWidth variant="outlined" value={form.monto} onChange={handleChange} error={!!errors.monto} helperText={errors.monto} required />
                <TextField margin="normal" label="Fecha del Abono" type="date" name="fecha_abono" fullWidth value={form.fecha_abono} onChange={handleChange} InputLabelProps={{ shrink: true }} error={!!errors.fecha_abono} helperText={errors.fecha_abono} required />
                <FormControl fullWidth margin="normal" required error={!!errors.metodo_pago}>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} label="Método de Pago">
                        <MenuItem value="Efectivo">Efectivo</MenuItem>
                        <MenuItem value="Transferencia">Transferencia</MenuItem>
                        
                    </Select>
                    {errors.metodo_pago && <FormHelperText>{errors.metodo_pago}</FormHelperText>}
                </FormControl>
                <FormControl fullWidth margin="normal" error={!!errors.comprobante}>
                    <InputLabel shrink sx={{position: 'relative', transform: 'none', mb:0.5}}>Comprobante (Opcional)</InputLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px', padding: '8px 14px' }}>
                        <Button component="label" startIcon={<AttachFile />} size="small" sx={{ textTransform: "none"}}>Seleccionar <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} /></Button>
                        {form.comprobanteName && (
                            <>
                                <Typography variant="body2" sx={{ ml: 1, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.comprobanteName}</Typography>
                                <IconButton onClick={handleClearFile} size="small"><Clear fontSize="small" /></IconButton>
                            </>
                        )}
                    </Box>
                    {errors.comprobante && <FormHelperText>{errors.comprobante}</FormHelperText>}
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: "none"}} disabled={actionLoading}>Cancelar</Button>
                <Button onClick={handleInternalSave} variant="contained" sx={{ textTransform: "none"}} disabled={actionLoading}>
                    {actionLoading ? <CircularProgress size={24} /> : 'Guardar Abono'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AbonoModal;