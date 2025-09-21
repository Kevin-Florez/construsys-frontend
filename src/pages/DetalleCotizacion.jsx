// src/pages/DetalleCotizacion.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CotizacionDetalleModal from '../components/CotizacionDetalleModal'; // ✨ Importa el nuevo modal
import { toast } from 'sonner';

export default function DetalleCotizacionPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    // Estado para controlar el modal (siempre estará abierto en esta página)
    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
        // Redirige al invitado a la página de inicio al cerrar el modal
        navigate("/");
        toast.info("Gracias por visitar la cotización.");
    };

    // Esta página solo renderiza el modal y lo controla
    return (
        <CotizacionDetalleModal
            open={open}
            onClose={handleClose}
            cotizacionToken={token}
            // onConvertSuccess no es necesario aquí, ya que el modal redirige
        />
    );
}