import React from 'react';

// La función para formatear el precio la pasamos como prop para no repetirla
const formatPrice = (price) => {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
};

// Recibe el 'producto' a mostrar y la función 'onAddToCart' del padre
export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="product-image" />
      </div>
      <div className="product-content">
        <span className="product-badge">{product.category}</span>
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
      </div>
      <div className="product-footer">
        <p className="product-price">{formatPrice(product.price)}</p>
        {/* Al hacer clic, llama a la función que le pasó el componente padre */}
        <button className="product-button" onClick={() => onAddToCart(product)}>
          Agregar
        </button>
      </div>
    </div>
  );
}