import { useState, useRef, useCallback, useEffect } from 'react';
import { dataService } from '../services/dataService';

export interface UseSearchOptions<T> {
  pageSize?: number;
  setId?: string;
  searchFunction: (term: string, setId?: string, page?: number, pageSize?: number) => Promise<any>;
  loadFunction: (page: number, setId?: string) => Promise<any>;
}

export interface UseSearchResult<T> {
  items: T[];
  loading: boolean;
  searching: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasSearched: boolean;
  search: (term: string) => void;
  loadPage: (page: number) => void;
  reset: () => void;
}

export function useSearch<T>(options: UseSearchOptions<T>): UseSearchResult<T> {
  const { pageSize = 20, setId, searchFunction, loadFunction } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loadFunction(page, setId);
      
      setItems(response?.items || []);
      setTotalItems(response?.pagination?.totalItems || 0);
      setCurrentPage(page);
      setTotalPages(response?.pagination?.totalPages || 0);
      setHasSearched(false);
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
      console.error('Error loading page:', err);
    } finally {
      setLoading(false);
    }
  }, [setId, loadFunction]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term.trim().length === 0) {
      setItems([]);
      setHasSearched(false);
      loadPage(1);
      return;
    }

    setSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchFunction(term, setId, 1, 1000);
        
        setItems(response?.items || []);
        setTotalItems(response?.pagination?.totalItems || 0);
        setCurrentPage(1);
        setTotalPages(response?.pagination?.totalPages || 0);
        setHasSearched(true);
      } catch (err) {
        console.error('Search error:', err);
        setItems([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [setId, searchFunction, loadPage]);

  const reset = useCallback(() => {
    setSearchTerm('');
    setHasSearched(false);
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1);
  }, []);

  return {
    items,
    loading,
    searching,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasSearched,
    search,
    loadPage,
    reset,
  };
}
