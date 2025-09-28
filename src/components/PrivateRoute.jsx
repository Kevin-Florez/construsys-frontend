// src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ requiredPrivilege, moduleAccess, allowedRoles }) => {
    const { user, loading, hasModuleAccess, hasPrivilege } = useAuth();
    const location = useLocation();

    // Muestra un spinner mientras se verifica el estado de autenticación
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Si no hay usuario, redirige al login, guardando la página que intentaba visitar
    if (!user) {
        return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
    }

    // Comienza asumiendo que el usuario tiene acceso
    let hasAccess = true;

    // 1. Verifica si el rol del usuario está en la lista de roles permitidos
    if (allowedRoles) {
        hasAccess = hasAccess && allowedRoles.includes(user.rol.nombre);
    }

    // 2. Verifica si el usuario tiene acceso general al módulo
    if (moduleAccess) {
        hasAccess = hasAccess && hasModuleAccess(moduleAccess);
    }

    // 3. Verifica si el usuario tiene un privilegio específico y requerido
    if (requiredPrivilege) {
        hasAccess = hasAccess && hasPrivilege(requiredPrivilege);
    }

    // Si alguna de las verificaciones falló, redirige a la página de no autorizado
    if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Si todas las verificaciones son exitosas, muestra el contenido de la ruta
    return <Outlet />;
};

export default PrivateRoute;