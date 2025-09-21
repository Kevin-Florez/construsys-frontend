// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Paper } from '@mui/material';
import { Block } from '@mui/icons-material';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Box 
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 200px)', // Ajustar altura
                p: 3
            }}
        >
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    maxWidth: '500px',
                    borderRadius: '12px'
                }}
            >
                <Block sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    Acceso Denegado
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
                </Typography>
                
            </Paper>
        </Box>
    );
};

export default Unauthorized;