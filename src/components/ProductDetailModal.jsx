// src/components/ui/ProductDetailModal.jsx (ARCHIVO NUEVO)

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'sonner';
import './ProductDetailModal.css'; // Crearemos este archivo CSS a continuación

export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;

  const { addToCart } = useCart();
  
  // Combina la imagen principal con las adicionales para la galería
  const allImages = [product.imagen_url, ...product.imagenes.map(img => img.imagen_url)].filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Resetea la imagen al cambiar de producto
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id]);

  const handleAddToCart = () => {
    const productForCart = {
      ...product,
      price: product.precio_venta,
    };
    addToCart(productForCart);
    toast.success(`${product.nombre} añadido al carrito!`);
    onClose(); // Cierra el modal después de añadir al carrito
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-grid">
          {/* Columna de Imágenes */}
          <div className="image-gallery">
            <div className="main-image-container">
              {allImages.length > 1 && (
                <button className="gallery-nav left" onClick={prevImage}><ChevronLeft size={28} /></button>
              )}
              <img src={allImages[currentImageIndex]} alt={product.nombre} className="main-image" />
              {allImages.length > 1 && (
                <button className="gallery-nav right" onClick={nextImage}><ChevronRight size={28} /></button>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="thumbnail-strip">
                {allImages.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className={`thumbnail-image ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Columna de Detalles */}
          <div className="product-details">
            <span className="product-category">{product.categoria?.nombre || 'Sin Categoría'}</span>
            <h1 className="product-title">{product.nombre}</h1>
            <p className="product-brand">Marca: {product.marca?.nombre}</p>
            <p className="product-description">{product.descripcion}</p>
            
            <div className="specifications">
              <h3 className="spec-title">Especificaciones</h3>
              <ul className="spec-list">
                {product.peso && <li><strong>Peso:</strong> {product.peso}</li>}
                {product.dimensiones && <li><strong>Dimensiones:</strong> {product.dimensiones}</li>}
                {product.material && <li><strong>Material:</strong> {product.material}</li>}
                {product.otros_detalles && <li><strong>Detalles:</strong> {product.otros_detalles}</li>}
              </ul>
            </div>

            <div className="modal-footer">
              <span className="product-price">{formatCurrency(product.precio_venta)}</span>
              <button className="add-to-cart-button" onClick={handleAddToCart} disabled={product.stock_actual === 0}>
                <ShoppingCart size={20} />
                {product.stock_actual > 0 ? 'Añadir al Carrito' : 'Agotado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}