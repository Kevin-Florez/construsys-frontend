// src/pages/Register.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✨ 1. Importamos el hook de autenticación
import "../styles/Register.css";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth(); // ✨ 2. Obtenemos la función de login del contexto

    const params = new URLSearchParams(location.search);
    const vieneDeCheckout = params.get('redirect');

    const [formData, setFormData] = useState({
        nombre: "", apellido: "", correo: "", telefono: "",
        tipo_documento: "CC", documento: "", direccion: "",
        password: "", password2: ""
    });

    const [fieldErrors, setFieldErrors] = useState({
        nombre: "", apellido: "", correo: "", telefono: "",
        documento: "", direccion: "", password: "", password2: ""
    });

    const [touchedFields, setTouchedFields] = useState({});
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        document.body.setAttribute('data-page', 'register');
        return () => document.body.removeAttribute('data-page');
    }, []);

    const evaluatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        setPasswordStrength(strength);
    };

    const validateField = (name, value, currentFormData = formData) => {
        if (!value.trim()) return "Este campo es obligatorio.";
        switch (name) {
            case "nombre":
            case "apellido":
                return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim()) ? "" : "Solo debe contener letras y espacios.";
            case "correo":
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "El formato del correo no es válido.";
            case "telefono":
                return /^[0-9]{7,15}$/.test(value) ? "" : "El teléfono debe contener entre 7 y 15 dígitos.";
            case "documento":
                return /^[0-9]{6,20}$/.test(value) ? "" : "El documento debe contener entre 6 y 20 dígitos.";
            case "direccion":
                return value.trim().length >= 3 ? "" : "La dirección debe tener al menos 3 caracteres.";
            case "password":
                return value.length >= 8 ? "" : "La contraseña debe tener al menos 8 caracteres.";
            case "password2":
                return value === currentFormData.password ? "" : "Las contraseñas no coinciden.";
            default:
                return "";
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === "nombre" || name === "apellido") {
            processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        } else if (name === "telefono" || name === "documento") {
            processedValue = value.replace(/[^0-9]/g, "");
        }
        if (name === "password") {
            evaluatePasswordStrength(processedValue);
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: "" }));
        }
        if (error) setError("");
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
        const errorMessage = validateField(name, value, formData);
        setFieldErrors(prev => ({ ...prev, [name]: errorMessage }));
    };

    const getInputClasses = (fieldName) => {
        const baseClass = "register-input";
        const isTouched = touchedFields[fieldName];
        if (fieldErrors[fieldName]) return `${baseClass} invalid`;
        if (isTouched && !fieldErrors[fieldName] && formData[fieldName]) return `${baseClass} valid`;
        return baseClass;
    };

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

    const handleNextStep = async () => {
        // (Lógica de validación de pasos sin cambios)
        setError("");
        const fieldsToValidate = currentStep === 1 ? ["nombre", "apellido", "tipo_documento", "documento"] : ["correo", "telefono", "direccion"];
        let isStepValid = true;
        const newFieldErrors = {};
        const newTouchedFields = { ...touchedFields };

        fieldsToValidate.forEach(field => {
            const errorMsg = validateField(field, formData[field], formData);
            newTouchedFields[field] = true;
            if (errorMsg) {
                newFieldErrors[field] = errorMsg;
                isStepValid = false;
            } else {
                newFieldErrors[field] = "";
            }
        });

        setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
        setTouchedFields(newTouchedFields);

        if (!isStepValid) {
            setError("⚠️ Por favor complete correctamente todos los campos de este paso.");
            return;
        }

        setIsLoading(true);
        try {
            if (currentStep === 1) {
                const checkDocResponse = await fetch('${API_BASE_URL}/auth/check-documento/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo_documento: formData.tipo_documento, documento: formData.documento }),
                });
                if (checkDocResponse.status === 409) {
                    const errorData = await checkDocResponse.json();
                    setFieldErrors(prev => ({ ...prev, documento: errorData.error || "Este documento ya está registrado." }));
                    setError("⚠️ Por favor corrija los errores marcados.");
                    setIsLoading(false);
                    return;
                } else if (!checkDocResponse.ok) { throw new Error("Error al verificar el documento."); }
            }
            if (currentStep === 2) {
                const checkEmailResponse = await fetch('${API_BASE_URL}/auth/check-email/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: formData.correo }),
                });
                if (checkEmailResponse.status === 409) {
                    const errorData = await checkEmailResponse.json();
                    setFieldErrors(prev => ({ ...prev, correo: errorData.error || "Este correo electrónico ya está registrado." }));
                    setError("⚠️ Por favor corrija los errores marcados.");
                    setIsLoading(false);
                    return;
                } else if (!checkEmailResponse.ok) { throw new Error("Error al verificar el correo."); }
            }
            setError("");
            setCurrentStep(currentStep + 1);
        } catch (networkError) {
            setError("⚠️ No se pudo conectar al servidor para verificar los datos. Intente más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrevStep = () => {
        setError("");
        setCurrentStep(currentStep - 1);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        // (Lógica de validación final sin cambios)
        const allFields = Object.keys(formData);
        let isFormValid = true;
        const newFieldErrors = {};
        allFields.forEach(field => {
            const errorMsg = validateField(field, formData[field], formData);
            if (errorMsg) {
                newFieldErrors[field] = errorMsg;
                isFormValid = false;
            }
        });
        setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
        if (!isFormValid) {
            setError("⚠️ Por favor complete correctamente todos los campos.");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        
        try {
            const response = await fetch("${API_BASE_URL}/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                const errorValues = Object.values(data).flat();
                throw new Error(errorValues.join(' '));
            }
            
            // ✨ 3. Usamos la función login del contexto en lugar de localStorage
            login(data);

            setSuccessMessage("✅ ¡Registro exitoso! Iniciando sesión y redirigiendo...");
            
            setTimeout(() => {
                const params = new URLSearchParams(location.search);
                const redirectPath = params.get('redirect');
                const targetUrl = redirectPath || '/inicio-cliente';
                navigate(targetUrl, { replace: true });
            }, 2000);
        } catch (error) {
            setError(`⚠️ ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // (El resto de la lógica de renderizado se mantiene igual)
    const renderStep = () => {
        switch(currentStep) {
            case 1: 
                return (
                    <>
                        <div className="form-step-title"><span className="step-number">1</span><h3>Datos Personales</h3></div>
                        <div className="form-row">
                                <div className="form-group">
                                    <label className="register-label" htmlFor="tipo_documento">Tipo de Documento <span className="required-asterisk">*</span></label>
                                    <select id="tipo_documento" name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} onBlur={handleBlur} className="register-input register-select">
                                        <option value="CC">Cédula de Ciudadanía</option>
                                        <option value="TI">Tarjeta de Identidad</option>
                                        <option value="CE">Cédula de Extranjería</option>
                                        <option value="PAS">Pasaporte</option>
                                        <option value="RC">Registro Civil</option>
                                        <option value="PPT">Permiso por Protección Temporal</option>
                                        <option value="NIT">NIT</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="register-label" htmlFor="documento">Número de Documento <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper">
                                        <input id="documento" name="documento" type="text" inputMode="numeric" value={formData.documento} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("documento")} placeholder="Ej. 1234567890" maxLength={20} />
                                    </div>
                                    {fieldErrors.documento && <span className="field-error">{fieldErrors.documento}</span>}
                                </div>
                            </div>
                        <div className="form-fields-grid">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="register-label" htmlFor="nombre">Nombres <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper">
                                        <input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("nombre")} placeholder="Ingrese sus nombres" maxLength={50} />
                                    </div>
                                    {fieldErrors.nombre && <span className="field-error">{fieldErrors.nombre}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="register-label" htmlFor="apellido">Apellidos <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper">
                                        <input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("apellido")} placeholder="Ingrese sus apellidos" maxLength={50} />
                                    </div>
                                    {fieldErrors.apellido && <span className="field-error">{fieldErrors.apellido}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="form-navigation">
                            <div></div>
                            <button type="button" className="next-button" onClick={handleNextStep} disabled={isLoading}>
                                {isLoading ? <><span className="spinner-small"></span> Verificando...</> : <>Siguiente <span className="button-icon">→</span></>}
                            </button>
                        </div>
                    </>
                );
            case 2: 
                return (
                    <>
                        <div className="form-step-title"><span className="step-number">2</span><h3>Datos de Contacto</h3></div>
                        <div className="form-fields-grid">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="register-label" htmlFor="correo">Correo electrónico <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper">
                                        <input id="correo" name="correo" type="email" value={formData.correo} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("correo")} placeholder="ejemplo@correo.com" />
                                    </div>
                                    {fieldErrors.correo && <span className="field-error">{fieldErrors.correo}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="register-label" htmlFor="telefono">Teléfono <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper">
                                        <input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("telefono")} placeholder="Ej. 3012345678" maxLength={15} />
                                    </div>
                                    {fieldErrors.telefono && <span className="field-error">{fieldErrors.telefono}</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="register-label" htmlFor="direccion">Dirección <span className="required-asterisk">*</span></label>
                                <div className="input-wrapper">
                                    <input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("direccion")} placeholder="Ej. Calle 123 # 45-67" />
                                </div>
                                {fieldErrors.direccion && <span className="field-error">{fieldErrors.direccion}</span>}
                            </div>
                        </div>
                        <div className="form-navigation">
                            <button type="button" className="prev-button" onClick={handlePrevStep}><span className="button-icon">←</span> Anterior</button>
                            <button type="button" className="next-button" onClick={handleNextStep} disabled={isLoading}>
                                {isLoading ? <><span className="spinner-small"></span> Verificando...</> : <>Siguiente <span className="button-icon">→</span></>}
                            </button>
                        </div>
                    </>
                );
            case 3: 
                return (
                        <>
                            <div className="form-step-title"><span className="step-number">3</span><h3>Seguridad de la Cuenta</h3></div>
                            <div className="form-fields-grid">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="register-label" htmlFor="password">Contraseña <span className="required-asterisk">*</span></label>
                                        <div className="input-wrapper">
                                            <input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("password")} placeholder="Mínimo 8 caracteres" />
                                            <span onClick={togglePasswordVisibility} className="password-toggle-icon" role="button">
                                                {showPassword ? '🙈' : '👁️'}
                                            </span>
                                        </div>
                                        {formData.password && (
                                            <div className="password-strength">
                                                <div className="strength-meter"><div className={`strength-value strength-${passwordStrength}`} style={{ width: `${passwordStrength * 25}%` }}></div></div>
                                                <span className="strength-text">{["", "Débil", "Moderada", "Fuerte", "Muy Fuerte"][passwordStrength]}</span>
                                            </div>
                                        )}
                                        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="register-label" htmlFor="password2">Confirmar Contraseña <span className="required-asterisk">*</span></label>
                                        <div className="input-wrapper">
                                            <input id="password2" name="password2" type={showConfirmPassword ? "text" : "password"} value={formData.password2} onChange={handleChange} onBlur={handleBlur} className={getInputClasses("password2")} placeholder="Repita su contraseña"/>
                                            <span onClick={toggleConfirmPasswordVisibility} className="password-toggle-icon" role="button">
                                                {showConfirmPassword ? '🙈' : '👁️'}
                                            </span>
                                        </div>
                                        {fieldErrors.password2 && <span className="field-error">{fieldErrors.password2}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="form-navigation">
                                <button type="button" className="prev-button" onClick={handlePrevStep}><span className="button-icon">←</span> Anterior</button>
                                <button type="submit" className={`register-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                                    {isLoading ? (<><span className="spinner"></span> <span>Procesando...</span></>) : (<><span>Crear Cuenta</span> <span className="button-icon">✓</span></>)}
                                </button>
                            </div>
                        </>
                );
            default: return null;
        }
    };
    
    const renderStepIndicator = () => (
        <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-icon">1</div> <span className="step-label">Datos Personales</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-icon">2</div> <span className="step-label">Contacto</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-icon">3</div> <span className="step-label">Seguridad</span>
            </div>
        </div>
    );

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-info">
                    <div className="register-branding">
                        <div className="logo">
                            <span className="logo-icon">🏪</span> <span className="logo-text">Depósito y Ferretería del Sur</span>
                        </div>
                        <h1>Únete a nosotros</h1>
                        <p>Crear una cuenta te permitirá acceder a nuestro catálogo de productos y hacer pedidos.</p>
                    </div>
                    <div className="info-bottom">
                        <div className="register-benefits">
                            <div className="benefit-item"><span className="benefit-icon">🔒</span> <span>Seguridad garantizada</span></div>
                            <div className="benefit-item"><span className="benefit-icon">⚡</span> <span>Proceso rápido</span></div>
                            <div className="benefit-item"><span className="benefit-icon">🎁</span> <span>Ofertas exclusivas</span></div>
                        </div>
                        <div className="login-prompt">
                            <span>¿Ya tienes una cuenta?</span>
                            <button className="text-button" onClick={() => navigate("/login")}>Iniciar Sesión</button>
                        </div>
                    </div>
                </div>
                 <div className="register-form-container">
                    <form onSubmit={handleRegister} className="register-form" noValidate>
                        <h2>Crear Cuenta</h2>
                        {vieneDeCheckout ? (
                            <button type="button" className="back-to-home-button" onClick={() => navigate(-1)}>
                                ‹ Volver Atrás
                            </button>
                        ) : (
                            <button type="button" className="back-to-home-button" onClick={() => navigate("/")}>
                                ‹ Volver al Inicio
                            </button>
                        )}
                        
                        {renderStepIndicator()}
                        {error && <div className="error-message">{error}</div>}
                        {successMessage && <div className="success-message">{successMessage}</div>}
                        {renderStep()}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;