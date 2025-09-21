// src/components/AbonoHistoryTable.jsx

import React from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Typography, Link, Chip, Tooltip, IconButton, Box
} from '@mui/material';
import { CheckCircleOutline, HighlightOff, HourglassEmpty } from '@mui/icons-material';

const formatCurrency = (value) => `$${parseFloat(value).toLocaleString('es-CO')}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

// --- NUEVO: Componente para mostrar el estado del abono de forma visual ---
const EstadoChip = ({ estado, motivoRechazo }) => {
    const chipProps = {
        label: estado,
        size: 'small',
        icon: <HourglassEmpty />,
        color: 'warning'
    };

    switch (estado) {
        case 'Verificado':
            chipProps.color = 'success';
            chipProps.icon = <CheckCircleOutline />;
            break;
        case 'Rechazado':
            chipProps.color = 'error';
            chipProps.icon = <HighlightOff />;
            break;
        default: // Pendiente
            break;
    }
    
    // Si está rechazado, envolvemos el Chip en un Tooltip para mostrar el motivo
    if (estado === 'Rechazado' && motivoRechazo) {
        return (
            <Tooltip title={`Motivo: ${motivoRechazo}`}>
                <Chip {...chipProps} />
            </Tooltip>
        );
    }

    return <Chip {...chipProps} />;
};


// --- MODIFICADO: El componente ahora acepta más propiedades para la interacción del admin ---
const AbonoHistoryTable = ({ abonos, isAdminView = false, onApprove, onReject, actionLoadingId }) => {
    if (!abonos || abonos.length === 0) {
        return <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No hay abonos registrados para esta cuenta.</Typography>;
    }

    return (
        <TableContainer component={Paper} variant="outlined" className='lll'>
            <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                        <TableCell align="center">Fecha Abono</TableCell>
                        <TableCell align="center">Monto</TableCell>
                        <TableCell align="center">Método de Pago</TableCell>
                        {/* --- NUEVA COLUMNA --- */}
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="center">Comprobante</TableCell>
                        {/* --- NUEVA COLUMNA CONDICIONAL --- */}
                        {isAdminView && <TableCell align="center">Acciones</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {abonos.map((abono) => (
                        <TableRow key={abono.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell align="center">{formatDate(abono.fecha_abono)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: '500' }}>{formatCurrency(abono.monto)}</TableCell>
                            <TableCell align="center">{abono.metodo_pago || 'N/A'}</TableCell>
                            
                            {/* --- NUEVO: Celda para el estado --- */}
                            <TableCell align="center">
                                <EstadoChip estado={abono.estado_display} motivoRechazo={abono.motivo_rechazo} />
                            </TableCell>

                            <TableCell align="center">
                                {abono.comprobante_url ? <Link href={abono.comprobante_url} target="_blank" rel="noopener noreferrer">Ver Archivo</Link> : 'No aplica'}
                            </TableCell>

                            {/* --- NUEVO: Celda condicional para acciones del admin --- */}
                            {isAdminView && (
                                <TableCell align="center">
                                    {abono.estado === 'Pendiente' ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Aprobar Abono">
                                                <span>
                                                    <IconButton 
                                                        color="success" 
                                                        size="small"
                                                        onClick={() => onApprove(abono.id)}
                                                        disabled={actionLoadingId === abono.id}
                                                    >
                                                        <CheckCircleOutline />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Rechazar Abono">
                                                <span>
                                                    <IconButton 
                                                        color="error" 
                                                        size="small"
                                                        onClick={() => onReject(abono.id)}
                                                        disabled={actionLoadingId === abono.id}
                                                    >
                                                        <HighlightOff />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    ) : 'N/A'}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AbonoHistoryTable;