import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { SetDto } from '../types';
import { PaginationControls } from '../components/PaginationControls';
import './DashboardSetsPage.css';

type SortField = 'name' | 'date' | 'cardCount';
type SortOrder = 'asc' | 'desc';

export const DashboardSetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<SetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cargar sets paginadamente
  const loadSetsPage = useCallback(async (page: number) => {
    try {
      if (page === 1) setLoading(true);
      
      const response = await dataService.getSets(page, pageSize);
      setSets(response?.items || []);
      setTotalItems(response?.pagination?.totalItems || 0);
      setCurrentPage(page);
      setTotalPages(response?.pagination?.totalPages || 0);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setSets([]);
      console.error('Error loading sets:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Cargar primera página al montar
  useEffect(() => {
    loadSetsPage(1);
  }, [loadSetsPage]);

  // Búsqueda en BD completa (con debounce)
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setSets([]);
      setHasSearched(false);
      // Recargar sets iniciales
      (async () => {
        try {
          const response = await dataService.getSets(1, pageSize);
          setSets(response.items);
          setTotalItems(response.pagination.totalItems);
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(1);
        } catch (err) {
          console.error('Error loading sets:', err);
        }
      })();
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Usar el endpoint /sets/search que busca en la BD
        const response = await dataService.searchSets(value, 1, 50);
        setSets(response?.items || []);
        setTotalItems(response?.pagination?.totalItems || 0);
        setCurrentPage(1);
        setTotalPages(response?.pagination?.totalPages || 0);
        setHasSearched(true);
      } catch (err) {
        setError((err as Error).message);
        setSets([]);
        console.error('Error searching sets:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce en 500ms como CardsPage
  }, [pageSize]);

  // Cargar página de búsqueda
  const loadSearchResultsPage = useCallback(async (page: number, searchTerm: string) => {
    try {
      setLoading(true);
      const response = await dataService.searchSets(searchTerm, page, pageSize);
      setSets(response?.items || []);
      setTotalItems(response?.pagination?.totalItems || 0);
      setCurrentPage(page);
      setTotalPages(response?.pagination?.totalPages || 0);
    } catch (err) {
      setError((err as Error).message);
      setSets([]);
      console.error('Error loading search results:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Aplicar filtros y ordenamiento
  const displayedSets = useMemo(() => {
    let results = [...sets];

    // Filtro por idioma
    if (selectedLanguage) {
      results = results.filter((set) => 
        set.languages.includes(selectedLanguage)
      );
    }

    // Ordenamiento
    results.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.releaseDate || 0).getTime();
          bVal = new Date(b.releaseDate || 0).getTime();
          break;
        case 'cardCount':
          aVal = a.cardCount;
          bVal = b.cardCount;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return results;
  }, [sets, sortField, sortOrder, selectedLanguage]);

  // Manejadores de eventos
  const handleSetClick = (setId: string) => {
    navigate(`/dashboard/cards?setId=${setId}`);
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setHasSearched(false);
    setSortField('date');
    setSortOrder('desc');
    setSelectedLanguage('');
    setCurrentPage(1);
    loadSetsPage(1); // Recargar la primera página
  };

  if (error && sets.length === 0) {
    return <div className="dashboard-sets-page error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-sets-page">
      <header className="page-header">
        <h1>🎴 Sets de Pokémon TCG</h1>
        <p>
          {searchTerm ? (
            <>Encontrados {totalItems} sets</>
          ) : (
            <>Total: {totalItems} sets</>
          )}
        </p>
      </header>

      {/* Panel de Filtros */}
      <div className="filters-panel">
        <div className="filter-group search-group">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="🔍 Buscar set (Base, Perfect Order, etc...)"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => handleSearchChange('')}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <label>🌐 Idioma</label>
          <select
            className="filter-select"
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todos los idiomas</option>
            <option value="English">English</option>
            <option value="日本語">日本語 (Japonés)</option>
            <option value="中文">中文 (Chino)</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
          >
            <option value="date-desc">📅 Fecha (Más Reciente)</option>
            <option value="date-asc">📅 Fecha (Más Antiguo)</option>
            <option value="name-asc">A→Z Nombre</option>
            <option value="name-desc">Z→A Nombre</option>
            <option value="cardCount-asc">🔢 Menos Cartas</option>
            <option value="cardCount-desc">🔢 Más Cartas</option>
          </select>
        </div>

        {(searchTerm || selectedLanguage || sortField !== 'date' || sortOrder !== 'desc') && (
          <button className="btn-reset-filters" onClick={handleResetFilters}>
            ✕ Limpiar Filtros
          </button>
        )}
      </div>

      {/* Tabla de Sets */}
      {displayedSets.length > 0 ? (
        <div className="sets-container">
          <table className="sets-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('name')}
                  title="Click para ordenar"
                >
                  Set {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('date')}
                  title="Click para ordenar"
                >
                  Fecha {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('cardCount')}
                  title="Click para ordenar"
                >
                  Nº Cartas {sortField === 'cardCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Idioma</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {displayedSets.map((set) => (
                <tr key={set.id} className="set-row">
                  <td className="set-image">
                    <img src={set.imageUrl} alt={set.name} loading="lazy" decoding="async" />
                  </td>
                  <td className="set-name">{set.name}</td>
                  <td className="set-date">
                    {set.releaseDate
                      ? new Date(set.releaseDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className="set-count">{set.cardCount}</td>
                  <td className="set-languages">
                    {set.languages && set.languages.length > 0 ? set.languages.join(', ') : 'N/A'}
                  </td>
                  <td className="set-action">
                    <button
                      className="btn-view-cards"
                      onClick={() => handleSetClick(set.id)}
                    >
                      Ver Cartas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No se encontraron sets con los filtros aplicados</p>
          <button className="btn-reset-filters" onClick={handleResetFilters}>
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (hasSearched) {
              loadSearchResultsPage(page, searchTerm);
            } else {
              loadSetsPage(page);
            }
          }}
          disabled={loading}
        />
      )}
    </div>
  );
};
