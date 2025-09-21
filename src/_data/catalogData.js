// src/_data/catalogData.js

// 1. Cambiamos el import: sale 'Cube', entra 'Blocks'
import {
  Hammer,
  PaintRoller,
  Blocks, // <-- El ícono correcto para Cemento
  Bolt,
  Wrench
} from "lucide-react";

// Los productos se mantienen igual (no necesitan cambios)
export const mockProducts = [
  // Herramientas
  { id: 1, name: "Taladro Percutor 500W", category: "Herramientas", price: 150000, description: "Herramienta eléctrica versátil para perforaciones en concreto y madera.", image: "/images/taladro.webp" },
  { id: 2, name: "Martillo de Carpintero", category: "Herramientas", price: 35000, description: "Martillo profesional con mango ergonómico para trabajos de precisión.", image: "/images/martillo.webp" },
  { id: 3, name: "Juego de Destornilladores", category: "Herramientas", price: 60000, description: "Set completo con puntas intercambiables de alta durabilidad.", image: "/images/desto.jpg" },
  // Pinturas
  { id: 4, name: "Pintura Látex Interior", category: "Pinturas", price: 45000, description: "Pintura de alta cobertura para interiores, fácil aplicación y secado rápido.", image: "/images/pintura.jpeg" },
  { id: 5, name: "Esmalte Sintético", category: "Pinturas", price: 38000, description: "Esmalte brillante resistente para superficies de madera y metal.", image: "/images/esmalte.webp" },
  { id: 6, "name": "Primer Anticorrosivo", category: "Pinturas", price: 42000, description: "Base protectora contra la corrosión para superficies metálicas.", image: "/images/anti.webp" },
  // Cemento
  { id: 7, name: "Cemento Argos 50kg", category: "Cemento", price: 28000, description: "Cemento Portland de uso general, ideal para estructuras de concreto.", image: "/images/cemento10.png" },
  { id: 8, name: "Mortero Seco 40kg", category: "Cemento", price: 22000, description: "Mezcla lista para revoques, pegas y reparaciones menores.", image: "/images/mortero.jpg" },
  { id: 9, name: "Cemento Blanco 25kg", category: "Cemento", price: 35000, description: "Cemento especial para acabados decorativos y trabajos finos.", image: "/images/blanco.jpeg" },
  // Eléctricos
  { id: 10, name: "Cable THW 12 AWG", category: "Eléctricos", price: 85000, description: "Cable eléctrico de cobre para instalaciones residenciales e industriales.", image: "/images/cable.jpeg" },
  { id: 11, name: "Interruptor Diferencial", category: "Eléctricos", price: 120000, description: "Protección eléctrica automática contra sobrecargas y cortocircuitos.", image: "/images/inte.jpeg" },
  { id: 12, name: "Tomacorriente Doble", category: "Eléctricos", price: 15000, description: "Tomacorriente polarizado de alta calidad para uso residencial.", image: "/images/doble.webp" },
  // Plomería
  { id: 13, name: "Tubería PVC 4 pulgadas", category: "Plomería", price: 25000, description: "Tubería de PVC sanitario para desagües y ventilación.", image: "/images/tube.webp" },
  { id: 14, name: "Llave de Paso 1/2", category: "Plomería", price: 18000, description: "Válvula de control de flujo de agua de bronce cromado.", image: "/images/llave.webp" },
  { id: 15, name: "Codo PVC 90° 2 pulgadas", category: "Plomería", price: 8000, description: "Accesorio de conexión para cambios de dirección en tuberías.", image: "/images/codoo.webp" },
];

// 2. Actualizamos la categoría para usar el ícono correcto
export const mockCategories = [
  { name: "Herramientas", icon: Hammer },
  { name: "Pinturas", icon: PaintRoller },
  { name: "Cemento", icon: Blocks }, // <-- Cambio aquí
  { name: "Eléctricos", icon: Bolt },
  { name: "Plomería", icon: Wrench },
];