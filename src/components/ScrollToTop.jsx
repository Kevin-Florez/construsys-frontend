// src/components/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Usamos el comportamiento 'instant' para que el scroll sea inmediato y no se vea la animación
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;