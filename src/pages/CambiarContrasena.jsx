import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✨ 1. Importamos el hook useAuth
import "../styles/CambiarContrasena.css";

const API_BASE_URL = "http://localhost:8000";

const CambiarContrasena = () => {
    const navigate = useNavigate();
    // ✨ 2. Obtenemos los datos de autenticación del contexto
    const { authTokens, user } = useAuth();

    const [formData, setFormData] = useState({
        passwordActual: "",
        passwordNuevo: "",
        passwordNuevoConfirmacion: ""
    });
    const [validFields, setValidFields] = useState({
        passwordActual: null,
        passwordNuevo: null,
        passwordNuevoConfirmacion: null
    });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPasswordActual, setShowPasswordActual] = useState(false);
    const [showPasswordNuevo, setShowPasswordNuevo] = useState(false);
    const [showPasswordNuevoConfirmacion, setShowPasswordNuevoConfirmacion] = useState(false);

    useEffect(() => {
        document.body.setAttribute('data-page', 'cp-page');
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

    const validateField = (name, value, currentFormData) => {
        if (!value) return name !== "passwordActual"; // Solo la actual puede estar vacía inicialmente
        switch (name) {
            case "passwordActual":
                return value.length > 0;
            case "passwordNuevo":
                return value.length >= 8;
            case "passwordNuevoConfirmacion":
                return value === currentFormData.passwordNuevo;
            default:
                return true;
        }
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => {
            const updatedFormData = { ...prevData, [name]: value };
            
            // Actualizar la validación del campo actual
            setValidFields(prevValid => ({
                ...prevValid,
                [name]: validateField(name, value, updatedFormData)
            }));
    
            // Si cambiamos la nueva contraseña, re-validamos la confirmación
            if (name === "passwordNuevo") {
                setValidFields(prevValid => ({
                    ...prevValid,
                    passwordNuevoConfirmacion: validateField("passwordNuevoConfirmacion", updatedFormData.passwordNuevoConfirmacion, updatedFormData)
                }));
                evaluatePasswordStrength(value);
            }
            
            return updatedFormData;
        });
    };

    const getInputClasses = (fieldName) => {
        const baseClass = "cp-input";
        if (validFields[fieldName] === null) return baseClass;
        return validFields[fieldName] ? `${baseClass} valid` : `${baseClass} invalid`;
    };

    const togglePasswordActualVisibility = () => setShowPasswordActual(prev => !prev);
    const togglePasswordNuevoVisibility = () => setShowPasswordNuevo(prev => !prev);
    const togglePasswordNuevoConfirmacionVisibility = () => setShowPasswordNuevoConfirmacion(prev => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        let allFieldsValid = true;
        const updatedValidFields = {};
        for (const field in formData) {
            const isValid = validateField(field, formData[field], formData);
            updatedValidFields[field] = isValid;
            if (!isValid) allFieldsValid = false;
        }
        setValidFields(updatedValidFields);
        
        if (!allFieldsValid) {
            setError("⚠️ Por favor complete correctamente todos los campos");
            return;
        }

        setIsLoading(true);
        // ✨ 3. Usamos el token del contexto
        const token = authTokens?.access;
        if (!token) {
            setError("⚠️ No autenticado. Por favor, inicie sesión.");
            setIsLoading(false);
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/perfil/cambiar-password/`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    password_actual: formData.passwordActual,
                    password_nuevo: formData.passwordNuevo,
                    password_nuevo_confirmacion: formData.passwordNuevoConfirmacion,
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                let errorMessage = "⚠️ No se pudo cambiar la contraseña.";
                if (data.error) errorMessage = `⚠️ ${data.error}`;
                else if (data.detail) errorMessage = `⚠️ ${data.detail}`;
                else if (typeof data === 'object') {
                    const fieldErrors = Object.values(data).flat().join(" ");
                    if (fieldErrors) errorMessage = `⚠️ ${fieldErrors}`;
                }
                throw new Error(errorMessage);
            }

            setSuccessMessage("✅ Contraseña cambiada exitosamente. Serás redirigido...");
            
            setTimeout(() => {
                const userRol = user?.rol; // Obtenemos el rol del contexto
                navigate(userRol === "Cliente" ? "/inicio-cliente" : "/dashboard");
            }, 2500);

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="cp-container">
            <div className="cp-card">
                <form onSubmit={handleSubmit} className="cp-form" noValidate>
                    <h2 className="cp-title">Cambiar Contraseña</h2>
                    
                    {error && <div className="cp-error-message">{error}</div>}
                    {successMessage && <div className="cp-success-message">{successMessage}</div>}
                    
                    <div className="cp-form-group">
                        <label className="cp-label" htmlFor="passwordActual">Contraseña Actual <span className="cp-required-asterisk">*</span></label>
                        <div className="cp-input-container">
                            <input
                                id="passwordActual" name="passwordActual"
                                type={showPasswordActual ? "text" : "password"}
                                value={formData.passwordActual} onChange={handleChange}
                                className={getInputClasses("passwordActual")}
                                placeholder="Ingrese su contraseña actual"
                            />
                            <span onClick={togglePasswordActualVisibility} className="password-toggle-icon" role="button" tabIndex={0}>
                                {showPasswordActual ? "🙈" : "👁️"}
                            </span>
                        </div>
                        {validFields.passwordActual === false && <span className="cp-field-error">Este campo es obligatorio</span>}
                    </div>

                    <div className="cp-form-group">
                        <label className="cp-label" htmlFor="passwordNuevo">Nueva Contraseña <span className="cp-required-asterisk">*</span></label>
                        <div className="cp-input-container">
                            <input
                                id="passwordNuevo" name="passwordNuevo"
                                type={showPasswordNuevo ? "text" : "password"}
                                value={formData.passwordNuevo} onChange={handleChange}
                                className={getInputClasses("passwordNuevo")}
                                placeholder="Mínimo 8 caracteres"
                            />
                            <span onClick={togglePasswordNuevoVisibility} className="password-toggle-icon" role="button" tabIndex={0}>
                                {showPasswordNuevo ? "🙈" : "👁️"}
                            </span>
                        </div>
                        {validFields.passwordNuevo === false && <span className="cp-field-error">Mínimo 8 caracteres</span>}
                        {formData.passwordNuevo && (
                            <div className="cp-password-strength">
                                <div className="cp-strength-meter">
                                    <div className={`cp-strength-value strength-${passwordStrength}`} style={{ width: `${passwordStrength * 25}%` }}></div>
                                </div>
                                <span className="cp-strength-text">
                                    {["", "Débil", "Moderada", "Fuerte", "Muy fuerte"][passwordStrength]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="cp-form-group">
                        <label className="cp-label" htmlFor="passwordNuevoConfirmacion">Confirmar Nueva Contraseña <span className="cp-required-asterisk">*</span></label>
                        <div className="cp-input-container">
                            <input
                                id="passwordNuevoConfirmacion" name="passwordNuevoConfirmacion"
                                type={showPasswordNuevoConfirmacion ? "text" : "password"}
                                value={formData.passwordNuevoConfirmacion} onChange={handleChange}
                                className={getInputClasses("passwordNuevoConfirmacion")}
                                placeholder="Repita su nueva contraseña"
                            />
                            <span onClick={togglePasswordNuevoConfirmacionVisibility} className="password-toggle-icon" role="button" tabIndex={0}>
                                {showPasswordNuevoConfirmacion ? "🙈" : "👁️"}
                            </span>
                        </div>
                        {validFields.passwordNuevoConfirmacion === false && <span className="cp-field-error">Las contraseñas no coinciden</span>}
                    </div>
                    
                    <div className="cp-form-navigation">
                        <button type="submit" className={`cp-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                            {isLoading ? (
                                <> <span className="cp-spinner"></span> <span>Procesando...</span> </>
                            ) : (
                                <> <span>Actualizar Contraseña</span> <span className="cp-button-icon">✓</span> </>
                            )}
                        </button>
                    </div>
                    
                    {!successMessage && (
                        <div className="cp-footer-link">
                            <button type="button" className="cp-text-button" onClick={() => navigate(user?.rol === "Cliente" ? "/inicio-cliente" : "/dashboard")}>
                                Cancelar y volver
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CambiarContrasena;