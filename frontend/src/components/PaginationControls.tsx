import React, { useState, useRef } from 'react';
import './PaginationControls.css';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onGoToPage?: (page: number) => void;
  disabled?: boolean;
}

/**
 * Componente reutilizable de paginación minimalista con iconos
 * Página actual editable directamente
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onGoToPage,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentPage.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(currentPage.toString());
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleEditConfirm = () => {
    const page = parseInt(editValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      if (onGoToPage) {
        onGoToPage(page);
      } else {
        onPageChange(page);
      }
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditConfirm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleEditBlur = () => {
    handleEditConfirm();
  };

  return (
    <div className="pagination-controls">
      {/* Ir a la primera página */}
      <button
        className="btn-pagination-icon btn-first"
        onClick={() => onPageChange(1)}
        disabled={disabled || currentPage === 1}
        title="Primera página"
        aria-label="Ir a la primera página"
      >
        ⏮
      </button>

      {/* Anterior página */}
      <button
        className="btn-pagination-icon btn-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        title="Página anterior"
        aria-label="Página anterior"
      >
        ‹
      </button>

      {/* Información actual - Editable */}
      <div className="pagination-info-editable">
        {isEditing ? (
          <div className="edit-container">
            <input
              ref={inputRef}
              type="number"
              min="1"
              max={totalPages}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={handleEditBlur}
              disabled={disabled}
              className="edit-input"
              aria-label="Número de página"
            />
            <span className="edit-total">/ {totalPages}</span>
          </div>
        ) : (
          <button
            className="pagination-display"
            onClick={handleEditStart}
            disabled={disabled}
            title="Click para editar página"
            aria-label="Click para ir a página específica"
          >
            <span className="page-number">{currentPage}</span>
            <span className="page-divider">/</span>
            <span className="page-total">{totalPages}</span>
          </button>
        )}
      </div>

      {/* Siguiente página */}
      <button
        className="btn-pagination-icon btn-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
        title="Página siguiente"
        aria-label="Página siguiente"
      >
        ›
      </button>

      {/* Ir a la última página */}
      <button
        className="btn-pagination-icon btn-last"
        onClick={() => onPageChange(totalPages)}
        disabled={disabled || currentPage === totalPages}
        title="Última página"
        aria-label="Ir a la última página"
      >
        ⏭
      </button>
    </div>
  );
}
