// src/pages/PedidosCliente.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, InputAdornment, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Chip, IconButton, CircularProgress, Alert, Tooltip
} from "@mui/material";
import { Search as SearchIcon, Visibility as VisibilityIcon, Clear as ClearIcon, Store, LocalShipping, ShoppingCart } from "@mui/icons-material";
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatFecha } from '../utils/formatters';
import PedidoDetalleModal from '../components/PedidoDetalleModal'; // ✨ Reincorporamos el modal
import '../styles/PedidosCliente.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const getStatusChipColor = (estado) => {
    const statusMap = {
        'entregado': 'success',
        'en_camino': 'info',
        'confirmado': 'primary',
        'cancelado': 'error',
        'cancelado_por_inactividad': 'error',
        'pago_incompleto': 'secondary',
        'en_verificacion': 'warning',
        'pendiente_pago_temporal': 'warning',
        'pendiente_pago': 'warning',
    };
    return statusMap[estado?.toLowerCase()] || 'default';
};

export default function PedidosCliente() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { authTokens, logout } = useAuth();
    
    // ✨ Reincorporamos el estado y la función para el modal
    const [selectedPedido, setSelectedPedido] = useState(null);
    const handleOpenModal = (pedido) => {
        const pedidoActualizado = pedidos.find(p => p.id === pedido.id);
        setSelectedPedido(pedidoActualizado);
    };
    // ✨ Fin

    const fetchPedidos = useCallback(async () => {
        const token = authTokens?.access;
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/pedidos/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) {
                toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
                logout();
                return;
            }
            if (!response.ok) {
                throw new Error("No se pudieron cargar tus pedidos.");
            }
            const data = await response.json();
            setPedidos(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const filteredPedidos = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    return pedidos.filter(p => {
        const campos = [
            p.id?.toString() || "",
            formatFecha(p.fecha_creacion) || "",
            p.metodo_entrega || "",
            formatCurrency(p.total) || "",
            p.estado?.replace(/_/g, ' ') || ""
        ];

        return campos.some(campo =>
            campo.toString().toLowerCase().includes(lowerSearch)
        );
    });
}, [searchTerm, pedidos]);


    const paginatedPedidos = useMemo(() => {
        return filteredPedidos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, filteredPedidos]);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");

    if (loading) {
        return <div className="loading-indicator"><CircularProgress /> Cargando tus pedidos...</div>;
    }

    if (error) {
        return <div className="pedidos-container"><Alert severity="error">{error}</Alert></div>;
    }

    return (
        <div className="pedidos-container">
            <div className="pedidos-title-header">
                <h1><ShoppingCart sx={{ fontSize: '2rem' }}/> Gestionar Mis Pedidos</h1>
            </div>
            {/* ✨ Cambiamos justifyContent a 'flex-start' para alinear a la izquierda */}
            <Box className="pedidos-toolbar" sx={{ justifyContent: 'flex-start' }}>
                <TextField
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    className="search-input"
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon className="search-icon" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={handleClearSearch}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px' }}
                />
            </Box>

            <TableContainer component={Paper} className="pedidos-table-container" elevation={0} variant="outlined">
                <Table stickyHeader className="pedidos-table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Pedido</TableCell>
                            <TableCell align="center">Fecha</TableCell>
                            <TableCell align="center">Método de Entrega</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedPedidos.length > 0 ? (
                            paginatedPedidos.map((pedido) => (
                                <TableRow key={pedido.id} hover>
                                    <TableCell align="center">
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                                            #{pedido.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{formatFecha(pedido.fecha_creacion)}</TableCell>
                                    {/* ✨ Reincorporamos el icono de entrega */}
                                    <TableCell align="center">
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, textTransform: 'capitalize' }}>
                                            {pedido.metodo_entrega === 'domicilio' ? <LocalShipping fontSize="small" color="action" /> : <Store fontSize="small" color="action" />}
                                            <Typography variant="body2">{pedido.metodo_entrega}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{formatCurrency(pedido.total)}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={pedido.estado.replace(/_/g, ' ')}
                                            color={getStatusChipColor(pedido.estado)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <div className="action-buttons">
                                            <Tooltip title="Ver Detalle" arrow>
                                                {/* ✨ El botón ahora abre el modal */}
                                                <IconButton
                                                    onClick={() => handleOpenModal(pedido)}
                                                    color="info"
                                                    size="small"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" className="no-data-cell">
                                    {pedidos.length > 0 ? "No se encontraron pedidos con los filtros actuales." : "No has realizado ningún pedido todavía."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredPedidos.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                />
            </TableContainer>

            {/* ✨ Reincorporamos el componente del Modal */}
            <PedidoDetalleModal
                open={!!selectedPedido}
                onClose={() => setSelectedPedido(null)}
                pedido={selectedPedido}
                onUpdate={fetchPedidos}
            />
        </div>
    );
}