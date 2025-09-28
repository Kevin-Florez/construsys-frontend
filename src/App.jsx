// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import './styles/global.css';

// --- LAYOUTS ---
import PublicLayout from "./layouts/PublicLayout";
import Layout from './Layout';

// --- COMPONENTES DE RUTA ---
import PrivateRoute from "./components/PrivateRoute";

// --- PÁGINAS PÚBLICAS ---
import Home from './pages/home';
import Nosotros from './pages/Nosotros';
import Contacto from './pages/Contacto';
import CatalogoPublico from './pages/Catalogo';
import OrderLookup from './pages/OrderLookup';
import GuestOrderStatus from './pages/GuestOrderStatus';

// --- PÁGINAS DE AUTENTICACIÓN Y OTROS ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecuperarContrasena from "./pages/RecuperarContraseña";
import ResetPassword from "./pages/ResetPassword";
import CambiarContrasena from "./pages/CambiarContrasena";
import Unauthorized from "./pages/Unauthorized";
import ProfilePage from "./pages/ProfilePage";

// --- PÁGINAS DE GESTIÓN (ADMIN) ---
import Dashboard from "./pages/Dashboard";
import VentasLista from "./pages/VentasLista";
import VentasCreate from "./pages/VentasCreate";
import DevolucionVenta from "./pages/DevolucionVenta";
import ComprasLista from './pages/ComprasLista';
import ComprasCreate from './pages/ComprasCreate';
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import Roles from "./pages/Roles";
import Usuarios from "./pages/Usuarios";
import CategoriaProducto from "./pages/CategoriaProducto";
import AdminPedidos from "./pages/AdminPedidos";
import Marcas from "./pages/Marcas";
import AdminCotizaciones from './pages/AdminCotizaciones';
import AdminCotizacionCreate from './pages/AdminCotizacionCreate';
import BajasStock from './pages/BajasStock';
import GestionDevoluciones from './pages/GestionDevoluciones';

// --- PÁGINAS DE CRÉDITOS Y SOLICITUDES (ADMIN) ---
import CreditosAdmin from "./pages/Creditos";
import CreditoDetalle from "./pages/CreditoDetalle";
import Solicitudes from './pages/Solicitudes';
import SolicitudCreate from './pages/SolicitudCreate';
import SolicitudDetalle from './pages/SolicitudDetalle';

// --- PÁGINAS DE LA VISTA DEL CLIENTE ---
import InicioCliente from './pages/InicioCliente';
import CatalogoCliente from "./pages/CatalogoCliente";
import PedidosCliente from "./pages/PedidosCliente";
import CreditosCliente from "./pages/CreditosClientes";
import Checkout from "./pages/Checkout";
import AuthCartSync from "./components/AuthCartSync";
import MisCotizaciones from './pages/MisCotizaciones';
import DetalleCotizacion from './pages/DetalleCotizacion';

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AuthCartSync />
                    <ScrollToTop />
                    <Toaster position="top-right" closeButton richColors />
                    <Routes>
                        {/* --- RUTAS PÚBLICAS CON LAYOUT --- */}
                        <Route path="/" element={<PublicLayout />}>
                            <Route index element={<Home />} />
                            <Route path="nosotros" element={<Nosotros />} />
                            <Route path="contacto" element={<Contacto />} />
                            <Route path="catalogo-publico" element={<CatalogoPublico />} />
                            <Route path="consultar-pedido" element={<OrderLookup />} />
                        </Route>

                        {/* --- RUTAS PÚBLICAS SIN LAYOUT --- */}
                        <Route path="/pedido/ver/:token_seguimiento" element={<GuestOrderStatus />} />
                        <Route path="/cotizacion/ver/:token" element={<DetalleCotizacion />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/recuperar-contraseña" element={<RecuperarContrasena />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/unauthorized" element={<Layout><Unauthorized /></Layout>} />
                        
                        {/* --- RUTAS PRIVADAS GENERALES (SOLO REQUIEREN LOGIN) --- */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/cambiar-contrasena" element={<Layout><CambiarContrasena /></Layout>} />
                            <Route path="/perfil" element={<Layout><ProfilePage /></Layout>} />
                        </Route>

                        {/* --- RUTAS EXCLUSIVAS PARA CLIENTES --- */}
                        <Route element={<PrivateRoute allowedRoles={["Cliente", "Superadmin"]} />}>
                            <Route path="/inicio-cliente" element={<Layout><InicioCliente /></Layout>} />
                            <Route path="/tienda" element={<Layout><CatalogoCliente /></Layout>} />
                            <Route path="/mis-pedidos" element={<Layout><PedidosCliente /></Layout>} />
                            <Route path="/mis-creditos" element={<Layout><CreditosCliente /></Layout>} />
                            <Route path="/mis-cotizaciones" element={<Layout><MisCotizaciones /></Layout>} />
                        </Route>

                        {/* --- RUTAS DE GESTIÓN (ADMIN) CON LAYOUT Y PRIVILEGIOS --- */}
                        {/* ✨ Se cambia 'requiredPrivilege' por 'moduleAccess' en las vistas de lista principales */}

                        <Route element={<PrivateRoute moduleAccess="Dashboard" />}>
                            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                        </Route>
                        
                        {/* Módulo de Ventas */}
                        <Route element={<PrivateRoute moduleAccess="Ventas" />}>
                            <Route path="/ventas" element={<Layout><VentasLista /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="ventas_crear" />}>
                            <Route path="/ventas/nueva" element={<Layout><VentasCreate /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="ventas_devolucion" />}>
                            <Route path="/ventas/:ventaId/devolucion" element={<Layout><DevolucionVenta /></Layout>} />
                        </Route>

                        <Route element={<PrivateRoute moduleAccess="Devoluciones" />}>
                            <Route path="/devoluciones" element={<Layout><GestionDevoluciones /></Layout>} />
                        </Route>

                        {/* Módulo de Bajas de Stock */}
                        <Route element={<PrivateRoute moduleAccess="Stock" />}>
                            <Route path="/stock/bajas" element={<Layout><BajasStock /></Layout>} />
                        </Route>
                        
                        {/* Módulo de Compras */}
                        <Route element={<PrivateRoute moduleAccess="Compras" />}>
                            <Route path="/compras" element={<Layout><ComprasLista /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="compras_crear" />}>
                            <Route path="/compras/nueva" element={<Layout><ComprasCreate /></Layout>} />
                        </Route>

                        {/* Otros Módulos de Gestión */}
                        <Route element={<PrivateRoute moduleAccess="Clientes" />}>
                            <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Proveedores" />}>
                            <Route path="/proveedores" element={<Layout><Proveedores /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Productos" />}>
                            <Route path="/productos" element={<Layout><Productos /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Marcas" />}>
                            <Route path="/marcas" element={<Layout><Marcas /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Categorias" />}>
                            <Route path="/categoria-producto" element={<Layout><CategoriaProducto /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Roles" />}>
                            <Route path="/roles" element={<Layout><Roles /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Usuarios" />}>
                            <Route path="/usuarios" element={<Layout><Usuarios /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Cotizaciones" />}>
                                <Route path="/cotizaciones" element={<Layout><AdminCotizaciones /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="cotizaciones_crear" />}>
                                <Route path="/admin/cotizaciones/crear" element={<Layout><AdminCotizacionCreate /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute moduleAccess="Pedidos" />}>
                            <Route path="/pedidos" element={<Layout><AdminPedidos /></Layout>} />
                        </Route>
                        
                        {/* Módulo de Créditos y Solicitudes */}
                        <Route element={<PrivateRoute moduleAccess="Creditos" />}>
                            <Route path="/creditos" element={<Layout><CreditosAdmin /></Layout>} />
                            <Route path="/creditos/:creditoId" element={<Layout><CreditoDetalle /></Layout>} />
                        </Route>

                        <Route element={<PrivateRoute moduleAccess="Solicitudes" />}>
                            <Route path="/solicitudes" element={<Layout><Solicitudes /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="solicitudes_gestionar" />}>
                            <Route path="/solicitudes/:solicitudId" element={<Layout><SolicitudDetalle /></Layout>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPrivilege="solicitudes_crear" />}>
                            <Route path="/solicitudes/nueva" element={<Layout><SolicitudCreate /></Layout>} />
                        </Route>
                        
                        {/* --- RUTA COMODÍN (404) --- */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </CartProvider>
            </AuthProvider> 
        </Router>
    );
}

export default App;