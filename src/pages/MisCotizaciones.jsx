// src/pages/MisCotizaciones.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatFecha } from '../utils/formatters';
import {
    Box, Typography, Paper, InputAdornment, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Tooltip, IconButton, CircularProgress, Alert, Button
} from "@mui/material";
import { Description, Visibility as VisibilityIcon, Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import '../styles/MisCotizaciones.css';
import CotizacionDetalleModal from '../components/CotizacionDetalleModal'; // ✨ IMPORTA EL MODAL

const API_BASE_URL = import.meta.env.VITE_API_URL;

const StatusBadge = ({ status }) => {
    const statusInfo = {
        vigente: { text: 'Vigente', className: 'status-vigente' },
        convertida: { text: 'Pedido', className: 'status-convertida' },
        vencida: { text: 'Vencida', className: 'status-vencida' },
    };
    const info = statusInfo[status] || { text: status, className: 'status-default' };
    return <Typography component="span" className={`estado-label ${info.className}`}>{info.text}</Typography>;
};

export default function MisCotizaciones() {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authTokens } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);
    
    // ✨ Estado para controlar el modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCotizacionToken, setSelectedCotizacionToken] = useState(null);

    const fetchCotizaciones = useCallback(async () => {
        if (!authTokens) {
            setError("No estás autenticado.");
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/mis-cotizaciones/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` },
            });
            if (!response.ok) {
                throw new Error('No se pudieron cargar tus cotizaciones.');
            }
            const data = await response.json();
            const updatedData = data.map(c => 
                (c.is_expired && c.estado === 'vigente') ? { ...c, estado: 'vencida' } : c
            );
            setCotizaciones(updatedData);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => {
        fetchCotizaciones();
    }, [fetchCotizaciones]);

    const filteredCotizaciones = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    return cotizaciones.filter(c => {
        const campos = [
            c.id?.toString() || "",
            formatFecha(c.fecha_creacion) || "",
            formatFecha(c.fecha_vencimiento) || "",
            formatCurrency(c.total) || "",
            c.estado?.replace(/_/g, ' ') || ""
        ];

        return campos.some(campo =>
            campo.toString().toLowerCase().includes(lowerSearch)
        );
    });
}, [searchTerm, cotizaciones]);


    const paginatedCotizaciones = useMemo(() => {
        return filteredCotizaciones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, filteredCotizaciones]);
    
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");
    
    // ✨ Nueva función para abrir el modal
    const handleOpenModal = (token) => {
        setSelectedCotizacionToken(token);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCotizacionToken(null);
    };

    if (loading) {
        return <div className="loading-indicator"><CircularProgress /><span>Cargando tus cotizaciones...</span></div>;
    }

    if (error) {
        return <div className="cotizaciones-container"><Alert severity="error">{error}</Alert></div>;
    }

    return (
        <div className="cotizaciones-container">
            <div className="cotizaciones-title-header">
                <h1><Description sx={{ fontSize: '2rem' }} />Gestionar Mis Cotizaciones</h1>
            </div>
            <Box className="cotizaciones-toolbar" sx={{ justifyContent: 'flex-start' }}>
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

            {cotizaciones.length > 0 ? (
                <TableContainer component={Paper} className="cotizaciones-table-container" elevation={0} variant="outlined">
                    <Table stickyHeader className="cotizaciones-table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">N° Cotización</TableCell>
                                <TableCell align="center">Fecha Creación</TableCell>
                                <TableCell align="center">Fecha Vencimiento</TableCell>
                                <TableCell align="center">Total</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedCotizaciones.map(cotizacion => (
                                <TableRow key={cotizacion.id} hover>
                                    <TableCell align="center">
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                                            #{cotizacion.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{formatFecha(cotizacion.fecha_creacion)}</TableCell>
                                    <TableCell align="center">{formatFecha(cotizacion.fecha_vencimiento)}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{formatCurrency(cotizacion.total)}</TableCell>
                                    <TableCell align="center"><StatusBadge status={cotizacion.estado} /></TableCell>
                                    <TableCell align="center">
                                        <div className="action-buttons">
                                            <Tooltip title="Ver Detalle" arrow>
                                                <IconButton
                                                    // ✨ Llama a la nueva función de modal en lugar de Link
                                                    onClick={() => handleOpenModal(cotizacion.token_acceso)}
                                                    color="info"
                                                    size="small"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredCotizaciones.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas por página:"
                    />
                </TableContainer>
            ) : (
                <div className="no-data-container">
                    <Description sx={{ fontSize: 60, color: '#cbd5e1' }} />
                    <h2>Aún no tienes cotizaciones</h2>
                    <p>Puedes crear una desde tu carrito de compras en cualquier momento.</p>
                    <Button
                        component={Link}
                        to="/tienda"
                        variant="contained"
                        className="action-button"
                        sx={{ textTransform: 'none' }}
                    >
                        Ir a la tienda
                    </Button>
                </div>
            )}
            
            {/* ✨ Agrega el modal aquí */}
            <CotizacionDetalleModal
                open={modalOpen}
                onClose={handleCloseModal}
                cotizacionToken={selectedCotizacionToken}
                onConvertSuccess={fetchCotizaciones} // Recarga la lista después de convertir
            />
        </div>
    );
}