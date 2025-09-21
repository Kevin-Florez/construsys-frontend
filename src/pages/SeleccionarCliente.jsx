// src/pages/SeleccionarCliente.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, IconButton, Grid,
    InputAdornment, CircularProgress, Alert, TablePagination, Box
} from "@mui/material";
import {
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext"; // ✨ 1. Importar el hook de autenticación

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const SeleccionarCliente = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, logout } = useAuth(); // ✨ 2. Obtener token y logout del contexto

    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState("");
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [ventaEnProgreso, setVentaEnProgreso] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // ✨ 3. Reemplazar carga de localStorage con una llamada a la API
    const fetchClientes = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/?estado=Activo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                logout();
                return;
            }
            if (!response.ok) throw new Error("No se pudo cargar la lista de clientes.");
            
            const data = await response.json();
            const clientesActivos = Array.isArray(data) ? data : (data.results || []);
            setClientes(clientesActivos);
            setClientesFiltrados(clientesActivos);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchClientes();
        if (location.state && location.state.ventaEnProgreso) {
            setVentaEnProgreso(location.state.ventaEnProgreso);
        }
    }, [fetchClientes, location.state]);

    useEffect(() => {
        const filtroLowerCase = filtro.toLowerCase();
        const resultado = clientes.filter(cliente =>
            cliente.nombre_completo?.toLowerCase().includes(filtroLowerCase) ||
            cliente.documento?.includes(filtro)
        );
        setClientesFiltrados(resultado);
        setPage(0); // Resetear a la primera página con cada búsqueda
    }, [filtro, clientes]);

    const seleccionarCliente = (cliente) => {
        navigate('/ventas/nueva', {
            state: {
                clienteSeleccionado: cliente, // Enviar el objeto completo
                ventaEnProgreso: ventaEnProgreso
            }
        });
    };

    const volverAVentas = () => {
        navigate('/ventas/nueva', { state: { ventaEnProgreso } });
    };

    return (
        <div style={{ padding: "24px", maxWidth: '1200px', margin: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">Seleccionar Cliente</Typography>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={volverAVentas}>
                    Volver a la Venta
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
                <TextField
                    fullWidth variant="outlined" label="Buscar por nombre o documento..."
                    value={filtro} onChange={(e) => setFiltro(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                    }}
                />
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Paper elevation={0} variant="outlined" sx={{ overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre Completo</TableCell>
                                    <TableCell>Documento</TableCell>
                                    <TableCell>Teléfono</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell align="center">Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {clientesFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((cliente) => (
                                    <TableRow key={cliente.id} hover>
                                        <TableCell sx={{ fontWeight: '500' }}>{cliente.nombre_completo}</TableCell>
                                        <TableCell>{`${cliente.tipo_documento}: ${cliente.documento}`}</TableCell>
                                        <TableCell>{cliente.telefono}</TableCell>
                                        <TableCell>{cliente.correo}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="contained" size="small"
                                                color="primary"
                                                startIcon={<CheckCircleIcon />}
                                                onClick={() => seleccionarCliente(cliente)}
                                                sx={{textTransform: 'none'}}
                                            >
                                                Seleccionar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clientesFiltrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No se encontraron clientes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={clientesFiltrados.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        labelRowsPerPage="Filas por página:"
                    />
                </Paper>
            )}
        </div>
    );
};

export default SeleccionarCliente;