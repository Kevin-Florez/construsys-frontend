// src/pages/AdminPedidos.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Paper, InputAdornment, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Chip, IconButton, CircularProgress, Alert, Tooltip
} from "@mui/material";
import { 
    Search as SearchIcon, Visibility, LocalShipping, Store, Clear as ClearIcon, 
    CreditCard, ReceiptLong 
} from "@mui/icons-material";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

// Se importa el componente del modal desde su propio archivo
import PedidoDetailModal from "../components/PedidoDetailModal"; // Asegúrate que la ruta sea correcta
import '../styles/AdminPedidos.css'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// --- Funciones de formato usadas por esta tabla ---

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const getStatusChipColor = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'entregado': return 'success';
        case 'en_camino': return 'info';
        case 'confirmado': return 'primary';
        case 'cancelado': return 'error';
        case 'cancelado_por_inactividad': return 'error';
        case 'pago_incompleto': return 'secondary';
        case 'en_verificacion': 
        case 'pendiente_pago_temporal':
        case 'pendiente_pago':
        default: return 'warning';
    }
};

const getStatusDisplayText = (estado) => {
    switch(estado) {
        case 'pendiente_pago_temporal': return 'Pendiente de Pago (1h)';
        case 'cancelado_por_inactividad': return 'Cancelado por Inactividad';
        case 'pendiente_pago': return 'Pendiente de Pago';
        case 'en_verificacion': return 'En Verificación de Pago';
        case 'pago_incompleto': return 'Pago Incompleto';
        case 'confirmado': return 'Confirmado y en Preparación';
        case 'en_camino': return 'En Camino';
        case 'entregado': return 'Entregado';
        case 'cancelado': return 'Cancelado';
        default: return 'Desconocido';
    }
};

export default function AdminPedidos() {
    const { authTokens, userPrivileges } = useAuth();
    const navigate = useNavigate();
    
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formatNumeroPedido = (id) => `PED-${String(id).padStart(6, "0")}`;
    const formatFechaCorta = (fechaISO) => new Date(fechaISO).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = authTokens?.access;
        if (!token) {
            toast.error("Sesión no válida. Por favor, inicia sesión.");
            navigate('/login');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/pedidos/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudieron cargar los pedidos.");
            }
            const data = await response.json();
            setPedidos(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, authTokens]);

    useEffect(() => {
        if (authTokens) {
            fetchPedidos();
        }
    }, [fetchPedidos, authTokens]);

    const handleOpenModal = (pedido) => {
        console.log("Pedido seleccionado para el modal:", pedido);
        setSelectedPedido(pedido);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedPedido(null);
        setIsModalOpen(false);
    };

// Función auxiliar para quitar acentos y pasar todo a minúscula
const normalizeText = (text) => {
    return (text || "")
        .toString()
        .normalize("NFD")        // separa letras y acentos
        .replace(/[\u0300-\u036f]/g, "") // elimina los acentos
        .toLowerCase();
};

const filteredPedidos = pedidos.filter(p => {
    const numeroPedido = formatNumeroPedido(p.id);
    const fechaRaw = p.fecha_creacion || "";
    const fechaFormatted = formatFechaCorta(p.fecha_creacion);
    const clienteInfo = p.cliente
        ? `${p.cliente.nombre} ${p.cliente.correo}`
        : `${p.nombre_receptor || ""} ${p.email_invitado || ""}`;
    const metodoEntrega = p.metodo_entrega || "";
    const totalRaw = p.total?.toString() || "";
    const totalFormatted = formatCurrency(p.total);
    const estadoTexto = getStatusDisplayText(p.estado);

    const rowData = `
        ${numeroPedido}
        ${fechaRaw} ${fechaFormatted}
        ${clienteInfo}
        ${metodoEntrega}
        ${totalRaw} ${totalFormatted}
        ${estadoTexto}
    `;

    return normalizeText(rowData).includes(normalizeText(searchTerm));
});


    
    return (
        <div className="pedidos-container">
            <div className="pedidos-title-header">
                <h1>Gestión de Pedidos</h1>
            </div>

            <Box className="pedidos-toolbar">
                <TextField
                    placeholder="Buscar..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>,
                        endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>
                    }}
                    sx={{ maxWidth: '500px', backgroundColor: 'white', borderRadius: '8px' }}
                />
            </Box>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            ) : (
                <>
                    <TableContainer component={Paper} className="pedidos-table">
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">N° Pedido</TableCell>
                                    <TableCell align="center">Fecha</TableCell>
                                    <TableCell align="center">Cliente</TableCell>
                                    <TableCell align="center">Entrega</TableCell>
                                    <TableCell align="center">Total</TableCell>
                                    
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPedidos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pedido) => (
                                    <TableRow 
                                        key={pedido.id} 
                                        hover 
                                        className={['cancelado', 'entregado', 'cancelado_por_inactividad'].includes(pedido.estado) ? 'fila-finalizada' : ''}
                                    >
                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{formatNumeroPedido(pedido.id)}</TableCell>
                                        <TableCell align="center">{formatFechaCorta(pedido.fecha_creacion)}</TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }} align="center">
                                                    {pedido.cliente ? pedido.cliente.nombre : pedido.nombre_receptor}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                                                    {pedido.cliente ? pedido.cliente.correo : `Invitado: ${pedido.email_invitado}`}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={pedido.metodo_entrega === 'domicilio' ? 'A Domicilio' : 'Reclama en Tienda'}>
                                                <Chip
                                                    icon={pedido.metodo_entrega === 'domicilio' ? <LocalShipping /> : <Store />}
                                                    label={pedido.metodo_entrega}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{textTransform: 'capitalize'}}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>{formatCurrency(pedido.total)}</TableCell>
                                        
                                        <TableCell align="center">
                                            <Chip label={getStatusDisplayText(pedido.estado)} color={getStatusChipColor(pedido.estado)} size="small" sx={{textTransform: 'capitalize', fontWeight: 500}} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver / Gestionar Pedido">
                                                <IconButton 
                                                    onClick={() => handleOpenModal(pedido)} 
                                                    color="primary" 
                                                    size="small"
                                                    disabled={!userPrivileges.includes('pedidos_ver')}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPedidos.length === 0 && (
                                    <TableRow><TableCell colSpan={8} align="center">No se encontraron pedidos que coincidan con la búsqueda.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]} component="div"
                        count={filteredPedidos.length} rowsPerPage={rowsPerPage} page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage="Filas por página:"
                        className="table-pagination"
                    />
                </>
            )}
            
            {selectedPedido && (
                <PedidoDetailModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    pedido={selectedPedido}
                    onUpdate={fetchPedidos}
                />
            )}
        </div>
    );
}