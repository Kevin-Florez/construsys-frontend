// src/pages/InicioCliente.jsx
import React, { useState, useEffect } from 'react';
import {
    Typography, Button, useTheme, useMediaQuery, Divider,
    Chip, CircularProgress, Alert, Grid, Avatar, Box, Paper
} from '@mui/material';
import {
    ShoppingBagOutlined as ShoppingBag, History, PendingActionsOutlined as PendingActions,
    LocalShippingOutlined as EnCamino, CheckCircleOutline as CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency, formatNumeroPedido, formatFecha } from '../utils/formatters';
import PedidoDetalleModal from '../components/PedidoDetalleModal';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

// --- COMPONENTES ESTILIZADOS (Sin cambios) ---
const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    maxWidth: '1400px', 
    margin: '0 auto',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(3),
    },
}));
const WelcomeHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3, 2),
    marginBottom: theme.spacing(3),
    textAlign: 'center',
    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
    color: theme.palette.common.white,
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4, 3),
        marginBottom: theme.spacing(4),
    },
}));
const SectionPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius * 2,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(3),
    },
}));
const StatCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    height: '100%',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[6],
    },
}));
const PedidoItemPaper = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'borderColor',
})(({ theme, borderColor }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    borderLeft: `4px solid ${borderColor}`,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
        boxShadow: theme.shadows[4],
        transform: 'scale(1.01)',
    },
}));
const CenteredBox = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)',
});


// --- COMPONENTE PRINCIPAL ---
export default function InicioCliente() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    // ✅ 1. Obtenemos 'authTokens' en lugar de 'token'
    const { authTokens, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPedido, setSelectedPedido] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            // ✅ 2. Definimos 'token' aquí adentro
            const token = authTokens?.access;
            if (!token) {
                setLoading(false); // Detener la carga si no hay token
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const [profileRes, pedidosRes] = await Promise.all([
                    // ✨ 3. Usamos el token del contexto en las peticiones
                    fetch(`${API_BASE_URL}/perfil/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/pedidos/`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (profileRes.status === 401 || pedidosRes.status === 401) {
                    toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
                    navigate('/login');
                    return;
                }

                if (!profileRes.ok || !pedidosRes.ok) {
                    throw new Error("No se pudieron cargar tus datos. Por favor, intenta de nuevo.");
                }

                const profileData = await profileRes.json();
                const pedidosData = await pedidosRes.json();

                setProfile(profileData);
                setPedidos(pedidosData);

            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    // ✅ 3. El 'useEffect' ahora depende de 'authTokens'
    }, [navigate, authTokens, logout]);

    const handleOpenModal = (pedido) => {
        setSelectedPedido(pedido);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const stats = {
        total: pedidos.length,
        pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
        en_camino: pedidos.filter(p => p.estado === 'en_camino' || p.estado === 'confirmado').length,
        entregados: pedidos.filter(p => p.estado === 'entregado').length,
    };

    const pedidosRecientes = pedidos.slice(0, 3);

    const getEstadoInfo = (estado) => {
        const estadoNormalizado = String(estado).toLowerCase();
        switch (estadoNormalizado) {
            case 'entregado': return { color: 'success', borderColor: theme.palette.success.main };
            case 'en_camino': return { color: 'info', borderColor: theme.palette.info.main };
            case 'confirmado': return { color: 'primary', borderColor: theme.palette.primary.main };
            case 'cancelado': return { color: 'error', borderColor: theme.palette.error.main };
            case 'pendiente':
            default:
                return { color: 'warning', borderColor: theme.palette.warning.main };
        }
    };

    const statItems = [
        { icon: <ShoppingBag />, value: stats.total, label: "Total Pedidos", color: 'secondary.main' },
        { icon: <PendingActions />, value: stats.pendientes, label: "Pendientes", color: 'warning.main' },
        { icon: <EnCamino />, value: stats.en_camino, label: "En Proceso", color: 'info.main' },
        { icon: <CheckCircle />, value: stats.entregados, label: "Completados", color: 'success.main' }
    ];

    if (loading) return <CenteredBox><CircularProgress size={60} /></CenteredBox>;
    if (error) return <PageContainer><Alert severity="error">Error al cargar tus datos: {error}</Alert></PageContainer>;

    return (
        <PageContainer>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <WelcomeHeader>
                    <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" fontWeight={700} gutterBottom>
                        ¡Hola, {profile?.nombre_completo?.split(' ')[0] || 'Cliente'}!
                    </Typography>
                    <Typography variant="h6" component="p" fontWeight={300} sx={{ opacity: 0.9 }}>
                        Bienvenido de nuevo a tu panel
                    </Typography>
                </WelcomeHeader>
            </motion.div>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Grid container spacing={isMobile ? 2 : 3} sx={{ maxWidth: '900px' }}>
                    {statItems.map((item, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * index }}>
                                <StatCard elevation={2}>
                                    <Avatar sx={{ bgcolor: item.color, color: 'common.white', width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}>
                                        {item.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>{item.value}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                            {item.label}
                                        </Typography>
                                    </Box>
                                </StatCard>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Box>
            
            <Grid container>
                <Grid item xs={12}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
                        <SectionPaper elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} >
                                <Typography variant="h6" fontWeight={600}>Tus Pedidos Recientes</Typography>
                                
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            {pedidosRecientes.length > 0 ? (
                                <Grid container spacing={2}>
                                    {pedidosRecientes.map((pedido) => {
                                        const { color: colorEstado, borderColor } = getEstadoInfo(pedido.estado);
                                        return (
                                            <Grid item xs={12} md={4} key={pedido.id}>
                                                <PedidoItemPaper
                                                    borderColor={borderColor}
                                                    onClick={() => handleOpenModal(pedido)}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                        <Typography variant="subtitle1" fontWeight={500}>
                                                            {formatNumeroPedido(pedido.id)}
                                                        </Typography>
                                                        <Chip label={pedido.estado.replace('_', ' ')} color={colorEstado} size="small" sx={{ textTransform: 'capitalize', fontWeight: 500 }} />
                                                    </Box>
                                                    <Divider light sx={{ my: 1 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexGrow: 1, mt: 1 }}>
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatFecha(pedido.fecha_creacion)}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {pedido.detalles.length} {pedido.detalles.length === 1 ? 'artículo' : 'artículos'}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            {formatCurrency(pedido.total)}
                                                        </Typography>
                                                    </Box>
                                                </PedidoItemPaper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6}}>
                                    <ShoppingBag sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>No tienes pedidos recientes</Typography>
                                    <Typography variant="body2" color="text.disabled" textAlign="center">
                                        Cuando realices tu primer pedido, aparecerá aquí.
                                    </Typography>
                                </Box>
                            )}
                        </SectionPaper>
                    </motion.div>
                </Grid>
            </Grid>

            <PedidoDetalleModal
                pedido={selectedPedido}
                open={modalOpen}
                onClose={handleCloseModal}
            />
        </PageContainer>
    );
}