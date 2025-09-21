// PaymentHistoryTable.jsx
import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Link, // Para enlazar a la imagen
    Box   // Para mostrar la imagen
} from "@mui/material";

// Función auxiliar para formatear moneda (Definición por defecto)
const formatCurrencyDefault = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const PaymentHistoryTable = ({ payments, formatCurrency = formatCurrencyDefault, isLiquidation = false }) => {
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            let date = new Date(dateString);
            if (isNaN(date.getTime())) {
                date = new Date(dateString + 'T00:00:00Z');
            }
            return date.toLocaleDateString('es-CO', { timeZone: 'UTC' }); 
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Fecha inválida';
        }
    };

    const paymentToShow = (payments && payments.length > 0) ? payments[0] : null;

    if (!paymentToShow) {
        return <Typography sx={{ mt: 2, p: 2, textAlign: 'center' }}>{isLiquidation ? "Esta línea de crédito aún no ha sido liquidada." : "No hay pagos registrados para este crédito."}</Typography>;
    }

    // Asumiendo que API_BASE_URL es donde se sirven los medios si la URL es relativa
    // Si la URL de `referencia_pago` ya es completa, no necesitas esto.
    // const mediaBaseUrl = "http://localhost:8000"; // O tu `settings.MEDIA_URL` completo

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }} elevation={1}>
            <Table size="small" aria-label={isLiquidation ? "detalle de liquidación" : "historial de pagos"}>
                <TableHead sx={{backgroundColor: "#f5f5f5"}}>
                    <TableRow>
                        {isLiquidation && <TableCell>ID Liquidación</TableCell>}
                        <TableCell>Fecha de {isLiquidation ? 'Liquidación' : 'Pago'}</TableCell>
                        <TableCell align="right">Monto Pagado</TableCell>
                        <TableCell>Método de Pago</TableCell>
                        <TableCell>Comprobante</TableCell> {/* Cambiado de Referencia */}
                        <TableCell>Registrado el</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paymentToShow && (
                        <TableRow key={paymentToShow.id}>
                            {isLiquidation && <TableCell>{paymentToShow.id}</TableCell>}
                            <TableCell>{formatDate(paymentToShow.fecha_pago_cliente)}</TableCell>
                            <TableCell align="right">{formatCurrency(paymentToShow.monto_pagado_cliente)}</TableCell>
                            <TableCell>{paymentToShow.metodo_pago || 'N/A'}</TableCell>
                            <TableCell>
                                {paymentToShow.referencia_pago ? (
                                    <Link href={paymentToShow.referencia_pago} target="_blank" rel="noopener noreferrer">
                                        <Box
                                            component="img"
                                            sx={{
                                                height: 60, // Altura fija para la miniatura
                                                width: 'auto', // Ancho automático para mantener proporción
                                                maxHeight: { xs: 50, md: 60 },
                                                maxWidth: { xs: 80, md: 100 },
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                objectFit: 'cover'
                                            }}
                                            alt="Comprobante de Pago"
                                            src={paymentToShow.referencia_pago} // La URL del serializer ImageField
                                            onError={(e) => { 
                                                // En caso de que la imagen no cargue (ej. es PDF)
                                                e.target.style.display='none'; // Oculta la imagen rota
                                                // Puedes mostrar un texto alternativo aquí si quieres
                                                const parent = e.target.parentNode;
                                                if (parent && parent.getElementsByClassName('alt-text').length === 0) {
                                                    const altText = document.createElement('span');
                                                    altText.className = 'alt-text';
                                                    altText.textContent = 'Ver Comprobante';
                                                    parent.appendChild(altText);
                                                }
                                            }}
                                        />
                                         {/* Texto de respaldo si la imagen no carga (ej. PDF) */}
                                        {!paymentToShow.referencia_pago.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) && (
                                            <Typography variant="caption" display="block" sx={{mt:0.5}}>Ver Comprobante</Typography>
                                        )}
                                    </Link>
                                ) : (
                                    'N/A'
                                )}
                            </TableCell>
                            <TableCell>{paymentToShow.fecha_registro_pago ? new Date(paymentToShow.fecha_registro_pago).toLocaleString('es-CO', {timeZone: 'UTC'}) : 'N/A'}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PaymentHistoryTable;