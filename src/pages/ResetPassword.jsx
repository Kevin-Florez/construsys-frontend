import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/ResetPassword.css";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: "",
    password2: ""
  });

  const [validFields, setValidFields] = useState({
    password: null,
    password2: null
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Estados para la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-page', 'reset-password');
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

  const validateField = (name, value) => {
    if (value === "" && validFields[name] === null) return null;
    
    switch (name) {
      case "password":
        return value.length >= 8;
      case "password2":
        return value === formData.password && value !== "";
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "password") {
      evaluatePasswordStrength(value);
    }

    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    const isCurrentFieldValid = validateField(name, value);
    setValidFields(prev => ({
      ...prev,
      [name]: isCurrentFieldValid
    }));
    
    if (name === "password") {
      setValidFields(prev => ({
        ...prev,
        password2: validateField("password2", formData.password2) // Revalidar confirmación si la contraseña principal cambia
      }));
    } else if (name === "password2") {
        // La validación de password2 ya se hace con su propio valor y formData.password
    }
  };

  const getInputClasses = (fieldName) => {
    const baseClass = "reset-input";
    if (validFields[fieldName] === null) return baseClass;
    return validFields[fieldName] ? `${baseClass} valid` : `${baseClass} invalid`;
  };

  // Funciones para conmutar la visibilidad de las contraseñas
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const fieldsToValidate = ["password", "password2"];
    let allClientFieldsValid = true;
    const updatedValidFields = { ...validFields };

    fieldsToValidate.forEach(field => {
      const isValid = validateField(field, formData[field]);
      updatedValidFields[field] = isValid;
      if (!isValid) allClientFieldsValid = false;
    });
    setValidFields(updatedValidFields);
    
    if (!allClientFieldsValid) {
      setError("⚠️ Por favor complete correctamente todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      // BIEN ✅ (Apunta a la nueva ruta unificada que creamos)
        const response = await fetch(`${API_BASE_URL}/auth/password/reset/confirm/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password_nuevo: formData.password,
          password_nuevo_confirmacion: formData.password2
        }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error al parsear respuesta JSON:", parseError, responseText);
        setError(response.status >= 400 && response.status < 500 ? "⚠️ Petición incorrecta o token inválido/expirado." : "⚠️ Error inesperado del servidor.");
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        setSuccessMessage(data.message || "✅ Su contraseña ha sido restablecida exitosamente. Redirigiendo al inicio de sesión...");
        setFormData({ password: "", password2: "" });
        setValidFields({ password: null, password2: null });
        setPasswordStrength(0);
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          const errors = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(" ");
          setError(`⚠️ Error al restablecer: ${errors || 'Revise los datos.'}`);
        } else if (data && data.detail) {
           setError(`⚠️ Error: ${data.detail}`);
        } else if (data && data.message) {
           setError(`⚠️ Error: ${data.message}`);
        } else {
          setError(`⚠️ Error al restablecer. El token puede ser inválido o haber expirado.`);
        }
      }
    } catch (networkError) {
      console.error("Error de red:", networkError);
      setError("⚠️ No se pudo conectar al servidor. Intente más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-info">
          <div className="reset-branding">
            <div className="logo">
              <span className="logo-icon">🔐</span>
              <span className="logo-text">ConstruSys</span>
            </div>
            <h1>Nueva Contraseña</h1>
            <p>Ingrese su nueva contraseña para restablecer el acceso a su cuenta.</p>
          </div>
          
          <div className="info-bottom">
            <div className="reset-tips">
              <div className="tip-item"><span className="tip-icon">🔒</span><span>Mínimo 8 caracteres</span></div>
              <div className="tip-item"><span className="tip-icon">🔤</span><span>Incluye mayúsculas</span></div>
              <div className="tip-item"><span className="tip-icon">🔢</span><span>Incluye números</span></div>
              <div className="tip-item"><span className="tip-icon">🔣</span><span>Incluye símbolos</span></div>
            </div>
            <div className="login-prompt">
              <span>¿Recordaste tu contraseña?</span>
              <button className="text-button" onClick={() => navigate("/login")}>Iniciar Sesión</button>
            </div>
          </div>
        </div>
        
        <div className="reset-form-container">
          <form onSubmit={handleResetPassword} className="reset-form" noValidate>
            <h2>Restablecer Contraseña</h2>
            
            <div className="security-notice">
              <span className="security-icon">🛡️</span>
              <p>Su nueva contraseña debe ser segura y diferente a las anteriores</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            <div className="form-group">
              <label className="reset-label" htmlFor="password">
                Nueva Contraseña <span className="required-asterisk">*</span>
              </label>
              <div className="input-container"> {/* Contenedor solo para input e icono */}
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={handleChange} 
                  className={getInputClasses("password")}
                  placeholder="Mínimo 8 caracteres"
                  aria-describedby={formData.password ? "password-strength-indicator-reset password-error-message-reset" : "password-error-message-reset"}
                />
                <span 
                  onClick={togglePasswordVisibility} 
                  className="password-toggle-icon"
                  role="button"
                  tabIndex={0}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && togglePasswordVisibility()}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div> {/* Fin de input-container */}

              {/* Indicador de fortaleza y error, fuera de input-container */}
              {formData.password && (
                <div className="password-strength" id="password-strength-indicator-reset">
                  <div className="strength-meter">
                    <div 
                      className={`strength-value strength-${passwordStrength}`} 
                      style={{ width: `${passwordStrength * 25}%` }}
                      role="meter"
                      aria-valuenow={passwordStrength}
                      aria-valuemin="0"
                      aria-valuemax="4"
                      aria-label={`Fortaleza de la contraseña: ${
                        passwordStrength === 0 ? "Muy débil" :
                        passwordStrength === 1 ? "Débil" :
                        passwordStrength === 2 ? "Moderada" :
                        passwordStrength === 3 ? "Fuerte" : "Muy fuerte"
                      }`}
                    ></div>
                  </div>
                  <span className="strength-text">
                    {passwordStrength === 0 && "Muy débil"}
                    {passwordStrength === 1 && "Débil"}
                    {passwordStrength === 2 && "Moderada"}
                    {passwordStrength === 3 && "Fuerte"}
                    {passwordStrength === 4 && "Muy fuerte"}
                  </span>
                </div>
              )}
              {validFields.password === false && <span className="field-error" id="password-error-message-reset">Mínimo 8 caracteres</span>}
            </div>

            <div className="form-group">
              <label className="reset-label" htmlFor="password2">
                Confirmar Nueva Contraseña <span className="required-asterisk">*</span>
              </label>
              <div className="input-container"> {/* Contenedor solo para input e icono */}
                <input 
                  id="password2"
                  name="password2" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={formData.password2} 
                  onChange={handleChange} 
                  className={getInputClasses("password2")}
                  placeholder="Repita su nueva contraseña"
                  aria-describedby="password2-error-message-reset"
                />
                <span 
                  onClick={toggleConfirmPasswordVisibility} 
                  className="password-toggle-icon"
                  role="button"
                  tabIndex={0}
                  aria-pressed={showConfirmPassword}
                  aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleConfirmPasswordVisibility()}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div> {/* Fin de input-container */}

              {/* Error, fuera de input-container */}
              {validFields.password2 === false && <span className="field-error" id="password2-error-message-reset">Las contraseñas no coinciden</span>}
            </div>
            
            <button 
              type="submit" 
              className={`reset-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Restableciendo...</span>
                </>
              ) : (
                <>
                  <span>Restablecer Contraseña</span>
                  <span className="button-icon">🔑</span>
                </>
              )}
            </button>
            
            <div className="form-footer">
              <button type="button" className="back-link" onClick={() => navigate("/login")}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;