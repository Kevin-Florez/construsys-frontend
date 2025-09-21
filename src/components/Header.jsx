// src/components/Header.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import ProfileMenu from './ProfileMenu';
import './Header.css';

const Header = ({ isSidebarOpen }) => {
    const sidebarWidthOpen = 260;
    const sidebarWidthClosed = 80;
    const currentSidebarWidth = isSidebarOpen ? sidebarWidthOpen : sidebarWidthClosed;
    const HEADER_HEIGHT = 64; // Definimos la altura del header

    return (
        <AppBar
            position="fixed"
            className="app-bar-custom" // ✨ NUEVO: Clase específica
            sx={{
                width: `calc(100% - ${currentSidebarWidth}px)`,
                ml: `${currentSidebarWidth}px`,
                height: `${HEADER_HEIGHT}px`, // ✨ NUEVO: Altura fija
                transition: 'width 0.15s ease-out, margin-left 0.15s ease-out',
                backgroundColor: '#ffffff',
                color: '#333',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                zIndex: 1100, // ✨ Aumentar z-index por si acaso
            }}
        >
            <Toolbar className="toolbar">
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#1e40af' }}>
                   {/* Puedes poner un título dinámico aquí si lo deseas */}
                </Typography>
                <ProfileMenu />
            </Toolbar>
        </AppBar>
    );
};

export default Header;