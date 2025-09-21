import React from 'react';
import { Button } from './button'; // Asegúrate que la ruta a tu componente Button sea correcta
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null; // No mostrar paginación si solo hay una página
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Anterior
      </Button>

      <span className="text-sm font-medium text-slate-600">
        Página {currentPage} de {totalPages}
      </span>

      <Button
        variant="outline"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}