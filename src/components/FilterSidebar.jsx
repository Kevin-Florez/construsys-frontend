import React from 'react';
import { FaBox, FaTimes } from 'react-icons/fa';

// Recibe las categorías, la categoría seleccionada y las funciones para interactuar
export default function FilterSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  isMobile,
  isOpen,
  onClose
}) {
  return (
    <aside className={`filter-sidebar ${isMobile && isOpen ? 'open' : ''}`}>
      <div className="filter-card">
        <div className="filter-header">
          <FaBox />
          <h3 className="filter-title">Categorías</h3>
          {isMobile && (
            <button className="filter-header-mobile-close" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="filter-content">
          <button
            className={`filter-button ${selectedCategory === "Todos" ? "active" : ""}`}
            onClick={() => onSelectCategory("Todos")}
          >
            Todas las categorías
          </button>
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.name}
                className={`filter-button ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => onSelectCategory(category.name)}
              >
                <IconComponent className="category-icon" style={{ color: category.color }} />
                {category.name}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  );
}