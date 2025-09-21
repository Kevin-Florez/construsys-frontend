// src/pages/GuestOrderStatus.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShoppingBag, CheckCircle, Package, Truck, Home, ArrowLeft, UploadCloud, FileImage, Send, Clock, XCircle, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { Alert, Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import '../styles/PedidoStatus.css';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const getStatusInfo = (status) => {
    switch (status) {
        case 'pendiente_pago': return { text: 'Pendiente de Pago', description: 'Por favor, sube tu comprobante de pago para que podamos procesar tu pedido.', Icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-50' };
        case 'pendiente_pago_temporal': return { text: 'Pendiente de Pago (1h)', description: 'Tienes 60 minutos para subir tu comprobante de pago. De lo contrario, el pedido se cancelará automáticamente.', Icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' };
        case 'en_verificacion': return { text: 'En Verificación', description: 'Hemos recibido tu comprobante y lo estamos revisando. Te notificaremos pronto.', Icon: Package, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
        case 'pago_incompleto': return { text: 'Pago Incompleto', description: 'Revisamos tu pago y parece estar incompleto. Por favor, sube el comprobante restante.', Icon: AlertCircle, color: 'text-purple-500', bgColor: 'bg-purple-50' };
        case 'confirmado': return { text: 'Confirmado y en Preparación', description: '¡Todo en orden! Ya estamos preparando tus productos para el envío.', Icon: CheckCircle, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        case 'en_camino': return { text: 'En Camino', description: '¡Tu pedido ha sido despachado y va en camino a tu dirección!', Icon: Truck, color: 'text-cyan-500', bgColor: 'bg-cyan-50' };
        case 'entregado': return { text: 'Entregado', description: 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!', Icon: Home, color: 'text-green-500', bgColor: 'bg-green-50' };
        case 'cancelado': return { text: 'Cancelado', description: 'Este pedido ha sido cancelado.', Icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
        case 'cancelado_por_inactividad': return { text: 'Cancelado por Inactividad', description: 'No se recibió un comprobante de pago dentro del tiempo límite.', Icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
        default: return { text: 'Estado Desconocido', description: 'Contacta a soporte para más información.', Icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
};

export default function GuestOrderStatus() {
    const { token_seguimiento } = useParams();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();



    const [nuevosComprobantes, setNuevosComprobantes] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);


    

    const fetchPedido = useCallback(async () => {
        if (!token_seguimiento) {
            setError("No se proporcionó un token de seguimiento.");
            setLoading(false);
            return;
        }
        setLoading(true); 
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos/ver/${token_seguimiento}/`);
            if (!response.ok) {
                if (response.status === 404) throw new Error("El pedido que buscas no existe o el enlace es incorrecto.");
                throw new Error("No se pudo cargar la información del pedido.");
            }
            const data = await response.json();
            setPedido(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token_seguimiento]);

    useEffect(() => {
        fetchPedido();
    }, [fetchPedido]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith("image/"));
        
        if (imageFiles.length !== files.length) {
            toast.error("Algunos archivos no eran imágenes válidas y fueron omitidos.");
        }

        setNuevosComprobantes(prev => [...prev, ...imageFiles]);
        
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };
    
    // ✨ CORRECCIÓN: Lógica para eliminar una imagen de la cola de subida
    const handleRemovePreview = (indexToRemove) => {
        URL.revokeObjectURL(previews[indexToRemove]); // Liberar memoria
        setNuevosComprobantes(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // ✨ CORRECCIÓN: Lógica para subir todos los archivos seleccionados
    const handleUploadAdicional = async () => {
        if (nuevosComprobantes.length === 0) {
            toast.error("Debes seleccionar al menos un archivo para subir.");
            return;
        }
        setIsUploading(true);

        const uploadPromises = nuevosComprobantes.map(file => {
            const formData = new FormData();
            formData.append('imagen', file);
            return fetch(`${API_BASE_URL}/pedidos/ver/${pedido.token_seguimiento}/agregar-comprobante/`, {
                method: 'POST',
                body: formData,
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            });
        });

        try {
            await Promise.all(uploadPromises);
            toast.success(`¡${nuevosComprobantes.length} comprobante(s) subido(s) con éxito! Lo revisaremos pronto.`);
            setNuevosComprobantes([]);
            setPreviews([]);
            fetchPedido();
        } catch (error) {
            toast.error(error.detail || "Error al subir uno o más comprobantes.");
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return <div className="status-page-container"><Loader2 className="h-12 w-12 animate-spin text-blue-800" /></div>;
    }

    if (error) {
        return (
            <div className="status-page-container">
                <div className="status-card error">
                    <AlertCircle size={48} className="text-red-500" />
                    <h1 className="status-title">Error al Cargar</h1>
                    <p className="status-description">{error}</p>
                    <Link to="/consulta-pedido" className="status-button">Volver a Consultar</Link>
                </div>
            </div>
        );
    }
    
    const statusInfo = getStatusInfo(pedido.estado);
    const fechaPedido = new Date(pedido.fecha_creacion).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' });
    const fechaLimite = pedido.fecha_limite_pago ? new Date(pedido.fecha_limite_pago).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : null;

    return (
        <div className="status-page-container">
            <button onClick={() => navigate(-1)} className="back-button-status">
                <ArrowLeft size={16} /> Volver
            </button>

            <div className="status-card">
                <ShoppingBag size={48} className="text-blue-800" />
                <h1 className="status-title">Seguimiento del Pedido #{pedido.id}</h1>
                <p className="status-description">
                    Hola {pedido.nombre_receptor}, aquí puedes ver los detalles y el estado actual de tu compra.
                </p>
                <div className="status-highlight">
                    <p>Estado Actual:</p>
                    <div className={`status-badge ${statusInfo.color} ${statusInfo.bgColor}`}>
                        <statusInfo.Icon size={20} />
                        <span>{statusInfo.text}</span>
                    </div>
                </div>
                <p className="status-description small">{statusInfo.description}</p>
                
                {pedido.estado === 'pendiente_pago_temporal' && (
  <Alert
    severity="info"
    sx={{
      mt: 2,
      mb: 1,
      "& .MuiAlert-icon": {
        fontSize: "40px",   // más grande
        alignItems: "center",
        mr: 2,              // espacio entre icono y texto
      },
      "& .MuiAlert-message": {
        display: "flex",
        alignItems: "center",
      },
    }}
  >
    Tu pedido será cancelado automáticamente si no subes el comprobante antes de:{" "}
    <strong>{fechaLimite}</strong>
  </Alert>
)}






                {pedido.estado === 'cancelado_por_inactividad' && (
                    <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
                        <XCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        Tu pedido fue cancelado automáticamente por falta de pago a tiempo.
                    </Alert>
                )}

                {['cancelado', 'cancelado_por_inactividad'].includes(pedido.estado) && pedido.motivo_cancelacion && (
                    <div className="cancel-reason">
                        <strong>Motivo:</strong> {pedido.motivo_cancelacion}
                    </div>
                )}
                
                {['pendiente_pago', 'pendiente_pago_temporal', 'pago_incompleto'].includes(pedido.estado) && (
  <div className="upload-section">
    <h3 className="upload-title">Acción Requerida</h3>

    {pedido.estado === 'pago_incompleto' && (
  <Alert
    severity="error"
    sx={{
      mb: 2,
      display: "flex",
      alignItems: "center",
      "& .MuiAlert-message": {
        display: "flex",
        alignItems: "center",
      },
    }}
  >
    <DollarSign size={20} style={{ marginRight: "8px" }} />
    Hemos recibido un pago de{" "}
    <Box component="span" sx={{ fontWeight: "bold", mx: 0.5 }}>
      {formatCurrency(pedido.monto_pagado_verificado)}
    </Box>. Te falta por pagar{" "}
    <Box component="span" sx={{ fontWeight: "bold", mx: 0.5 }}>
      {formatCurrency(pedido.total - pedido.monto_pagado_verificado)}
    </Box>
  </Alert>
)}




    {/* Galería de previews */}
    <div className="file-preview-gallery">
      {previews.map((src, index) => (
        <div key={index} className="file-preview-item">
          <img src={src} alt={`preview ${index}`} />
          <button onClick={() => handleRemovePreview(index)}>
            <XCircle size={18} />
          </button>
        </div>
      ))}
    </div>

    {/* Dropzone */}
    <label htmlFor="comprobante-input" className="upload-dropzone">
      <UploadCloud size={32} />
      <span className="dropzone-text">Haz clic o arrastra tus comprobantes</span>
      <p>Puedes seleccionar múltiples imágenes</p>
    </label>
    <input
      id="comprobante-input"
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      multiple
      style={{ display: "none" }}
    />

    {/* Botón enviar */}
    <button
      onClick={handleUploadAdicional}
      disabled={nuevosComprobantes.length === 0 || isUploading}
      className="upload-button-new"
    >
      {isUploading ? <Loader2 className="animate-spin" /> : <Send size={16} />}
      <span>{isUploading ? 'Enviando...' : `Enviar ${nuevosComprobantes.length} Comprobante(s)`}</span>
    </button>
  </div>
            )}
                
                {pedido.monto_usado_credito > 0 && (
                    <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
  <Box sx={{ display: "flex", alignItems: "center" }}>
    <Wallet size={20} style={{ marginRight: "8px" }} />
    <span>
      Este pedido fue pagado con tu crédito por un monto de&nbsp;
      <strong>{formatCurrency(pedido.monto_usado_credito)}</strong>.
    </span>
  </Box>
</Alert>
                )}

                <div className="summary-grid">
                    <div className="summary-products">
                        <h2 className="summary-title">Resumen de Productos</h2>
                        <ul className="product-list">
                            {pedido.detalles.map(item => (
                                <li key={item.id} className="product-item">
                                    <div>
                                        <span className="product-name">{item.producto.nombre}</span>
                                        <span className="product-quantity">Cantidad: {item.cantidad}</span>
                                    </div>
                                    <span className="product-price">{formatCurrency(item.subtotal)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="summary-details">
                        <h2 className="summary-title">Detalles de la Compra</h2>
                        <ul className="details-list">
                            <li className="detail-item"><span>Subtotal</span><span>{formatCurrency(pedido.subtotal)}</span></li>
                            <li className="detail-item"><span>IVA (19%)</span><span>{formatCurrency(pedido.iva)}</span></li>
                            <li className="detail-item total"><span>Total</span><span>{formatCurrency(pedido.total)}</span></li>
                            <li className="detail-item"><span>Fecha del Pedido</span><span>{fechaPedido}</span></li>
                            <li className="detail-item">
            <span>Email de Contacto</span>
            {/* 👇 Usa el nuevo campo 'email_contacto' */}
            <span>{pedido.email_contacto}</span>
        </li>
                        </ul>
                    </div>
                </div>

                {pedido.comprobantes && pedido.comprobantes.length > 0 && (
  <div className="receipts-section">
    <h2 className="summary-title">Comprobantes Enviados</h2>

    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        mt: 1,
      }}
    >
      {pedido.comprobantes.map((comp) => (
        <Box
          key={comp.id}
          component="a"
          href={comp.imagen}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textDecoration: "none",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            overflow: "hidden",
            width: 140,
            boxShadow: 1,
            transition: "0.2s",
            "&:hover": {
              boxShadow: 3,
              transform: "scale(1.02)",
            },
          }}
        >
          <Box
            component="img"
            src={comp.imagen}
            alt="Comprobante"
            sx={{
              width: "100%",
              height: 100,
              objectFit: "cover",
              borderBottom: "1px solid #e0e0e0",
            }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1,
              width: "100%",
              justifyContent: "center",
              fontSize: "0.85rem",
              color: "text.secondary",
              bgcolor: "grey.50",
            }}
          >
            <FileImage size={16} style={{ marginRight: "6px" }} />
            Ver comprobante
          </Box>
        </Box>
      ))}
    </Box>
  </div>
)}

            </div>
        </div>
    );
}