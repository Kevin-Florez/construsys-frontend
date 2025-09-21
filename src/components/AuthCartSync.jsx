// src/components/AuthCartSync.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const AuthCartSync = () => {
    const { user, authTokens, loading: isAuthLoading } = useAuth();
    const { cart, clearCart, setCart } = useCart();
    const prevUserRef = useRef(user);

    // Bandera para evitar ejecuciones en la primera carga
    const isInitialMount = useRef(true);

    // ✨ 1. EFECTO PARA CARGAR EL CARRITO AL INICIAR O RECARGAR LA PÁGINA
    useEffect(() => {
        // Solo se ejecuta si hay un usuario y la autenticación ha terminado de cargar
        if (user && !isAuthLoading) {
            console.log("Usuario detectado. Cargando carrito desde la BD...");
            
            fetch(`${API_BASE_URL}/carrito/activo/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            })
            .then(res => res.json())
            .then(activeCart => {
                if (activeCart && activeCart.detalles) {
                    const normalizedCart = activeCart.detalles.map(item => ({
                        id: item.producto.id,
                        nombre: item.producto.nombre,
                        price: parseFloat(item.precio_unitario),
                        quantity: item.cantidad,
                        imagen_url: item.producto.imagen_url
                    }));
                    setCart(normalizedCart);
                    console.log("Carrito cargado desde la BD.", normalizedCart);
                }
            })
            .catch(err => console.error("Error al cargar carrito activo", err));
        }
    }, [user, isAuthLoading, authTokens, setCart]); // Se ejecuta cuando el usuario se define

    // ✨ 2. EFECTO SEPARADO PARA LIMPIAR Y UNIR
    useEffect(() => {
        const prevUser = prevUserRef.current;

        // --- CERRAR SESIÓN ---
        if (prevUser && !user) {
            console.log("Logout detectado, limpiando carrito.");
            clearCart();
        }

        // --- INICIAR SESIÓN (Y UNIR CARRITO DE INVITADO) ---
        if (!prevUser && user) {
            console.log("Login detectado, intentando unir carrito de invitado.");
            const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            if (localCart.length > 0) {
                fetch(`${API_BASE_URL}/carrito/unir/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                    body: JSON.stringify({ local_cart: localCart })
                })
                .then(res => res.json())
                .then(mergedPedido => {
                    const normalizedCart = mergedPedido.detalles.map(item => ({
                        id: item.producto.id,
                        nombre: item.producto.nombre,
                        price: parseFloat(item.precio_unitario),
                        quantity: item.cantidad,
                        imagen_url: item.producto.imagen_url
                    }));
                    setCart(normalizedCart);
                    localStorage.removeItem('cart');
                    toast.success("Hemos añadido los productos que tenías en tu carrito.");
                })
                .catch(err => console.error("Error al unir carritos", err));
            }
        }
        
        prevUserRef.current = user;
    }, [user, authTokens, clearCart, setCart]);


    // ✨ 3. EFECTO PARA SINCRONIZAR CAMBIOS EN LA BD
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!user) return;

        const handler = setTimeout(() => {
            console.log("Sincronizando cambios del carrito con la base de datos...");
            fetch(`${API_BASE_URL}/carrito/actualizar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify({ cart: cart })
            })
            .catch(error => console.error("Error de red al sincronizar carrito:", error));
        }, 2000);

        return () => clearTimeout(handler);
    }, [cart, user, authTokens]);

    return null;
};

export default AuthCartSync;