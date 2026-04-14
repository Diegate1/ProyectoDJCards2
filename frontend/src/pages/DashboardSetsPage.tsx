import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { SetDto } from '../types';
import { PaginationControls } from '../components/PaginationControls';
import './DashboardSetsPage.css';

type SortField = 'name' | 'date' | 'cardCount';
type SortOrder = 'asc' | 'desc';

type SortValue = string | number;

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
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Cargar sets paginadamente
  const loadSetsPage = useCallback(async (page: number) => {
    try {
      if (page === 1) setLoading(true);
      
      const filters = {
        releaseDateFrom: yearFrom ? `${yearFrom}-01-01` : undefined,
        releaseDateTo: yearTo ? `${yearTo}-12-31` : undefined,
      };
      
      const response = await dataService.getSets(page, pageSize, filters);
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
  }, [pageSize, yearFrom, yearTo]);

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
      loadSetsPage(1);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const filters = {
          releaseDateFrom: yearFrom ? `${yearFrom}-01-01` : undefined,
          releaseDateTo: yearTo ? `${yearTo}-12-31` : undefined,
        };
        const response = await dataService.searchSets(value, 1, 50, filters);
        setSets(response?.items || []);
        setTotalItems(response?.pagination?.totalItems || 0);
        setCurrentPage(1);
        setTotalPages(response?.pagination?.totalPages || 0);
      } catch (err) {
        setError((err as Error).message);
        setSets([]);
        console.error('Error searching sets:', err);
      }
    }, 500);
  }, [pageSize, yearFrom, yearTo]);

  // Cargar página de búsqueda
  const loadSearchResultsPage = useCallback(async (page: number, searchTerm: string) => {
    try {
      setLoading(true);
      const filters = {
        releaseDateFrom: yearFrom ? `${yearFrom}-01-01` : undefined,
        releaseDateTo: yearTo ? `${yearTo}-12-31` : undefined,
      };
      const response = await dataService.searchSets(searchTerm, page, pageSize, filters);
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
      let aVal: SortValue;
      let bVal: SortValue;

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
    setSortField('date');
    setSortOrder('desc');
    setSelectedLanguage('');
    setYearFrom('');
    setYearTo('');
    setCurrentPage(1);
    loadSetsPage(1);
  };

  if (error && sets.length === 0) {
    return <div className="dashboard-sets-page error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-sets-page">


      {/* Panel de Filtros */}
      <div className="filters-panel">
        <div className="search-group">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="🔍 Buscar set..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => handleSearchChange('')}
              title="Limpiar"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Idioma:</label>
            <select
              className="filter-select"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
                loadSetsPage(1);
              }}
            >
              <option value="">🌐 Todos</option>
              <option value="English">🇬🇧 English</option>
              <option value="日本語">🇯🇵 日本語</option>
              <option value="中文">🇨🇳 中文</option>
            </select>

            
          </div>

          <div className="filter-group">
            <label>Desde:</label>
            <select
              className="filter-select"
              value={yearFrom}
              onChange={(e) => {
                setYearFrom(e.target.value);
                setCurrentPage(1);
                loadSetsPage(1);
              }}
            >
              <option value="">Año</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Hasta:</label>
            <select
              className="filter-select"
              value={yearTo}
              onChange={(e) => {
                setYearTo(e.target.value);
                setCurrentPage(1);
                loadSetsPage(1);
              }}
            >
              <option value="">Año</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
            </select>
          </div>

          {(searchTerm || selectedLanguage || sortField !== 'date' || sortOrder !== 'desc' || yearFrom || yearTo) && (
            <button className="btn-reset-filters" onClick={handleResetFilters}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>
      <div className="header-row">
        <h1>🎴 Sets de Pokémon TCG</h1>
        <h4>
          {searchTerm 
            ? ( <>Encontrados {totalItems} sets</> ) 
            : ( <>Total: {totalItems} sets</>)}
        </h4>
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
            if (searchTerm) {
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
