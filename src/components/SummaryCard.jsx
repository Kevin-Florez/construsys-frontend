// src/components/SummaryCard.jsx

import React from 'react';
import { Card, CardContent, Typography, Divider, Box } from '@mui/material';

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const SummaryCard = ({ title, subtotal = 0, iva = 0, total = 0, children }) => {
    return (
        <Card variant="outlined" sx={{ position: 'sticky', top: '20px' }}>
            <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                    {title}
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {children}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Subtotal:</Typography>
                    <Typography>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">IVA (19%):</Typography>
                    <Typography>{formatCurrency(iva)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{formatCurrency(total)}</Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;