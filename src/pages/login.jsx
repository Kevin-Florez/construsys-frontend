import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        correo: "",
        password: ""
    });
    const [validFields, setValidFields] = useState({
        correo: null,
        password: null
    });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const params = new URLSearchParams(location.search);
    const vieneDeCheckout = params.get('redirect') === '/checkout';

    useEffect(() => {
        document.body.setAttribute("data-page", "login");
        return () => document.body.removeAttribute("data-page");
    }, []);

    const validateField = (name, value) => {
        if (value === "" && validFields[name] === null) return null;
        switch (name) {
            case "correo":
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case "password":
                return value.length >= 1;
            default:
                return true;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setValidFields(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const getInputClasses = (fieldName) => {
        const baseClass = "login-input";
        if (validFields[fieldName] === null) return baseClass;
        return validFields[fieldName] ? `${baseClass} valid` : `${baseClass} invalid`;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const updatedValidFields = {
            correo: validateField("correo", formData.correo),
            password: validateField("password", formData.password)
        };
        setValidFields(updatedValidFields);
        if (Object.values(updatedValidFields).some(isValid => !isValid)) {
            setError("⚠️ Por favor complete correctamente todos los campos");
            return;
        }
        
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    correo: formData.correo, 
                    password: formData.password 
                }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.message || "Correo o contraseña incorrectos");
            }
            
            // ✨ CORRECCIÓN CLAVE:
            // La lógica de redirección se delega completamente al AuthContext.
            // Simplemente llamamos a la función login y ella se encargará de todo.
            login(data);

            // Opcional: Mostrar un mensaje de éxito. La redirección será casi instantánea.
            setSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");

        } catch (error) {
            setError(`⚠️ ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-info">
                    <div className="login-branding">
                        <div className="logo">
                            <span className="logo-icon">🏪</span>
                            <span className="logo-text">Depósito y Ferretería del Sur</span>
                        </div>
                        <h1>Bienvenido de nuevo</h1>
                        <p>Inicia sesión para acceder a nuestro catálogo de productos, hacer pedidos y más.</p>
                    </div>
                    
                    <div className="info-bottom">
                        <div className="login-benefits">
                            <div className="benefit-item"><span className="benefit-icon">🔒</span><span>Seguridad garantizada</span></div>
                            <div className="benefit-item"><span className="benefit-icon">⚡</span><span>Proceso rápido</span></div>
                            <div className="benefit-item"><span className="benefit-icon">🎁</span><span>Ofertas exclusivas</span></div>
                        </div>
                        
                        <div className="register-prompt">
                            <span>¿No tienes una cuenta?</span>
                            <button className="text-button" onClick={() => navigate("/register")}>
                                Crear Cuenta
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="login-form-container">
                    {vieneDeCheckout ? (
                        <button className="back-to-home-button" onClick={() => navigate(-1)}>
                            ‹ Volver Atrás
                        </button>
                    ) : (
                        <button className="back-to-home-button" onClick={() => navigate("/")}>
                            ‹ Volver al Inicio
                        </button>
                    )}
                    
                    <form onSubmit={handleLogin} className="login-form" noValidate>
                        <h2>Iniciar Sesión</h2>
                        {error && <div className="error-message">{error}</div>}
                        {successMessage && <div className="success-message">{successMessage}</div>}
                        
                        <div className="form-group">
                            <label className="login-label" htmlFor="correo">
                                Correo electrónico <span className="required-asterisk">*</span>
                            </label>
                            <div className="input-container">
                                <input
                                    id="correo"
                                    name="correo"
                                    type="email"
                                    value={formData.correo}
                                    onChange={handleChange}
                                    className={getInputClasses("correo")}
                                    placeholder="ejemplo@correo.com"
                                />
                                {validFields.correo === false && 
                                    <span className="field-error">Correo no válido</span>
                                }
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="login-label" htmlFor="password">
                                Contraseña <span className="required-asterisk">*</span>
                            </label>
                            <div className="input-container">
                                <input 
                                    id="password"
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className={getInputClasses("password")}
                                    placeholder="Ingrese su contraseña"
                                />
                                <span 
                                    onClick={togglePasswordVisibility} 
                                    className="password-toggle-icon"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && togglePasswordVisibility()}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </span>
                            </div>
                            {validFields.password === false && 
                                <span className="field-error">Este campo es obligatorio</span>
                            }
                        </div>
                        
                        <div className="forgot-password">
                            <span className="forgot-link" onClick={() => navigate("/recuperar-contraseña")}>
                                ¿Olvidaste tu contraseña?
                            </span>
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <span className="button-icon">→</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;