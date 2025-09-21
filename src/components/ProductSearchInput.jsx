// src/components/ProductSearchInput.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
// ✨ 1. Importamos el hook useAuth
import { useAuth } from '../context/AuthContext'; 

const API_BASE_URL = "http://localhost:8000";

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const ProductSearchInput = ({ onProductSelect, label = "Buscar Producto", error, helperText, disabled }) => {
    // ✨ 2. Obtenemos los tokens del contexto
    const { authTokens } = useAuth();
    
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Si no hay token, no hacemos nada.
        if (!authTokens?.access) return;

        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length < 1) {
                setOptions([]);
                return;
            }
            setLoading(true);
            
            // ✨ 3. Usamos el token del contexto para la llamada a la API
            const token = authTokens.access;
            
            fetch(`${API_BASE_URL}/api/productos/?search=${searchTerm}&activo=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (!res.ok) {
                    // Manejar errores de autenticación si el token expira, etc.
                    console.error("Respuesta no válida del servidor");
                    return [];
                }
                return res.json();
            })
            .then(data => {
                setOptions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error buscando productos:", err);
                setLoading(false);
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    // ✨ 4. Añadimos authTokens a la lista de dependencias
    }, [searchTerm, authTokens]);

    return (
        <Autocomplete
            id="product-search-autocomplete"
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            loading={loading}
            disabled={disabled}
            getOptionLabel={(option) => option.nombre || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(x) => x}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={null}
            noOptionsText={searchTerm.length < 1 ? "Escribe para buscar productos..." : "No se encontraron productos"}
            onChange={(event, newValue) => {
                if (newValue) {
                    onProductSelect(newValue);
                }
            }}
            onInputChange={(event, newInputValue) => {
                setSearchTerm(newInputValue);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            getOptionDisabled={(option) => !option.activo}
            renderOption={(props, option, { selected }) => (
                <Box component="li" {...props} key={option.id}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
    {option.nombre} ({option.marca?.nombre || 'Sin Marca'})
    {!option.activo && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main' }}>(Inactivo)</Typography>}
</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Stock: {option.stock_actual} | P. Venta: {formatCurrency(option.precio_venta)}
                        </Typography>
                    </Box>
                </Box>
            )}
        />
    );
};

export default ProductSearchInput;