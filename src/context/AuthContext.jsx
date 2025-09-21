// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
// ✨ 1. Se elimina la importación de useCart para romper la dependencia circular
// import { useCart } from './CartContext'; 

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
    
    // ✨ 2. Se elimina la llamada a useCart de este archivo
    // const { cart, clearCart, setCart } = useCart(); 

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
        // ✨ 3. La responsabilidad de limpiar el carrito ya no está aquí
        // clearCart(); 
        navigate('/login');
    }, [navigate]); 

    // ✨ 4. La función 'login' se simplifica. La lógica de unir carritos se moverá a CartContext
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
            // Se llama a una versión de logout que ya no depende de clearCart
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
            navigate('/login');
        }
    }, [navigate]);
    
    const contextData = { user, authTokens, loading, login, logout, userPrivileges: user?.privileges || [] };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}></Box>;
    }
    
    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};