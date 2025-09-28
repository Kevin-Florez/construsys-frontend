// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const getInitialState = () => {
        const tokens = localStorage.getItem('authTokens');
        if (tokens) {
            try {
                const parsedTokens = JSON.parse(tokens);
                const decodedUser = jwtDecode(parsedTokens.access);
                
                if (decodedUser.exp * 1000 > Date.now()) {
                    const structuredUser = {
                        id: decodedUser.user_id,
                        nombre: decodedUser.full_name, 
                        privileges: decodedUser.privileges || [],
                        rol: { nombre: decodedUser.rol }, 
                        must_change_password: decodedUser.must_change_password,
                    };
                    return { authTokens: parsedTokens, user: structuredUser };
                }
            } catch (error) { console.error("Error al decodificar tokens", error); }
        }
        return { authTokens: null, user: null };
    };

    const [authTokens, setAuthTokens] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
        const initialState = getInitialState();
        setAuthTokens(initialState.authTokens);
        setUser(initialState.user);
        setLoading(false);
    }, []);

    const logout = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    }, [navigate]); 

    const login = useCallback((data) => {
        try {
            const decoded = jwtDecode(data.access);
            const structuredUser = {
                id: decoded.user_id,
                nombre: decoded.full_name,
                privileges: decoded.privileges || [],
                rol: { nombre: decoded.rol },
                must_change_password: decoded.must_change_password,
            };
            setAuthTokens(data);
            setUser(structuredUser);
            localStorage.setItem('authTokens', JSON.stringify(data));
            
            if (structuredUser.must_change_password) {
                navigate('/cambiar-contrasena', { replace: true });
            } else {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
                const targetUrl = redirectUrl || (structuredUser.rol.nombre === 'Cliente' ? "/inicio-cliente" : "/dashboard");
                navigate(targetUrl, { replace: true });
            }
        } catch (error) {
            console.error("Error en el proceso de login:", error);
            logout();
        }
    }, [navigate, logout]);
    
    const userPrivileges = user?.privileges || [];

    // ✨ --- INICIO DE NUEVAS FUNCIONES AUXILIARES --- ✨
    /**
     * Verifica si el usuario tiene un privilegio específico.
     * @param {string} privilege El codename del privilegio a verificar (ej: 'ventas_crear').
     * @returns {boolean} True si el usuario tiene el privilegio.
     */
    const hasPrivilege = useCallback((privilege) => {
        if (!privilege) return false;
        return userPrivileges.includes(privilege);
    }, [userPrivileges]);

    /**
     * Verifica si el usuario tiene CUALQUIER privilegio dentro de un módulo.
     * @param {string} moduleName El nombre legible del módulo (ej: 'Ventas' o 'Solicitudes Crédito').
     * @returns {boolean} True si el usuario tiene al menos un privilegio para ese módulo.
     */
    const hasModuleAccess = useCallback((moduleName) => {
        if (!moduleName || userPrivileges.length === 0) {
            return false;
        }
        // Convierte 'Ventas' a 'ventas_' o 'Solicitudes Crédito' a 'solicitudes_crédito_'
        const prefix = moduleName.toLowerCase().replace(/\s+/g, '_') + '_';
        return userPrivileges.some(p => p.startsWith(prefix));
    }, [userPrivileges]);
    // ✨ --- FIN DE NUEVAS FUNCIONES AUXILIARES --- ✨

    const contextData = { 
        user, 
        authTokens, 
        loading, 
        login, 
        logout, 
        userPrivileges,
        hasPrivilege,      // Función para verificar un privilegio exacto
        hasModuleAccess    // Nueva función para verificar acceso a un módulo completo
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}></Box>;
    }
    
    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};