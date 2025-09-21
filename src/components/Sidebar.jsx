import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import {
    Home,
    ShoppingCart,
    ExitToApp,
    People,
    Store,
    LocalMall,
    AssignmentInd,
    Category,
    Description,
    CreditCard,
    ReportProblem,
    Business,
    ChevronRight,
    ChevronLeft,
    ExpandMore,
    ExpandLess,
    Construction,
    LocalShipping,
    Inventory2,
    PointOfSale,
    Badge,
    ListAltOutlined,
    Security as SecurityIcon,
    PlaylistAddCheck as SolicitudIcon,
    // --- INICIO DE CAMBIOS: Ícono corregido ---
    AssignmentReturn as DevolucionIcon 
    // --- FIN DE CAMBIOS ---
} from "@mui/icons-material";
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Menu, Close } from "@mui/icons-material";
import {
    Box,
    Button,
    Typography,
    Avatar,
    Tooltip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import "./Sidebar.css";

// --- Estructura Maestra de Menús ---
const ALL_MENU_ITEMS = {
    topLevel: [
        { path: "/dashboard", icon: <Home />, label: "Dashboard", id: "dashboard_top_level", requiredPrivilege: "dashboard_ver" },
    ],
    categories: [
        {
            id: "comercial", category: "Comercial", categoryIcon: <PointOfSale fontSize="small" />,
            items: [
                { path: "/clientes", icon: <People />, label: "Clientes", requiredPrivilege: "clientes_ver" },
                { path: "/cotizaciones", icon: <Description />, label: "Cotizaciones", requiredPrivilege: "cotizaciones_ver" },
                { path: "/ventas", icon: <ShoppingCart />, label: "Ventas", requiredPrivilege: "ventas_ver" },
                { path: "/pedidos", icon: <ListAltOutlined />, label: "Pedidos", requiredPrivilege: "pedidos_ver" },
                { path: "/devoluciones", icon: <DevolucionIcon />, label: "Devoluciones", requiredPrivilege: "devoluciones_ver_devolucion_proveedor" },
                { path: "/solicitudes", icon: <SolicitudIcon />, label: "Solicitudes Crédito", requiredPrivilege: "solicitudes_ver" },
                { path: "/creditos", icon: <CreditCard />, label: "Créditos Activos", requiredPrivilege: "creditos_ver" },
                // --- INICIO DE CAMBIOS ---
                
                // --- FIN DE CAMBIOS ---
            ],
        },
        {
            // --- INICIO DE CAMBIOS ---
            id: "stock", category: "Productos", categoryIcon: <Inventory2 fontSize="small" />,
            items: [
                { path: "/productos", icon: <Store />, label: "Gestión Productos", requiredPrivilege: "productos_ver" },
                { path: "/categoria-producto", icon: <Category />, label: "Categorías", requiredPrivilege: "categorias_ver" },
                { path: "/marcas", icon: <LocalOfferIcon />, label: "Marcas", requiredPrivilege: "marcas_ver" },
                { path: "/stock/bajas", icon: <ReportProblem />, label: "Bajas de Stock", requiredPrivilege: "stock_ver_bajas" },
            ],
            // --- FIN DE CAMBIOS ---
        },
        {
            id: "compras", category: "Abastecimiento", categoryIcon: <LocalShipping fontSize="small" />,
            items: [
                { path: "/compras", icon: <LocalMall />, label: "Compras", requiredPrivilege: "compras_ver" },
                { path: "/proveedores", icon: <Business />, label: "Proveedores", requiredPrivilege: "proveedores_ver" },
            ],
        },
        {
            id: "administracion", category: "Seguridad", categoryIcon: <SecurityIcon  fontSize="small" />,
            items: [
                { path: "/usuarios", icon: <Badge />, label: "Usuarios", requiredPrivilege: "usuarios_ver" },
                { path: "/roles", icon: <AssignmentInd />, label: "Roles", requiredPrivilege: "roles_ver" },
            ],
        },
    ]
};

const Sidebar = ({ onToggle, isOpen }) => {
    const [expandedSections, setExpandedSections] = useState({});
    const location = useLocation();
    const navigate = useNavigate();
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
    
    const { userPrivileges, logout, user } = useAuth();

    const visibleMenu = useMemo(() => {
        if (!userPrivileges) return { topLevel: [], categories: [] };

        const visibleTopLevel = ALL_MENU_ITEMS.topLevel.filter(item =>
            userPrivileges.includes(item.requiredPrivilege)
        );

        const visibleCategories = ALL_MENU_ITEMS.categories.map(category => ({
            ...category,
            items: category.items.filter(item => userPrivileges.includes(item.requiredPrivilege))
        })).filter(category => category.items.length > 0);

        return { topLevel: visibleTopLevel, categories: visibleCategories };
    }, [userPrivileges]);

    useEffect(() => {
        const currentPath = location.pathname;
        const newExpandedSections = {}; 
        visibleMenu.categories.forEach((category) => {
            const isActiveSection = category.items.some((item) => currentPath.startsWith(item.path));
            newExpandedSections[category.id] = isActiveSection; 
        });
        setExpandedSections(newExpandedSections);
    }, [location.pathname, visibleMenu.categories]);

    const isActive = (path) => location.pathname.startsWith(path);
    const handleToggle = () => onToggle && onToggle(!isOpen);

    const toggleSection = (sectionId) => {
        setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

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

    return (
        <>
            <motion.div
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="sidebar"
            >
                <Button
                    onClick={handleToggle}
                    className="sidebar-toggle-button"
                    aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                    sx={{
                        minWidth: "40px",
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        position: "absolute",
                        top: "15px",
                        right: "-20px",
                        boxShadow: 2,
                        zIndex: 1000,
                    }}
                >
                    {isOpen ? <Close fontSize="small" /> : <Menu fontSize="small" />}
                </Button>

                <Box className="sidebar-header">
                    <div className="logo-container">
                        <Avatar className="sidebar-avatar" alt="ConstruSys"><Construction /></Avatar>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.1 }}
                                    className="sidebar-title"
                                >
                                    <Typography variant="h6" component="div">ConstruSys</Typography>
                                    <Typography variant="caption" className="app-subtitle">Sistema de Gestión</Typography>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Box>

                <Box className="sidebar-menu-container">
                    {visibleMenu.topLevel.map(({ path, icon, label, id }) => (
                        <Tooltip title={isOpen ? "" : label} placement="right" key={id} arrow>
                            <Link to={path} className={`sidebar-link ${isActive(path) ? "active" : ""}`}>
                                <div className={`sidebar-icon ${isActive(path) ? "active-icon" : ""}`}>{icon}</div>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                                            <Typography component="span" className={`sidebar-link-text ${isActive(path) ? "active-text" : ""}`}>{label}</Typography>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {isActive(path) && <div className="active-indicator" />}
                            </Link>
                        </Tooltip>
                    ))}

                    {visibleMenu.categories.map((category) => (
                        <Box key={category.id} className="sidebar-category">
                            {isOpen ? (
                                <Button onClick={() => toggleSection(category.id)} className="category-button">
                                    <span className="category-icon">{category.categoryIcon}</span>
                                    <Typography variant="caption" className="category-title">{category.category}</Typography>
                                    {expandedSections[category.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                </Button>
                            ) : (
                                <Box className="category-divider-closed" />
                            )}
                            <Collapse in={isOpen ? expandedSections[category.id] : true} timeout={isOpen ? 150 : 0}>
                                <Box>
                                    {category.items.map(({ path, icon, label }) => (
                                        <Tooltip title={isOpen ? "" : label} placement="right" key={path} arrow>
                                            <Link to={path} className={`sidebar-link ${isActive(path) ? "active" : ""}`}>
                                                <div className={`sidebar-icon ${isActive(path) ? "active-icon" : ""}`}>{icon}</div>
                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                                                            <Typography component="span" className={`sidebar-link-text ${isActive(path) ? "active-text" : ""}`}>{label}</Typography>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                {isActive(path) && <div className="active-indicator" />}
                                            </Link>
                                        </Tooltip>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    ))}
                </Box>
            </motion.div>
        </>
    );
};

export default Sidebar;