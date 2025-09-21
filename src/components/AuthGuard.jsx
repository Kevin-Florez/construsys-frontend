import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access'); // ✅ Lee "access" correctamente
  const location = useLocation();

  if (!isAuthenticated) {
    console.log("AuthGuard: No autenticado, redirigiendo a /login");
    // Guarda la ubicación desde la que se intenta acceder para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // console.log("AuthGuard: Autenticado, permitiendo acceso"); // Puedes descomentar para depurar
  return children;
};

export default AuthGuard;