import { Outlet, Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner"; // <-- ✨ CORRECCIÓN AQUÍ: Se importa directamente de la librería
import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

// Este componente es el "cascarón" o plantilla para todas las páginas públicas.
// Contiene el menú de navegación y el pie de página que se compartirán.
export default function PublicLayout() {

  // Función para aplicar estilos condicionales a los enlaces de navegación
  const navLinkClasses = ({ isActive }) => {
    const baseClasses = "font-medium transition-colors py-2";
    const activeClasses = "text-blue-600 border-b-2 border-blue-600"; // Estilo para el enlace activo
    const inactiveClasses = "text-slate-700 hover:text-blue-600"; // Estilo para enlaces inactivos

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Depósito y Ferretería del Sur
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8 h-full">
              <NavLink to="/" className={navLinkClasses} end>
                Inicio
              </NavLink>
              <NavLink to="/catalogo-publico" className={navLinkClasses}>
                Catálogo
              </NavLink>
              <NavLink to="/nosotros" className={navLinkClasses}>
                Nosotros
              </NavLink>
              <NavLink to="/contacto" className={navLinkClasses}>
                Contacto
              </NavLink>
              


        
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="hidden sm:inline-flex">
                <Link to="/login">Ingresar</Link>
              </Button>
              <Button>
                <Link to="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Contenido Principal de la Página */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer (sin cambios) */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">Depósito y Ferretería del Sur</span>
              </div>
              <p className="text-slate-300 mb-6 max-w-md">
                Tu aliado confiable en materiales de construcción. Construyendo el futuro con calidad, innovación y
                compromiso.
              </p>
              <div className="flex space-x-4">
                <a
  href="https://www.facebook.com/share/16QW3T1d8G/"
  target="_blank"
  rel="noopener noreferrer"
>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-600 hover:bg-blue-600 hover:border-blue-600"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
              </a>
              <a
  href="https://www.instagram.com/depositoyferreteriadelsur?igsh=MTJvNnhxZTQ1OG8zag=="
  target="_blank"
  rel="noopener noreferrer"
>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-600 hover:bg-blue-600 hover:border-blue-600"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-3">
                <li><Link to="/catalogo-publico" className="text-slate-300 hover:text-blue-400 transition-colors">Catálogo</Link></li>
                <li><Link to="/nosotros" className="text-slate-300 hover:text-blue-400 transition-colors">Nosotros</Link></li>
                <li><Link to="/contacto" className="text-slate-300 hover:text-blue-400 transition-colors">Contacto</Link></li>
                <li><Link to="/login" className="text-slate-300 hover:text-blue-400 transition-colors">Iniciar Sesión</Link></li>
                
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Contacto</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300">Cll 63 #44-78, Itagüí</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300">(4)3735252 - (4)3735251</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300">deposito.delsur@hotmail.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              &copy; {new Date().getFullYear()} Depósito y Ferretería del Sur. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      
    </div>
  );
}