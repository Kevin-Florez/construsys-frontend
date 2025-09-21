// src/utils/formatters.js

export const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    // Devuelve un valor por defecto o un string vacío si el valor no es un número
    return "$0"; 
  }
  return `$${number.toLocaleString('es-CO', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};



/**
 * Formatea un ID numérico como un número de pedido estándar.
 * @param {number | string} id El ID del pedido.
 * @returns {string} El ID formateado (e.g., "PED-000001").
 */
export const formatNumeroPedido = (id) => `PED-${String(id).padStart(6, "0")}`;

/**
 * Formatea una fecha en formato ISO a un string legible.
 * @param {string} dateString La fecha en formato ISO.
 * @returns {string} La fecha formateada (e.g., "30 de junio de 2025").
 */
export const formatFecha = (dateString) => new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });