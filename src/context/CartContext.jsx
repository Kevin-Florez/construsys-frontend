// src/context/CartContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

const IVA_RATE = 0.19;

export const CartProvider = ({ children }) => {
    // El estado inicial siempre se carga desde localStorage.
    const [cart, setCart] = useState(() => {
        try {
            const cartData = localStorage.getItem('cart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error("No se pudo cargar el carrito desde localStorage", error);
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    // Este efecto AHORA solo guarda en localStorage. Es simple y funciona para invitados.
    // AuthCartSync se encargará de la lógica para usuarios logueados.
    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error("No se pudo guardar el carrito en localStorage", error);
        }
    }, [cart]);

    const addToCart = useCallback((product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock_actual) {
                    toast.warning(`No puedes añadir más de ${product.stock_actual} unidades de este producto.`);
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: newQuantity } : item
                );
            }
            return [...prevCart, { ...product, quantity }];
        });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 500);
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        setCart(prevCart => {
            const parsedQuantity = parseInt(quantity, 10);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return prevCart.filter(item => item.id !== productId);
            }
            return prevCart.map(item =>
                item.id === productId ? { ...item, quantity: parsedQuantity } : item
            );
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
        toast.info("Producto eliminado del carrito.");
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const cartSubtotal = cart.reduce((total, item) => total + (item.quantity * item.price), 0);
    const cartIva = cartSubtotal * IVA_RATE;
    const cartTotal = cartSubtotal + cartIva;
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    const value = {
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartIva,
        cartTotal,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        justAdded
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};