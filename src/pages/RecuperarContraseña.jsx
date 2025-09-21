import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RecuperarContraseña.css";

const RecuperarContrasena = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-page', 'recover');
    return () => document.body.removeAttribute('data-page');
  }, []);

  const validateEmail = (email) => {
    if (email === "" && emailValid === null) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value));
    setError("");
    setSuccess("");
  };

  const getInputClasses = () => {
    const baseClass = "recover-input";
    if (emailValid === null) return baseClass;
    return emailValid ? `${baseClass} valid` : `${baseClass} invalid`;
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validación del correo
    if (!email.trim()) {
      setError("Por favor ingrese su correo electrónico");
      setEmailValid(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor ingrese un correo electrónico válido");
      setEmailValid(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('${API_BASE_URL}/auth/password/reset/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }), // 'email' es el nombre correcto del campo
        });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Se ha enviado un correo con las instrucciones para recuperar tu contraseña");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.error || "No se pudo enviar el correo de recuperación");
      }
    } catch (error) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      setError("No se pudo conectar al servidor. Intente más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recover-container">
      <div className="recover-card">
        <div className="recover-info">
          <div className="recover-branding">
            <div className="logo">
              <span className="logo-icon">🏪</span>
              <span className="logo-text">ConstruSys</span>
            </div>
            <h1>Recuperar Contraseña</h1>
            <p>
              Ingresa tu correo electrónico y te enviaremos las instrucciones 
              para restablecer tu contraseña de forma segura.
            </p>
          </div>
          
          <div className="info-bottom">
            <div className="recover-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🔐</span>
                <span>Proceso seguro</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📧</span>
                <span>Instrucciones por email</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⚡</span>
                <span>Rápido y sencillo</span>
              </div>
            </div>
            
            <div className="login-prompt">
              <span>¿Recordaste tu contraseña?</span>
              <button className="text-button" onClick={() => navigate("/login")}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
        
        <div className="recover-form-container">
          <form onSubmit={handleRecuperar} className="recover-form" noValidate>
            <div className="form-header">
              <h2>Recuperar Acceso</h2>
              <p>Te ayudamos a recuperar el acceso a tu cuenta</p>
            </div>
            
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✅ {success}</div>}
            
            <div className="form-group">
              <label className="recover-label" htmlFor="email">
                Correo electrónico
                <span className="required-asterisk">*</span>
              </label>
              <div className="input-container">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={getInputClasses()}
                  placeholder="ejemplo@correo.com"
                  disabled={isLoading}
                />
                {emailValid === false && 
                  <span className="field-error">Correo electrónico no válido</span>
                }
              </div>
            </div>
            
            <button 
              type="submit" 
              className={`recover-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !emailValid}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Enviar Instrucciones</span>
                  <span className="button-icon">📧</span>
                </>
              )}
            </button>
            
            <div className="recover-additional-options">
              <button 
                type="button"
                className="secondary-button"
                onClick={() => navigate("/login")}
              >
                <span className="button-icon">←</span>
                Volver a Iniciar Sesión
              </button>
              
              <button 
                type="button"
                className="secondary-button"
                onClick={() => navigate("/register")}
              >
                <span>¿No tienes cuenta?</span>
                <span className="button-text-accent">Crear una</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecuperarContrasena;