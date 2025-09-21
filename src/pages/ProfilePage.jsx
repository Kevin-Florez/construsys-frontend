import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import './../styles/ProfilePage.css';

const TIPO_DOCUMENTO_CHOICES = {
    'CC': 'Cédula de Ciudadanía', 'CE': 'Cédula de Extranjería', 'NIT': 'NIT',
    'PAS': 'Pasaporte', 'TI': 'Tarjeta de Identidad', 'RC': 'Registro Civil',
    'PEP': 'Permiso Especial de Permanencia', 'PPT': 'Permiso por Protección Temporal',
};

const ProfilePage = () => {
    // ✅ 1. Obtenemos 'authTokens', 'user' y 'logout' del contexto.
    const { authTokens, user, logout } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(null);
    const [isCliente, setIsCliente] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({
        current_password: '', new_password: '', new_password_confirmation: '',
    });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

    const evaluatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        setPasswordStrength(strength);
    };

    const fetchProfile = useCallback(async () => {
        // ✅ 2. Definimos 'token' aquí adentro usando 'authTokens'
        const token = authTokens?.access;
        if (!token) {
            setLoadingProfile(false);
            return;
        }
        setLoadingProfile(true);
        setProfileError(null);
        setProfileSuccess(null);
        try {
            const response = await axios.get(`${API_URL}/perfil/`, { headers: { Authorization: `Bearer ${token}` } });
            setProfileData(response.data);
            setFormData(response.data);
            setIsCliente(response.data.rol_nombre === 'Cliente');
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err.response?.status === 401) {
                logout();
            } else {
                setProfileError(err.response?.data?.detail || "Error al cargar el perfil.");
            }
        } finally {
            setLoadingProfile(false);
        }
    }, [authTokens, logout]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === (isCliente ? 'nombre' : 'first_name') || name === (isCliente ? 'apellido' : 'last_name')) {
            processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        } else if (name === "telefono") {
            processedValue = value.replace(/[^0-9]/g, "");
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        setProfileSuccess(null);
        setProfileError(null);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const token = authTokens?.access;
        if (!token) return;

        setProfileError(null);
        setProfileSuccess(null);
        setLoadingProfile(true);

        const requiredFields = isCliente
            ? { nombre: "Nombre", apellido: "Apellido", telefono: "Teléfono", direccion: "Dirección" }
            : { first_name: "Nombres", last_name: "Apellidos", telefono: "Teléfono", direccion: "Dirección" };

        for (const field in requiredFields) {
            if (!formData[field] || formData[field].trim() === "") {
                setProfileError(`El campo "${requiredFields[field]}" es requerido.`);
                setLoadingProfile(false);
                return;
            }
        }
        if (formData.telefono && !/^[0-9]{7,15}$/.test(formData.telefono)) {
            setProfileError("Teléfono debe contener entre 7 y 15 dígitos.");
            setLoadingProfile(false);
            return;
        }

        const dataToUpdate = isCliente
            ? { nombre: formData.nombre, apellido: formData.apellido, telefono: formData.telefono, direccion: formData.direccion }
            : { first_name: formData.first_name, last_name: formData.last_name, telefono: formData.telefono, direccion: formData.direccion };
        
        try {
            const response = await axios.put(`${API_URL}/perfil/`, dataToUpdate, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
            setProfileData(response.data);
            setFormData(response.data);
            setProfileSuccess("¡Información del perfil actualizada exitosamente!");
        } catch (err) {
            console.error("Error updating profile:", err);
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const messages = Object.entries(errorData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
                setProfileError(messages || "Error al actualizar.");
            } else {
                setProfileError(errorData || "Error al actualizar.");
            }
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordFormChange = (e) => {
        const { name, value } = e.target;
        if (name === "new_password") {
            evaluatePasswordStrength(value);
        }
        setPasswordFormData(prev => ({ ...prev, [name]: value }));
        setPasswordSuccess(null);
        setPasswordError(null);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const token = authTokens?.access;
        if (!token) return;

        setPasswordError(null);
        setPasswordSuccess(null);
        if (!passwordFormData.current_password) {
             setPasswordError("La contraseña actual es requerida."); return;
        }
        if (passwordFormData.new_password.length < 8) {
            setPasswordError("La nueva contraseña debe tener al menos 8 caracteres."); return;
        }
        if (passwordFormData.new_password !== passwordFormData.new_password_confirmation) {
            setPasswordError("Las nuevas contraseñas no coinciden."); return;
        }
        setLoadingPassword(true);
        try {
            await axios.post(`${API_URL}/perfil/cambiar-password/`, {
                password_actual: passwordFormData.current_password,
                password_nuevo: passwordFormData.new_password,
                password_nuevo_confirmacion: passwordFormData.new_password_confirmation,
            }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
            setPasswordSuccess("¡Contraseña actualizada exitosamente!");
            setPasswordFormData({ current_password: '', new_password: '', new_password_confirmation: '' });
            setPasswordStrength(0);
        } catch (err) {
            console.error("Error updating password:", err);
            const errorData = err.response?.data;
             if (typeof errorData === 'object' && errorData !== null) {
                 const messages = Object.entries(errorData).map(([k, v]) => {
                     const fN = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                     let fieldUserFriendly = fN;
                     if (fN === "Password Actual") fieldUserFriendly = "Contraseña Actual";
                     if (fN === "Password Nuevo") fieldUserFriendly = "Nueva Contraseña";
                     if (fN === "Password Nuevo Confirmacion") fieldUserFriendly = "Confirmar Nueva Contraseña";
                     const msg = Array.isArray(v) ? v.join(', ') : v;
                     return `${fN === 'Detail' ? '' : fieldUserFriendly + ': '}${msg}`;
                 }).join('; ');
                 setPasswordError(messages || "Error al cambiar contraseña.");
            } else {
                setPasswordError(errorData?.detail || errorData || "Error al cambiar contraseña.");
            }
        } finally {
            setLoadingPassword(false);
        }
    };

    const toggleShowCurrentPassword = () => setShowCurrentPassword(prev => !prev);
    const toggleShowNewPassword = () => setShowNewPassword(prev => !prev);
    const toggleShowConfirmNewPassword = () => setShowConfirmNewPassword(prev => !prev);

    if (loadingProfile && !profileData) {
        return <div className="profile-page-wrapper"><div className="profile-container loading-message"><CircularProgress /> Cargando perfil...</div></div>;
    }
    if (profileError && !profileData) {
        return <div className="profile-page-wrapper"><div className="profile-container error-message-global">Error: {profileError}</div></div>;
    }
    if (!profileData) {
        return <div className="profile-page-wrapper"><div className="profile-container">No se pudo cargar el perfil. Intente recargar la página.</div></div>;
    }

    const email = isCliente ? profileData.correo : profileData.email;
    const nombreForm = isCliente ? formData.nombre : formData.first_name;
    const apellidoForm = isCliente ? formData.apellido : formData.last_name;
    const tipoDoc = TIPO_DOCUMENTO_CHOICES[profileData.tipo_documento] || profileData.tipo_documento;
    const numDoc = isCliente ? profileData.documento : profileData.numero_documento;

    const getPasswordStrengthText = (strength) => {
        if (strength === 0 && passwordFormData.new_password.length > 0 && passwordFormData.new_password.length < 8) return "Muy débil (mín. 8 caracteres)";
        if (strength === 0 && passwordFormData.new_password.length === 0) return "";
        if (strength === 0) return "Muy débil";
        if (strength === 1) return "Débil";
        if (strength === 2) return "Moderada";
        if (strength === 3) return "Fuerte";
        if (strength === 4) return "Muy fuerte";
        return "";
    };

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                <h2>Mi Perfil</h2>
                <p className="profile-subtitle">Aquí puedes ver y actualizar tu información personal y de seguridad.</p>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={isCliente ? 7 : 6}>
                        <Paper elevation={0} variant="outlined" className="profile-section-paper">
                            <form onSubmit={handleProfileSubmit} className="profile-form section-form" noValidate>
                                <h3>Información Personal</h3>
                                {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
                                {profileError && <div className="alert alert-danger">{profileError}</div>}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-rol">Rol:</label>
                                            <input id="profile-rol" type="text" value={profileData.rol_nombre || 'N/A'} readOnly disabled />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-email">Correo Electrónico:</label>
                                            <input id="profile-email" type="email" value={email || ''} readOnly disabled />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor={isCliente ? 'profile-nombre-cliente' : 'profile-first_name'}>{isCliente ? 'Nombres:' : 'Nombres:'} <span className="required-asterisk">*</span></label>
                                            <input id={isCliente ? 'profile-nombre-cliente' : 'profile-first_name'} type="text" name={isCliente ? 'nombre' : 'first_name'} value={nombreForm || ''} onChange={handleProfileChange} required />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor={isCliente ? 'profile-apellido-cliente' : 'profile-last_name'}>{isCliente ? 'Apellidos:' : 'Apellidos:'} <span className="required-asterisk">*</span></label>
                                            <input id={isCliente ? 'profile-apellido-cliente' : 'profile-last_name'} type="text" name={isCliente ? 'apellido' : 'last_name'} value={apellidoForm || ''} onChange={handleProfileChange} required />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-tipo-doc">Tipo Documento:</label>
                                            <input id="profile-tipo-doc" type="text" value={tipoDoc || ''} readOnly disabled />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-num-doc">Número Documento:</label>
                                            <input id="profile-num-doc" type="text" value={numDoc || ''} readOnly disabled />
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-telefono">Teléfono: <span className="required-asterisk">*</span></label>
                                            <input id="profile-telefono" type="tel" name="telefono" value={formData.telefono || ''} onChange={handleProfileChange} placeholder="Ej. 3001234567" maxLength={15} required/>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <div className="form-group">
                                            <label htmlFor="profile-direccion">Dirección: <span className="required-asterisk">*</span></label>
                                            <input id="profile-direccion" type="text" name="direccion" value={formData.direccion || ''} onChange={handleProfileChange} placeholder="Ej. Calle 10 # 20-30" required/>
                                        </div>
                                    </Grid>
                                    <Grid container justifyContent="center">
                                      <Grid item xs={12} sm={7} sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <button type="submit" className="btn-submit" disabled={loadingProfile}>
                                          {loadingProfile ? (
                                            <>
                                              <CircularProgress size={20} sx={{ color: 'white', marginRight: '8px' }} />
                                              Guardando...
                                            </>
                                          ) : ( 'Guardar Información' )}
                                        </button>
                                      </Grid>
                                    </Grid>
                                </Grid>
                            </form>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={isCliente ? 5 : 6}>
                        <Paper elevation={0} variant="outlined" className="profile-section-paper">
                            <form onSubmit={handlePasswordSubmit} className="profile-form section-form" noValidate>
                                <h3>Cambiar Contraseña</h3>
                                {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
                                {passwordError && <div className="alert alert-danger">{passwordError}</div>}

                                <div className="form-group"> 
                                    <label htmlFor="current_password">Contraseña Actual: <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper-profile-password">
                                        <input type={showCurrentPassword ? "text" : "password"} id="current_password" name="current_password" value={passwordFormData.current_password} onChange={handlePasswordFormChange} required />
                                        <span onClick={toggleShowCurrentPassword} className="password-toggle-icon-profile" role="button" tabIndex={0} aria-pressed={showCurrentPassword} aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleShowCurrentPassword()}>
                                            {showCurrentPassword ? '🙈' : '👁️'}
                                        </span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new_password">Nueva Contraseña: <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper-profile-password">
                                        <input type={showNewPassword ? "text" : "password"} id="new_password" name="new_password" value={passwordFormData.new_password} onChange={handlePasswordFormChange} required aria-describedby={passwordFormData.new_password ? "password-strength-indicator-profile" : undefined} />
                                        <span onClick={toggleShowNewPassword} className="password-toggle-icon-profile" role="button" tabIndex={0} aria-pressed={showNewPassword} aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleShowNewPassword()}>
                                            {showNewPassword ? '🙈' : '👁️'}
                                        </span>
                                    </div>
                                    {passwordFormData.new_password && (
                                        <div className="password-strength" id="password-strength-indicator-profile">
                                            <div className="strength-meter"><div className={`strength-value strength-${passwordStrength}`} style={{ width: `${passwordStrength * 25}%` }}></div></div>
                                            <span className="strength-text">{getPasswordStrengthText(passwordStrength)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new_password_confirmation">Confirmar Nueva Contraseña: <span className="required-asterisk">*</span></label>
                                    <div className="input-wrapper-profile-password">
                                        <input type={showConfirmNewPassword ? "text" : "password"} id="new_password_confirmation" name="new_password_confirmation" value={passwordFormData.new_password_confirmation} onChange={handlePasswordFormChange} required />
                                        <span onClick={toggleShowConfirmNewPassword} className="password-toggle-icon-profile" role="button" tabIndex={0} aria-pressed={showConfirmNewPassword} aria-label={showConfirmNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleShowConfirmNewPassword()}>
                                            {showConfirmNewPassword ? '🙈' : '👁️'}
                                        </span>
                                    </div>
                                </div>
                                <Grid container justifyContent="center">
                                  <Grid item xs={12} sm={7} sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <button type="submit" className="btn-submit" disabled={loadingPassword}>
                                      {loadingPassword ? (
                                        <>
                                          <CircularProgress size={20} sx={{ color: 'white', marginRight: '8px' }} />
                                          Actualizando...
                                        </>
                                      ) : (
                                        'Actualizar Contraseña'
                                      )}
                                    </button>
                                  </Grid>
                                </Grid>
                            </form>
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </div>
    );
};

export default ProfilePage;