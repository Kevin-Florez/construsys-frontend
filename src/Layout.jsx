// src/Layout.jsx
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext'; 
import AdminSidebar from './components/Sidebar'; 
import ClientSidebar from './components/ClientSidebar';
import Header from './components/Header';
import './Layout.css';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { user } = useAuth(); 
    
    // ✨ CORRECCIÓN: Hemos eliminado el hook useEffect de aquí, ya que no era el lugar correcto para la redirección.
    
    const userRole = user?.rol?.nombre;

    const handleSidebarToggle = (isOpen) => {
        setIsSidebarOpen(isOpen);
    };

    return (
        <div className={`layout-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {userRole && (
                userRole.toLowerCase() === 'cliente' ? (
                    <ClientSidebar onToggle={handleSidebarToggle} isOpen={isSidebarOpen} />
                ) : (
                    <AdminSidebar onToggle={handleSidebarToggle} isOpen={isSidebarOpen} />
                )
            )}

            <div className="main-wrapper">
                <Header isSidebarOpen={isSidebarOpen} />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;