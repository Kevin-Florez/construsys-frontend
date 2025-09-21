// src/pages/Checkout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { 
    ArrowLeft, User, MapPin, Phone, Store, Truck, Loader2, CreditCard, Info, UploadCloud, X, LogIn, UserPlus, Mail, Fingerprint, FileText 
} from 'lucide-react';
import { formatCurrency } from "../utils/formatters"; 
import { Switch, Alert, CircularProgress, Typography, Button as MuiButton, Select, MenuItem, FormControl, InputLabel, Divider } from '@mui/material';
import QrCode from '@mui/icons-material/QrCode';
import "../styles/PagoCliente.css";
import { useAuth } from "../context/AuthContext";
import qrBancolombia from '../assets/images/qr-bancolombia.jpg';

import '../styles/checkout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const FormInput = ({ icon, label, id, error, ...props }) => (
    <div className="form-group">
        <label htmlFor={id} className="form-label">{label}</label>
        <div className="form-field-wrapper">
            <span className="input-icon">{icon}</span>
            <input id={id} className={`form-input ${error ? 'input-error' : ''}`} {...props} />
        </div>
        {error && <p className="error-text">{error}</p>}
    </div>
);

export default function Checkout() {
    const { cart, cartSubtotal, cartIva, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const { user, authTokens, loading: isAuthLoading } = useAuth();
    const isAuthenticated = !!user;

    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [loadingCredito, setLoadingCredito] = useState(true);
    const [isCheckingDocument, setIsCheckingDocument] = useState(false);
    
    const [formData, setFormData] = useState({ 
        nombre: "", direccion: "", telefono: "", email_invitado: "",
        tipo_documento: "CC", documento: ""
    });

    const [showQr, setShowQr] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState('form'); 
    const [creditoInfo, setCreditoInfo] = useState(null);
    const [usarCredito, setUsarCredito] = useState(false);
    const [metodoEntrega, setMetodoEntrega] = useState('domicilio');
    const [comprobantes, setComprobantes] = useState([]);
    const [previewComprobantes, setPreviewComprobantes] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);

    // ✨ INICIO: Nuevo estado para controlar la intención de redirección
    const [isRedirectingFromAction, setIsRedirectingFromAction] = useState(false);
    // ✨ FIN: Nuevo estado

const [selectedImage, setSelectedImage] = useState(null);

    
    const fetchCredito = useCallback(async (token) => {
        setLoadingCredito(true);
        if (!token) {
            setLoadingCredito(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/creditos/mi-credito/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 404) {
                setCreditoInfo(null);
            } else if (response.ok) {
                const data = await response.json();
                setCreditoInfo(data);
            } else {
                setCreditoInfo(null);
            }
        } catch (error) {
            console.error("No se pudo cargar la información del crédito.", error);
            setCreditoInfo(null);
        } finally {
            setLoadingCredito(false);
        }
    }, []);
    
    useEffect(() => {
        if (isAuthLoading) return;

        if (isAuthenticated && user?.rol?.nombre === 'Cliente') {
            const token = authTokens?.access;
            if (!token) return;

            const fetchUserProfile = async () => {
                setIsProfileLoading(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/clientes/mi-perfil/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const profileData = await response.json();
                        setFormData(prev => ({
                            ...prev,
                            nombre: `${profileData.nombre || ''} ${profileData.apellido || ''}`.trim(),
                            telefono: profileData.telefono || '',
                            direccion: profileData.direccion || '',
                        }));
                    } else {
                        toast.error("No se pudieron cargar los datos de tu perfil.");
                    }
                } catch (error) {
                    console.error("Error al cargar el perfil del usuario:", error);
                    toast.error("Error de conexión al cargar tu perfil.");
                } finally {
                    setIsProfileLoading(false);
                }
            };
            
            fetchUserProfile();
            fetchCredito(token);

        } else {
            setIsProfileLoading(false);
            setLoadingCredito(false);
        }
    }, [isAuthenticated, user, isAuthLoading, authTokens, fetchCredito]);
    
    // ✨ INICIO: Modificamos el useEffect para que no se ejecute si estamos redirigiendo intencionalmente
    useEffect(() => {
        if (cart.length === 0 && !isSubmitting && !orderCompleted && !isRedirectingFromAction) {
            toast.info("Te redirigimos al catálogo.");
            setTimeout(() => {
                navigate(isAuthenticated ? "/tienda" : "/catalogo-publico");
            }, 1000);
        }
    }, [cart, isSubmitting, orderCompleted, navigate, isAuthenticated, isRedirectingFromAction]);
    // ✨ FIN: Modificación
    
    const montoPagoAdicional = usarCredito ? 0 : cartTotal;
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'nombre') processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        if (name === 'telefono' || name === 'documento') processedValue = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const newFiles = [], newPreviews = [];
        files.forEach(file => {
            if (file.type.startsWith("image/")) {
                newFiles.push(file);
                newPreviews.push(URL.createObjectURL(file));
            } else {
                toast.error(`El archivo "${file.name}" no es una imagen válida y fue omitido.`);
            }
        });
        setComprobantes(prev => [...prev, ...newFiles]);
        setPreviewComprobantes(prev => [...prev, ...newPreviews]);
        if (errors.comprobantes) setErrors(prev => ({ ...prev, comprobantes: undefined }));
    };

    const handleRemoveComprobante = (indexToRemove) => {
        URL.revokeObjectURL(previewComprobantes[indexToRemove]);
        setComprobantes(prev => prev.filter((_, index) => index !== indexToRemove));
        setPreviewComprobantes(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    if (!formData.telefono.trim() || !/^\d{7,10}$/.test(formData.telefono)) 
        newErrors.telefono = "Ingresa un número de teléfono válido.";
    if (metodoEntrega === 'domicilio' && !formData.direccion.trim()) 
        newErrors.direccion = "La dirección es requerida para domicilios.";

    if (!isAuthenticated) {
        if (!/^\S+@\S+\.\S+$/.test(formData.email_invitado)) 
            newErrors.email_invitado = "Ingresa un correo electrónico válido.";
        if (!formData.documento) newErrors.documento = "El número de documento es requerido.";
        if (!formData.tipo_documento) newErrors.tipo_documento = "El tipo de documento es requerido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Por favor, completa todos los campos requeridos antes de confirmar el pedido.");
            return;
        }
        setIsSubmitting(true);
        const token = authTokens?.access;
        const submissionData = new FormData();
        submissionData.append('nombre_receptor', formData.nombre);
        submissionData.append('telefono_receptor', formData.telefono);
        submissionData.append('metodo_entrega', metodoEntrega);
        if (metodoEntrega === 'domicilio') submissionData.append('direccion_entrega', formData.direccion);
        if (!isAuthenticated) {
            submissionData.append('email_invitado', formData.email_invitado);
            submissionData.append('tipo_documento_invitado', formData.tipo_documento);
            submissionData.append('documento_invitado', formData.documento);
        }
        
        if (isAuthenticated && usarCredito) {
            submissionData.append('credito_usado_id', creditoInfo.id);
            submissionData.append('monto_usado_credito', cartTotal);
        } else {
            comprobantes.forEach(file => {
                submissionData.append('comprobantes_iniciales', file);
            });
        }
        
        const productosParaEnviar = cart.map(item => ({ id: item.id, quantity: item.quantity }));
        submissionData.append('productos', JSON.stringify(productosParaEnviar));
        
        const headers = {};
        if (isAuthenticated && token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos/`, {
                method: 'POST',
                headers: headers,
                body: submissionData,
            });
            const responseData = await response.json();
            if (!response.ok) {
                const errorMsg = responseData.detail || Object.values(responseData).flat().join(' ');
                throw new Error(errorMsg || 'Ocurrió un error al crear el pedido.');
            }
            toast.success("¡Pedido realizado con éxito!");
            setOrderCompleted(true);
            clearCart();
            if (isAuthenticated) navigate("/mis-pedidos");
            else navigate(`/pedido/ver/${responseData.token_seguimiento}`);
        } catch (error) {
            toast.error(error.message || "No se pudo conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCrearCotizacion = async () => {
        if (!validateForm()) {
    toast.error("Por favor, completa todos los campos requeridos antes de guardar la cotización.");
    return;
}


        setIsCreatingQuote(true);
        const token = authTokens?.access;

        const payload = {
            cart_items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        };

        if (!isAuthenticated) {
            payload.email_invitado = formData.email_invitado;
            payload.nombre_invitado = formData.nombre;
        }

        const headers = {
            'Content-Type': 'application/json',
        };
        if (isAuthenticated && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cotizaciones/crear/`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.detail || Object.values(responseData).flat().join(' ');
                throw new Error(errorMsg || 'Ocurrió un error al crear la cotización.');
            }
            
            toast.success("¡Cotización guardada con éxito!", {
                description: "Los precios se mantendrán por 15 días. Si eres invitado, revisa tu correo para ver el enlace de acceso.",
            });
            clearCart();
            
            // ✨ INICIO: Activa la bandera antes de redirigir
            setIsRedirectingFromAction(true);
            
            if (isAuthenticated) {
                navigate("/mis-cotizaciones");
            } else {
                navigate("/catalogo-publico");
            }

        } catch (error) {
            toast.error(error.message || "No se pudo conectar con el servidor.");
        } finally {
            setIsCreatingQuote(false);
        }
    };

    const handleUsarCreditoToggle = (event) => {
        setUsarCredito(event.target.checked);
    };

    const handleDocumentBlur = async () => {
        if (!formData.documento || !formData.tipo_documento) return;
        setIsCheckingDocument(true);
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/check-by-document/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_documento: formData.tipo_documento,
                    documento: formData.documento
                })
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    nombre: `${data.nombre} ${data.apellido}`.trim(),
                    telefono: data.telefono,
                    direccion: data.direccion,
                    email_invitado: data.correo
                }));
                toast.success('¡Datos de cliente encontrados!', {
                    description: 'Hemos autocompletado el formulario para ti.'
                });
            } else if (response.status !== 404) {
                toast.error("Hubo un problema al verificar el documento.");
            }
        } catch (error) {
            console.error("Error de red al verificar documento", error);
            toast.error("No se pudo conectar al servidor para la verificación.");
        } finally {
            setIsCheckingDocument(false);
        }
    };
    
    if (isAuthLoading || (isAuthenticated && (isProfileLoading || loadingCredito))) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>Cargando tu información...</Typography>
            </div>
        );
    }
    
    return (
        <div className="page-container">
            <div className="pago-header">
                <button onClick={() => navigate(isAuthenticated ? '/tienda' : '/catalogo-publico')} className="back-button"><ArrowLeft size={20} />{isAuthenticated ? 'Volver a la Tienda' : 'Volver Atrás'}</button>
                <h1 className="pago-titulo">Finalizar Compra o Cotización</h1>
            </div>
            <div className="pago-layout">
                <div className="form-column">
                    <form onSubmit={handleSubmit} id="pago-form" noValidate>
                        <div className="card">
                            <h2 className="card-title">Método de Entrega</h2>
                            <div className="delivery-options-container">
                                <label className={`delivery-option ${metodoEntrega === 'domicilio' ? 'selected' : ''}`}><Truck size={24} /><span>Domicilio</span><input type="radio" name="metodoEntrega" value="domicilio" checked={metodoEntrega === 'domicilio'} onChange={(e) => setMetodoEntrega(e.target.value)} /></label>
                                <label className={`delivery-option ${metodoEntrega === 'tienda' ? 'selected' : ''}`}><Store size={24} /><span>Reclamar en Tienda</span><input type="radio" name="metodoEntrega" value="tienda" checked={metodoEntrega === 'tienda'} onChange={(e) => setMetodoEntrega(e.target.value)} /></label>
                            </div>
                        </div>
                        <div className="card">
                            <h2 className="card-title">Datos de Contacto y Entrega</h2>
                            {!isAuthenticated && (
                                <div className="document-check-section">
                                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#4b5563' }}>Si ya eres cliente, ingresa tu documento para autocompletar.</Typography>
                                    <div className="document-inputs">
                                        <FormControl size="small" className="document-type-select" variant="outlined" fullWidth><InputLabel>Tipo de Documento</InputLabel><Select name="tipo_documento" value={formData.tipo_documento} onChange={handleInputChange} label="Tipo de Documento"><MenuItem value="CC">Cédula de Ciudadanía</MenuItem><MenuItem value="CE">Cédula de Extranjería</MenuItem><MenuItem value="NIT">NIT</MenuItem><MenuItem value="PAS">Pasaporte</MenuItem><MenuItem value="TI">Tarjeta de Identidad</MenuItem><MenuItem value="RC">Registro Civil</MenuItem><MenuItem value="PPT">Permiso por Protección Temporal</MenuItem></Select></FormControl>
                                        <div className="document-number-wrapper"><FormInput icon={<Fingerprint size={18} />} label="Número de Documento" id="documento" name="documento" type="text" value={formData.documento} onChange={handleInputChange} onBlur={handleDocumentBlur} error={errors.documento} placeholder="Tu número de documento" required />{isCheckingDocument && <CircularProgress size={20} className="document-loader" />}</div>
                                    </div>
                                    <Divider sx={{ my: 2 }} />
                                </div>
                            )}
                            <div className="form-grid">
                                {!isAuthenticated && <FormInput icon={<Mail size={18} />} label="Correo Electrónico (para seguimiento)" id="email_invitado" name="email_invitado" type="email" value={formData.email_invitado} onChange={handleInputChange} error={errors.email_invitado} placeholder="tu.correo@ejemplo.com" required />}
                                <FormInput icon={<User size={18} />} label="Nombre Completo" id="nombre" name="nombre" type="text" value={formData.nombre} onChange={handleInputChange} error={errors.nombre} placeholder="Tu nombre y apellido" required />
                                <FormInput icon={<Phone size={18} />} label="Teléfono de Contacto" id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} error={errors.telefono} placeholder="Ej: 3001234567" />
                            </div>
                            {metodoEntrega === 'domicilio' && (
                                <FormInput icon={<MapPin size={18} />} label="Dirección de Entrega" id="direccion" name="direccion" type="text" value={formData.direccion} onChange={handleInputChange} error={errors.direccion} placeholder="Calle, número, barrio, etc."/>
                            )}
                        </div>
                        
                        {isAuthenticated && creditoInfo && parseFloat(creditoInfo.saldo_disponible_para_ventas) > 0 && (
                            <div className="card">
                                <div className="credit-header">
                                    <CreditCard size={22}/>
                                    <h2 className="card-title no-margin">¿Usar tu Crédito?</h2>
                                </div>
                                <div className="credit-toggle">
                                    <Typography>Disponible: <strong>{formatCurrency(creditoInfo.saldo_disponible_para_ventas)}</strong></Typography>
                                    <Switch checked={usarCredito} onChange={handleUsarCreditoToggle} color="primary" disabled={cartTotal > parseFloat(creditoInfo.saldo_disponible_para_ventas)} />
                                </div>
                                {usarCredito && (
                                    <Alert severity="info" sx={{ mt: 1 }}>Se usará el saldo de tu crédito para esta compra.</Alert>
                                )}
                                {cartTotal > parseFloat(creditoInfo.saldo_disponible_para_ventas) && (
                                        <Alert severity="warning" sx={{ mt: 1 }}>Tu crédito no es suficiente para cubrir el total de esta compra. No puede ser usado.</Alert>
                                )}
                            </div>
                        )}

                        {montoPagoAdicional > 0 && (
                            <div className="card">
                                <h2 className="card-title">Próximos Pasos: Realizar el Pago</h2>
                                <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
                                    Completa tu pedido ahora y tendrás <strong>1 hora</strong> para realizar la transferencia por <strong>{formatCurrency(montoPagoAdicional)}</strong> y subir el comprobante.
                                </Alert>
                                <div className="pago-instrucciones">
                                    <p>Transfiere a la cuenta de ahorros Bancolombia:</p>
                                    <p className="account-number">123-456789-00</p>
                                    <MuiButton variant="outlined" size="small" startIcon={<QrCode />} onClick={() => setShowQr(!showQr)} sx={{ mt: 2, textTransform: 'none' }}>{showQr ? 'Ocultar QR' : 'Mostrar QR para Pagar'}</MuiButton>
                                    {showQr && <div className="qr-container"><img src={qrBancolombia} alt="Código QR para pago Bancolombia" className="qr-image" /><p className="qr-text">Escanea para pagar</p></div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Opcional: ¿Ya tienes el comprobante? Súbelo aquí para agilizar el proceso.</label>
                                    <div className="preview-gallery">
                                        {previewComprobantes.map((previewUrl, index) => (
                                            <div key={index} className="preview-container">
                                                <button type="button" onClick={() => handleRemoveComprobante(index)} className="remove-preview-button"><X size={16}/></button>
                                               <img
  src={previewUrl}
  alt={`Comprobante ${index + 1}`}
  className="preview-image"
  onClick={() => setSelectedImage(previewUrl)}
  style={{ cursor: "pointer" }}
/>

                                            </div>
                                        ))}
                                    </div>
                                    <label htmlFor="comprobantes" className={`file-drop-zone ${errors.comprobantes ? 'input-error' : ''}`}>
                                        <UploadCloud size={32} />
                                        <span>Haz clic o arrastra una o más imágenes</span>
                                        <input type="file" id="comprobantes" className="file-input-hidden" accept="image/*" onChange={handleFileChange} multiple />
                                    </label>
                                    {errors.comprobantes && <p className="error-text">{errors.comprobantes}</p>}
                                </div>
                            </div>
                        )}
                        {montoPagoAdicional === 0 && usarCredito && (<Alert severity="success">El total de tu pedido será cubierto con tu crédito. No se requiere pago adicional.</Alert>)}
                    </form>
                </div>

                <div className="summary-column">
                    <div className="card summary-card">
                        <h2 className="card-title">Resumen</h2>
                        <ul className="resumen-lista">
                            {cart.map((item) => (<li key={item.id} className="resumen-item"><img src={item.imagen_url || "/placeholder.svg"} alt={item.nombre} className="resumen-item-image" /><div className="resumen-item-info"><span className="resumen-item-name">{item.nombre} (x{item.quantity})</span><span className="resumen-item-price">{formatCurrency(item.price * item.quantity)}</span></div></li>))}
                        </ul>
                        <div className="resumen-total-section">
                             <div className="resumen-line"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
                             <div className="resumen-line"><span>IVA (19%)</span><span>{formatCurrency(cartIva)}</span></div>
                             {usarCredito && (<div className="resumen-line credit-line"><span>Crédito Aplicado</span><span>- {formatCurrency(cartTotal)}</span></div>)}
                             <div className="resumen-total"><span>Total</span><span className="resumen-total-monto">{formatCurrency(usarCredito ? 0 : cartTotal)}</span></div>
                        </div>
                        
                        <div className="submit-container-multiple">
                            <button 
                                type="button" 
                                className="secondary-button quote-button" 
                                disabled={isSubmitting || isCreatingQuote || cart.length === 0} 
                                onClick={handleCrearCotizacion}
                            >
                                {isCreatingQuote ? <Loader2 className="animate-spin" /> : <><FileText size={18}/> Guardar Cotización</>}
                            </button>
                            <button 
                                type="submit" 
                                form="pago-form" 
                                className="submit-button" 
                                disabled={isSubmitting || isCreatingQuote || cart.length === 0}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Pedido"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
{selectedImage && (
  <div className="image-modal" onClick={() => setSelectedImage(null)}>
    <span className="close-btn">&times;</span>
    <img src={selectedImage} alt="Vista ampliada" className="modal-image" />
  </div>
)}

        </div>

    );
}