// src/components/ui/CartSidebar.jsx

import React from 'react';
import './CartSidebar.css';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function CartSidebar({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveFromCart,
  onProceedToPayment,
  // ✨ 1. Asegúrate de recibir los nuevos props con el desglose
  cartSubtotal,
  cartIva,
  cartTotal,
  totalItems,
  onViewProductDetails
}) {
  return (
    <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="cart-header">
        <h3 className="cart-title">Tu Carrito ({totalItems} {totalItems === 1 ? 'Producto' : 'Productos'})</h3>
        <button onClick={onClose} className="cart-close-button"><X size={24} /></button>
      </div>

      {/* ✨ 2. LÓGICA RESTAURADA para mostrar el mensaje de carrito vacío */}
      {cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCart className="empty-cart-icon" size={60} />
          <h4 className="empty-cart-title">Tu carrito está vacío</h4>
          <p className="empty-cart-text">
            Parece que aún no has añadido productos. ¡Explora nuestro catálogo!
          </p>
          <button onClick={onClose} className="empty-cart-button">
            Seguir Comprando
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
  {cart.map((item) => {
    // ✨ 1. Calcula el subtotal para esta línea de producto
    const itemSubtotal = item.price * item.quantity;

    return (
      <div key={item.id} className="cart-item">
        <img 
                    src={item.imagen_url || "/placeholder.svg"} 
                    alt={item.nombre} 
                    className="cart-item-image"
                    onClick={() => onViewProductDetails(item)} // ✨ 2. Añade el onClick
                  />
                  <div className="cart-item-details">
                    <h4 
                      className="cart-item-name"
                      onClick={() => onViewProductDetails(item)} // ✨ 2. Añade el onClick
                    >
                      {item.nombre}
                    </h4>
          
          {/* ▼▼▼ INICIO DE LA MODIFICACIÓN ▼▼▼ */}

          <div className="cart-item-price-controls">
  <div className="quantity-controls">
    <button 
      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} 
      disabled={item.quantity === 1} 
      className="quantity-button"
    >
      <Minus size={14} />
    </button>

    <span className="quantity-value">{item.quantity}</span>

    <button 
      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} 
      className="quantity-button"
    >
      <Plus size={14} />
    </button>
  </div>

  <div className="cart-item-pricing">
    <span className="item-subtotal">{formatCurrency(itemSubtotal)}</span>
    {item.quantity > 1 && (
      <span className="item-unit-price">
        {formatCurrency(item.price)} c/u
      </span>
    )}
  </div>
</div>

          
          {/* ▲▲▲ FIN DE LA MODIFICACIÓN ▲▲▲ */}

        </div>
        <button onClick={() => onRemoveFromCart(item.id)} className="remove-item-button"><Trash2 size={18} /></button>
      </div>
    );
  })}
</div>
          <div className="cart-footer">
            {/* ✨ 3. Muestra el desglose completo que ahora sí recibe */}
            <div className="cart-summary">
              <div className="cart-summary-line">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="cart-summary-line">
                <span>IVA (19%)</span>
                <span>{formatCurrency(cartIva)}</span>
              </div>
              <div className="cart-total">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            <button className="checkout-button" onClick={onProceedToPayment}>
              <span>Confirmar Pedido o Cotizarlo</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}