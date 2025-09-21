import { React, useState } from "react"; // useEffect no se usa aquí
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    Store,
    ShoppingCart,
    AttachMoney,
    // ✨ 1. IMPORTA EL NUEVO ICONO
    Description,
    // ✨ FIN
    Construction,
    Menu,
    Close,
} from '@mui/icons-material';
import {
    Box,
    Typography,
    Avatar,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from '@mui/material';
import './ClientSidebar.css';

// ✨ 2. AÑADE EL NUEVO ELEMENTO AL MENÚ
const menuItems = [
    { path: '/inicio-cliente', icon: <Home />, label: 'Inicio', id: 'inicio' },
    { path: '/tienda', icon: <Store />, label: 'Tienda', id: 'tienda' },
    { path: '/mis-cotizaciones', icon: <Description />, label: 'Mis Cotizaciones', id: 'cotizaciones' },
    { path: '/mis-pedidos', icon: <ShoppingCart />, label: 'Mis Pedidos', id: 'pedidos' },
    { path: '/mis-creditos', icon: <AttachMoney />, label: 'Mis Créditos', id: 'creditos' },
    
];
// ✨ FIN

const ClientSidebar = ({ onToggle, isOpen }) => {
    const location = useLocation();
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleToggle = () => onToggle && onToggle(!isOpen);
    const handleLogoutClick = () => setOpenLogoutDialog(true);
    const handleCloseLogoutDialog = () => setOpenLogoutDialog(false);

    const handleConfirmLogout = () => {
        logout();
        handleCloseLogoutDialog();
    };

    const sidebarVariants = {
        open: { width: 260 },
        closed: { width: 80 },
    };
    
    // ... (el resto del componente no necesita cambios)
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        const first = parts[0] ? parts[0][0] : '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
        return `${first}${last}`.toUpperCase();
    };
    
    const displayName = user?.full_name || 'Cliente';
    const initials = getInitials(displayName);

    return (
        <>
            <motion.div
                initial={false}
                animate={isOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="sidebar client-sidebar"
            >
                <Button
                    onClick={handleToggle}
                    className="sidebar-toggle-button"
                    aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{
                        minWidth: "40px",
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        position: "absolute",
                        top: "15px",
                        right: isOpen ? "-20px" : "-20px",
                        boxShadow: 2,
                        zIndex: 1000,
                    }}
                >
                    {isOpen ? <Close fontSize="small" /> : <Menu fontSize="small" />}
                </Button>

                <Box className="sidebar-header">
                    <div className="logo-container">
                        <Avatar className="sidebar-avatar" alt="ConstruSys">
                            <Construction />
                        </Avatar>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.1 }}
                                    className="sidebar-title"
                                >
                                    <Typography variant="h6" component="div">ConstruSys</Typography>
                                    <Typography variant="caption" className="app-subtitle">Portal del Cliente</Typography>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Box>

                <Box className="sidebar-content-wrapper">
                    <Box className="sidebar-menu-container">
                        {menuItems.map(({ path, icon, label, id }) => (
                            <Tooltip title={isOpen ? "" : label} placement="right" key={id} arrow>
                                <Link to={path} className={`sidebar-link ${isActive(path) ? "active" : ""}`}>
                                    <div className={`sidebar-icon ${isActive(path) ? "active-icon" : ""}`}>{icon}</div>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.span
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                                                className={`sidebar-link-text ${isActive(path) ? "active-text" : ""}`}
                                            >
                                                {label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {isActive(path) && <div className="active-indicator" />}
                                </Link>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
                {/* Aquí podrías agregar la sección de logout si la quieres al final */}
            </motion.div>
        </>
    );
};

export default ClientSidebar;