import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { CardDto, SetDto } from '../types';
import { PaginationControls } from '../components/PaginationControls';
import './CardsPage.css';

type SortField = 'name' | 'number' | 'price';
type SortOrder = 'asc' | 'desc';

type SortValue = string | number;

export const CardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [cards, setCards] = useState<CardDto[]>([]);
  const [allSets, setAllSets] = useState<SetDto[]>([]);
  const [setName, setSetName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [rarity, setRarity] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Holo EX', 'Rare Holo VMAX', 'Rare Holo VSTAR'];

  // Cargar sets disponibles (solo 1 vez)
  useEffect(() => {
    const loadSets = async () => {
      try {
        const response = await dataService.getSets(1, 500);
        setAllSets(response.items);
      } catch (err) {
        console.error('Error loading sets:', err);
      }
    };
    loadSets();
  }, []);

  // Cargar cartas de la página actual (SIN búsqueda)
  const loadCardsPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataService.getCards(page, pageSize, setId || undefined);
      
      setCards(response?.items || []);
      setTotalItems(response?.pagination?.totalItems || 0);
      setCurrentPage(page);
      setHasSearched(false);

      // Extraer nombre del set del primer item
      if ((response?.items || []).length > 0 && setId && !setName) {
        setSetName(response?.items?.[0]?.set?.name || 'Unknown');
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Error loading cards:', err);
    } finally {
      setLoading(false);
    }
  }, [setId, pageSize]);

  // Cargar página de resultados de búsqueda
  const loadSearchResultsPage = useCallback(async (page: number, searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataService.searchCards(
        searchTerm,
        setId || undefined,
        page,
        pageSize
      );
      
      setCards(response?.items || []);
      setTotalItems(response?.pagination?.totalItems || 0);
      setCurrentPage(page);
      setHasSearched(true);
    } catch (err) {
      setError((err as Error).message);
      setCards([]);
      console.error('Error loading search results:', err);
    } finally {
      setLoading(false);
    }
  }, [setId, pageSize]);

  // Búsqueda en BD completa (con debounce) - SIN dependencias problemáticas
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setCards([]);
      setHasSearched(false);
      // Recargar cartas iniciales sin esperar
      (async () => {
        try {
          const response = await dataService.getCards(1, pageSize, setId || undefined);
          // Validar estructura
          if (response && response.pagination) {
            setCards(response.items || []);
            setTotalItems(response.pagination?.totalItems || 0);
          }
        } catch (err) {
          console.error('Error loading cards:', err);
        }
      })();
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Usar el endpoint /cards/search que busca en la BD (MUCHO más eficiente)
        const response = await dataService.searchCards(
          value,
          setId || undefined,
          1,
          1000  // Cargar hasta 1000 resultados max
        );
        
        setCards(response?.items || []);
        setTotalItems(response?.pagination?.totalItems || 0);
        setCurrentPage(1);
        setHasSearched(true);
      } catch (err) {
        console.error('Search error:', err);
        setCards([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms
  }, [setId, pageSize]);

  // Cargar cartas inicialmente
  useEffect(() => {
    loadCardsPage(1);
  }, [setId, loadCardsPage]);

  // Aplicar filtros, búsqueda y ordenamiento (EN LA PÁGINA ACTUAL ÚNICAMENTE)
  const filteredAndSortedCards = useMemo(() => {
    let results = [...cards];

    // Filtro por rareza (aplicable solo si no hay búsqueda o después de búsqueda)
    if (rarity && rarity.trim() !== '') {
      results = results.filter((card) => card.rarity === rarity);
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
        case 'number':
          aVal = parseInt(a.number) || 0;
          bVal = parseInt(b.number) || 0;
          break;
        case 'price':
          aVal = a.currentPrice.amount ?? 0;
          bVal = b.currentPrice.amount ?? 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return results;
  }, [cards, sortField, sortOrder, rarity]);

  // Paginación (ya estamos en una página, solo mostramos los éltrados)
  const paginatedCards = filteredAndSortedCards;

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleCardClick = (cardId: string) => {
    navigate(`/dashboard/cards/${cardId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
    setSortField('number');
    setSortOrder('asc');
    setRarity('');
    setCurrentPage(1);
    setHasSearched(false);
    loadCardsPage(1);
  };

  if (error && cards.length === 0) {
    return (
      <div className="cards-page error">
        <header className="page-header">
          <button className="btn-back" onClick={handleBackToDashboard}>
            ← Volver
          </button>
        </header>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="cards-page">
      <header className="page-header">
        <button className="btn-back" onClick={handleBackToDashboard}>
          ← Volver
        </button>
        <div className="header-content">
          {setId && setName && (
            <div>
              <h1>{setName}</h1>
              <p>
                {hasSearched
                  ? `Encontradas ${filteredAndSortedCards.length} cartas`
                  : `Total: ${filteredAndSortedCards.length} de ${totalItems} cartas`}
              </p>
            </div>
          )}
          {!setId && (
            <div>
              <p style={{ color: 'var(--text-secondary, #666)', margin: 0, fontSize: '0.95rem' }}>
                {hasSearched
                  ? `Encontradas ${filteredAndSortedCards.length} cartas`
                  : `Total: ${filteredAndSortedCards.length} de ${totalItems} cartas`}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Panel de Filtros */}
      <div className="filters-panel">
        <div className="filter-group search-group">
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              className="filter-input search-input"
              placeholder="🔍 Buscar por nombre, número (1, 15, etc)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn-clear-search"
                onClick={() => handleSearchChange('')}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
            {isSearching && <span className="search-indicator">⏳ Buscando...</span>}
          </div>
        </div>

        <div className="filter-group">
          <label>🎴 Set</label>
          <select
            className="filter-select"
            value={setId || ''}
            onChange={(e) => {
              // Limpiar búsqueda al cambiar set
              setSearchTerm('');
              setHasSearched(false);
              setCards([]);
              
              if (e.target.value) {
                setSearchParams({ setId: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
          >
            <option value="">Todos los Sets ({allSets.length})</option>
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.cardCount})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={rarity}
            onChange={(e) => {
              setRarity(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas las Rarezas</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
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
            <option value="number-asc">🔢 Número (↑)</option>
            <option value="number-desc">🔢 Número (↓)</option>
            <option value="name-asc">A→Z Nombre</option>
            <option value="name-desc">Z→A Nombre</option>
            <option value="price-asc">💰 Precio (Menor)</option>
            <option value="price-desc">💰 Precio (Mayor)</option>
          </select>
        </div>

        {(searchTerm || rarity || sortField !== 'number' || sortOrder !== 'asc') && (
          <button className="btn-reset-filters" onClick={handleResetFilters}>
            ✕ Limpiar Filtros
          </button>
        )}
      </div>

      {/* Tabla de Cartas */}
      {paginatedCards.length > 0 ? (
        <div className="cards-container">
          <table className="cards-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('name')}
                  title="Click para ordenar"
                >
                  Carta {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('number')}
                  title="Click para ordenar"
                >
                  Nº {sortField === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Rareza</th>
                <th>Set</th>
                <th
                  className="sortable"
                  onClick={() => handleSortChange('price')}
                  title="Click para ordenar"
                >
                  Precio {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCards.map((card) => (
                <tr key={card.id} className="card-row">
                  <td className="card-image">
                    <img 
                      src={card.imageUrl || '/images/placeholder-card.png'} 
                      alt={card.name}
                      loading="lazy"
                      decoding="async"
                      title={card.imageUrl ? card.name : `${card.name} (sin imagen aún)`}
                    />
                  </td>
                  <td className="card-name">
                    <strong>{card.name}</strong>
                  </td>
                  <td className="card-number">
                    <code>#{card.number}</code>
                  </td>
                  <td className="card-rarity">
                    <span className={`rarity-badge ${card.rarity?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {card.rarity || 'N/A'}
                    </span>
                  </td>
                  <td className="card-set">
                    <button
                      className="btn-set-link"
                      onClick={() => setSearchParams({ setId: card.set.id })}
                      title={`Ver todas las cartas de ${card.set.name}`}
                    >
                      {card.set.name}
                    </button>
                  </td>
                  <td className="card-price">
                    {card.currentPrice.amount !== null ? (
                      <span className="price-value">${card.currentPrice.amount.toFixed(2)}</span>
                    ) : (
                      <span className="price-none">Sin precio</span>
                    )}
                  </td>
                  <td className="card-action">
                    <button
                      className="btn-view-detail"
                      onClick={() => handleCardClick(card.id)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No se encontraron cartas con los filtros aplicados</p>
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
              loadCardsPage(page);
            }
          }}
          disabled={loading}
        />
      )}
    </div>
  );
};
