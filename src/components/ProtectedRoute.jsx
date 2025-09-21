import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access");
  console.log("ProtectedRoute renderizado - isAuthenticated:", isAuthenticated);

  if (!isAuthenticated) {
    console.log("ProtectedRoute - Redirigiendo a /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute - Permitiendo acceso");
  return children;
};

export default ProtectedRoute;