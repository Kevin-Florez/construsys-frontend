import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext'; 

// --- MUI Imports ---
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Card, CardContent, Grid, Button, Typography, Alert, Box,
    Divider, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
    Stack, IconButton, Skeleton, Tooltip
} from "@mui/material";
import {
    Dashboard as DashboardIcon, AttachMoney, TrendingUp, CreditCard as CreditCardIcon,
    AccountBalanceWallet as WalletIcon, ErrorOutline as OverdueIcon, Timeline as TimelineIcon,
    Inventory2 as InventoryIcon, WarningAmber, Search, Clear,
    ArrowUpward, ArrowDownward, ShoppingCart, Poll as PollIcon
} from "@mui/icons-material";

// --- Recharts Imports (✨ SE AÑADIERON BarChart y Bar) ---
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, BarChart, Bar 
} from "recharts";

// --- Date Filter Imports ---
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';

import "../styles/Dashboard.css";

const API_BASE_URL_DASHBOARD = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const formatCurrency = (value) => { 
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// --- COMPONENTES REUTILIZABLES DEL DASHBOARD ---

const StatCard = ({ title, value, detail, icon, color = "#212121" }) => (
    <Card className="stats-card-redesigned">
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0.8, mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }} noWrap>
                    {value}
                </Typography>
                {detail && (
                    <Typography variant="caption" color="text.secondary">
                        {detail}
                    </Typography>
                )}
            </Box>
            <Box className="stats-card-redesigned-icon-wrapper" sx={{ backgroundColor: `${color}20`, color }}>
                {icon}
            </Box>
        </CardContent>
    </Card>
);

const ModernChart = ({ data, title, icon, dataKey, color, xAxisDataKey = "name" }) => (
    <Card className="chart-card modern-chart">
        <CardContent sx={{ p: 3 }}>
            <Box className="chart-header">
                <Box display="flex" alignItems="center" gap={1.5}>
                    {icon}
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {title}
                    </Typography>
                </Box>
                <Box className="chart-decorative-line" />
            </Box>
            <Box sx={{ mt: 3, height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey={xAxisDataKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                        <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} width={80} />
                        <RechartsTooltip formatter={(value) => [formatCurrency(value), "Ventas"]} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fill={`url(#gradient-${dataKey})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

const ProductsToRestockCard = ({ products, onNavigate }) => (
    <Card className="chart-card modern-chart" sx={{ height: '100%' }}>
  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
    <Box className="chart-header" sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <WarningAmber sx={{ color: '#f59e0b' }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Productos para Reponer
        </Typography>
      </Box>
    </Box>

    <Box sx={{ flexGrow: 1, maxHeight: 320, overflowY: 'auto', pr: 1 }}>
      {products && products.length > 0 ? (
        <List disablePadding>
          {products.map((product) => (
            <ListItem
              key={product.id}
              onClick={() => onNavigate('/productos')}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                boxShadow: 1,
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'grey.50',
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  cursor: 'pointer',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#fff3e0' }}>
                  <InventoryIcon sx={{ color: '#ef6c00' }} />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600 }}
                    noWrap
                  >
                    {product.nombre}
                  </Typography>
                }
                secondary={product.marca_nombre || 'Sin marca'}
              />
              <Tooltip title={`Stock Mínimo: ${product.stock_minimo}`}>
                <Chip
                  label={`${product.stock_actual} / ${product.stock_minimo}`}
                  size="small"
                  sx={{
                    bgcolor: '#ffebee',
                    color: '#d32f2f',
                    fontWeight: 'bold',
                  }}
                />
              </Tooltip>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box
          display="flex"
          height="100%"
          justifyContent="center"
          alignItems="center"
          sx={{ flexDirection: 'column', gap: 2 }}
        >
          <ShoppingCart sx={{ fontSize: 60, color: 'text.disabled' }} />
          <Typography color="text.secondary" textAlign="center">
            ¡Todo en orden!
            <br />
            Ningún producto por debajo del stock mínimo.
          </Typography>
        </Box>
      )}
    </Box>
  </CardContent>
</Card>
);

// ✨ NUEVO COMPONENTE PARA LA GRÁFICA DE BARRAS DE PRODUCTOS
const ProductBarChartCard = ({ title, data, icon, color, nameKey, dataKey }) => (
    <Card className="chart-card modern-chart">
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box className="chart-header">
                <Box display="flex" alignItems="center" gap={1.5}>
                    {icon}
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 3, flexGrow: 1, minHeight: 300 }}>
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey={nameKey}
                                axisLine={false}
                                tickLine={false}
                                width={150} // Aumenta el espacio para nombres de producto largos
                                tick={{ fontSize: 12, fill: '#666' }}
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value) => [value, 'Unidades vendidas']}
                            />
                            <Bar dataKey={dataKey} fill={color} radius={[0, 8, 8, 0]} maxBarSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <Box display="flex" height="100%" justifyContent="center" alignItems="center" sx={{ flexDirection: 'column', gap: 2 }}>
                        <PollIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                        <Typography color="text.secondary" textAlign="center">
                            No hay suficientes datos de ventas
                            <br />
                            para mostrar en el período seleccionado.
                        </Typography>
                    </Box>
                )}
            </Box>
        </CardContent>
    </Card>
);

// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---

const Dashboard = () => {
    const navigate = useNavigate();
    const { authTokens } = useAuth();
    
    const [dashboardData, setDashboardData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    const formatDateForApi = (date) => date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;

    const loadAllDashboardData = useCallback(async (fInicio, fFin) => {
        setLoading(true);
        setError(null);
        
        const token = authTokens?.access;
        
        if (!token) {
            setError("Token de autenticación no encontrado.");
            setLoading(false);
            return;
        }

        try {
            const url = new URL(`${API_BASE_URL_DASHBOARD}/ventas/resumen-general-dashboard/`);
            if (fInicio) url.searchParams.append('fecha_inicio', fInicio);
            if (fFin) url.searchParams.append('fecha_fin', fFin);

            const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("Error al cargar los datos del dashboard.");
            
            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            console.error("Error al cargar datos del dashboard:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authTokens]);

    useEffect(() => {
        if (authTokens) {
            // Por defecto (sin fechas), el backend debe calcular anualmente
            loadAllDashboardData(null, null);
        }
    }, [authTokens, loadAllDashboardData]);

    const handleFiltrar = () => {
        loadAllDashboardData(formatDateForApi(fechaInicio), formatDateForApi(fechaFin));
    };

    const handleLimpiarFiltro = () => {
        setFechaInicio(null);
        setFechaFin(null);
        loadAllDashboardData(null, null);
    };

    const {
        stats_generales = {},
        tendencia_ventas = [],
        productos_para_reponer = [],
        productos_mas_vendidos = [],
        productos_menos_vendidos = []
    } = dashboardData;
    
    if (error) {
        return <Box className="dashboard-error-container"><Alert severity="error">{error}</Alert></Box>;
    }

    return (
        <Box className="dashboard-container">
            <Box className="dashboard-header-redesigned">
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>Dashboard General</Typography>
                    <Typography variant="body1" color="text.secondary">Resumen ejecutivo de Depósito y Ferretería del Sur.</Typography>
                </Box>
                <Paper variant="outlined" sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <DatePicker label="Fecha Inicio" value={fechaInicio} onChange={setFechaInicio} disableFuture slotProps={{ textField: { variant: 'standard', size: 'small' } }} />
                            <DatePicker label="Fecha Fin" value={fechaFin} onChange={setFechaFin} disableFuture slotProps={{ textField: { variant: 'standard', size: 'small' } }} />
                            <IconButton color="primary" onClick={handleFiltrar}><Search /></IconButton>
                            <IconButton onClick={handleLimpiarFiltro}><Clear /></IconButton>
                        </Stack>
                    </LocalizationProvider>
                </Paper>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {loading ? (
                    Array.from(new Array(5)).map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}><Skeleton variant="rounded" height={100} /></Grid>
                    ))
                ) : (
                    <>
                        <Grid item xs={12} sm={6} md={4} lg={2.4}><StatCard title="Ventas Hoy" value={formatCurrency(stats_generales.ventas_hoy)} icon={<AttachMoney />} color="#10b981" /></Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2.4}><StatCard title={stats_generales.titulo_ventas_periodo || 'Ventas Período'} value={formatCurrency(stats_generales.ventas_periodo)} icon={<TrendingUp />} color="#3b82f6" /></Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2.4}><StatCard title="Cartera por Cobrar" value={formatCurrency(stats_generales.cartera_total)} detail={`${stats_generales.creditos_activos || 0} Créditos`} icon={<WalletIcon />} color="#8b5cf6" /></Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2.4}><StatCard title="Créditos Vencidos" value={String(stats_generales.creditos_vencidos || 0)} detail="Créditos" icon={<OverdueIcon />} color={(stats_generales.creditos_vencidos || 0) > 0 ? "#ef4444" : "#4caf50"} /></Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2.4}><StatCard title="Productos para Reponer" value={String(productos_para_reponer.length)} detail="Ítems" icon={<InventoryIcon />} color={productos_para_reponer.length > 0 ? "#f59e0b" : "#10b981"} /></Grid>
                    </>
                )}
            </Grid>

            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={7}>{loading ? <Skeleton variant="rounded" height={428} /> : <ModernChart data={tendencia_ventas} title="Tendencia de Ventas" icon={<TimelineIcon sx={{ color: '#3b82f6' }} />} dataKey="ventas" color="#3b82f6" type="area" />}</Grid>
                <Grid item xs={12} lg={5}>{loading ? <Skeleton variant="rounded" height={428} /> : <ProductsToRestockCard products={productos_para_reponer} onNavigate={navigate} />}</Grid>
            </Grid>

            {/* ✨ SECCIÓN ACTUALIZADA CON GRÁFICAS DE BARRAS */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    {loading ? (
                        <Skeleton variant="rounded" height={400} />
                    ) : (
                        <ProductBarChartCard
                            title="Productos Más Vendidos"
                            data={productos_mas_vendidos}
                            icon={<ArrowUpward sx={{ color: '#10b981' }} />}
                            color="#10b981"
                            nameKey="producto__nombre"
                            dataKey="unidades_vendidas"
                        />
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    {loading ? (
                        <Skeleton variant="rounded" height={400} />
                    ) : (
                        <ProductBarChartCard
                            title="Productos Menos Vendidos"
                            data={productos_menos_vendidos}
                            icon={<ArrowDownward sx={{ color: '#ef4444' }} />}
                            color="#ef4444"
                            nameKey="producto__nombre"
                            dataKey="unidades_vendidas"
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;