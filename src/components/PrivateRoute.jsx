// src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ requiredPrivilege, allowedRoles }) => {
    const { user, userPrivileges, loading } = useAuth();
    const location = useLocation();

    // 1. Muestra un spinner mientras el contexto determina el estado de autenticación
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. Si no hay usuario después de cargar, redirige al login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ✨ CORRECCIÓN: Comparamos con 'user.rol.nombre' en lugar del objeto 'user.rol' completo.
    // 3. Verificación de Rol (para rutas de cliente)
    if (allowedRoles && !allowedRoles.includes(user.rol?.nombre)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. Verificación de Privilegio (para rutas de admin)
    if (requiredPrivilege && !userPrivileges.includes(requiredPrivilege)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 5. Si pasa todas las verificaciones, permite el acceso
    return <Outlet />;
};

export default PrivateRoute;