// src/pages/AdminCotizaciones.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatFecha } from '../utils/formatters';
import {
    Box, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, InputAdornment,
    CircularProgress, TablePagination, Tooltip, IconButton, Alert, Button
} from "@mui/material";
import { 
    Search as SearchIcon, 
    Clear as ClearIcon, 
    Add as AddIcon, 
    PictureAsPdf as PdfIcon 
} from "@mui/icons-material";
import CotizacionDetalleModal from '../components/CotizacionDetalleModal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import '../styles/AdminCotizaciones.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const StatusBadge = ({ status }) => {
    const statusInfo = {
        vigente: { text: 'Vigente', className: 'status-vigente' },
        convertida: { text: 'Pedido', className: 'status-convertida' },
        vencida: { text: 'Vencida', className: 'status-vencida' },
    };
    const info = statusInfo[status] || { text: status, className: 'status-default' };

    return <Typography component="span" className={`estado-label ${info.className}`}>{info.text}</Typography>;
};

export default function AdminCotizaciones() {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { authTokens } = useAuth();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);
    const navigate = useNavigate();

    // Estado para controlar el modal de detalle
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCotizacionToken, setSelectedCotizacionToken] = useState(null);

    const fetchAllCotizaciones = useCallback(async () => {
        if (!authTokens) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/admin/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` },
            });
            if (!response.ok) throw new Error('No se pudieron cargar las cotizaciones.');

            const data = await response.json();
            const updatedData = data.map(c => (c.is_expired && c.estado === 'vigente' ? { ...c, estado: 'vencida' } : c));
            setCotizaciones(updatedData);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => {
        fetchAllCotizaciones();
    }, [fetchAllCotizaciones]);

    useEffect(() => {
  const lowerSearchTerm = searchTerm.toLowerCase();

  const filtered = cotizaciones.filter(c => {
    const clienteInfo = c.cliente
      ? `${c.cliente.nombre} ${c.cliente.apellido} ${c.cliente.correo}`
      : `${c.nombre_invitado} ${c.email_invitado}`;

    // Datos en bruto (sin formato)
    const rawFechaCreacion = c.fecha_creacion || "";
    const rawFechaVencimiento = c.fecha_vencimiento || "";
    const rawTotal = c.total?.toString() || "";

    // Datos formateados (para mostrar en tabla)
    const formattedFechaCreacion = formatFecha(c.fecha_creacion);
    const formattedFechaVencimiento = formatFecha(c.fecha_vencimiento);
    const formattedTotal = formatCurrency(c.total);

    // Concatenar todo en un string de búsqueda
    const rowData = `
      ${c.id}
      ${clienteInfo}
      ${formattedFechaCreacion} ${rawFechaCreacion}
      ${formattedFechaVencimiento} ${rawFechaVencimiento}
      ${formattedTotal} ${rawTotal}
      ${c.estado}
    `.toLowerCase();

    return rowData.includes(lowerSearchTerm);
  });

  setCotizacionesFiltradas(filtered);
  setPage(0);
}, [searchTerm, cotizaciones]);



    const handleDownloadPdf = async (cotizacionId) => {
        if (!authTokens) {
            toast.error("No estás autenticado.");
            return;
        }
        const toastId = toast.loading("Generando PDF...");
        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/admin/${cotizacionId}/pdf/`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authTokens.access}` },
            });

            if (!response.ok) {
                throw new Error('No se pudo generar el PDF. Intente de nuevo.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `cotizacion_${cotizacionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            toast.success("PDF descargado exitosamente.", { id: toastId });

        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleClearSearch = () => setSearchTerm("");
    
    const handleOpenModal = (token) => {
        setSelectedCotizacionToken(token);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCotizacionToken(null);
    };

    const paginatedCotizaciones = useMemo(() => {
        return cotizacionesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [page, rowsPerPage, cotizacionesFiltradas]);

    if (loading) {
        return <div className="loading-indicator"><CircularProgress /> Cargando cotizaciones...</div>;
    }

    if (error) {
        return <div className="cotizaciones-container"><Alert severity="error">Error: {error}</Alert></div>;
    }

    return (
        <div className="cotizaciones-container">
  <div className="cotizaciones-title-header">
    <h1>Gestión de Cotizaciones</h1>
  </div>

  {/* Toolbar con buscador + botón */}
  <Box 
    className="cotizaciones-toolbar" 
    sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      gap: 2 
    }}
  >
    {/* Buscador */}
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
      sx={{ 
        maxWidth: '400px', 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: '8px' 
      }}
    />

    {/* Botón crear cotización */}
    <Button 
      variant="contained" 
      startIcon={<AddIcon />}
      onClick={() => navigate('/admin/cotizaciones/crear')}
      className="add-button"
      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
      
    >
      Crear Cotización
    </Button>
  </Box>


            <TableContainer component={Paper} className="cotizaciones-table-container" elevation={0} variant="outlined">
                <Table stickyHeader className="cotizaciones-table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">N° Cotización</TableCell>
                            <TableCell align="center">Cliente / Invitado</TableCell>
                            <TableCell align="center">Fecha Creación</TableCell>
                            <TableCell align="center">Fecha Vencimiento</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedCotizaciones.length > 0 ? (
                            paginatedCotizaciones.map(c => (
                                <TableRow key={c.id} hover>
                                    <TableCell align="center" sx={{fontWeight: 'bold', color: '#1e40af'}}>#{c.id}</TableCell>
                                    <TableCell align="center">
                                        <div className="user-cell">
                                            {c.cliente ? (
                                                <>
                                                    <Typography variant="body2" className="user-name">{`${c.cliente.nombre} ${c.cliente.apellido}`}</Typography>
                                                    <Typography variant="caption" className="user-email">{c.cliente.correo}</Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography variant="body2" className="user-name">{c.nombre_invitado} (Invitado)</Typography>
                                                    <Typography variant="caption" className="user-email">{c.email_invitado}</Typography>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell align="center">{formatFecha(c.fecha_creacion)}</TableCell>
                                    <TableCell align="center">{formatFecha(c.fecha_vencimiento)}</TableCell>
                                    <TableCell align="center" sx={{fontWeight: 500}}>{formatCurrency(c.total)}</TableCell>
                                    <TableCell align="center"><StatusBadge status={c.estado} /></TableCell>
                                    <TableCell align="center" className="actions-cell">
                                        <div className="action-buttons">
                                            <Tooltip title="Ver Detalle" arrow>
                                                <IconButton
                                                    onClick={() => handleOpenModal(c.token_acceso)}
                                                    color="info"
                                                    size="small"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Descargar PDF" arrow>
                                                <IconButton
                                                    onClick={() => handleDownloadPdf(c.id)}
                                                    sx={{ color: "black" }} // Puedes usar 'default' o 'primary' si prefieres
                                                    size="small"
                                                >
                                                    <PdfIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" className="no-data-cell">
                                    No se encontraron cotizaciones con los filtros actuales.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={cotizacionesFiltradas.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </TableContainer>
            
            <CotizacionDetalleModal
                open={modalOpen}
                onClose={handleCloseModal}
                cotizacionToken={selectedCotizacionToken}
                onConvertSuccess={fetchAllCotizaciones}
            />
        </div>
    );
}