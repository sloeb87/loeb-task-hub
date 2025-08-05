import { useState, useCallback, useRef, useEffect } from 'react';

export interface FilterState<T extends Record<string, string[]>> {
  filters: T;
  showFilters: Record<keyof T, boolean>;
  searchTerm: string;
}

/**
 * Optimized hook for managing filter state and dropdown visibility
 * Reduces duplicate filter management patterns across components
 */
export const useFilterState = <T extends Record<string, string[]>>(
  initialFilters: T
) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [showFilters, setShowFilters] = useState<Record<keyof T, boolean>>(
    Object.keys(initialFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const filterRefs = useRef<Record<keyof T, HTMLDivElement | null>>(
    Object.keys(initialFilters).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, HTMLDivElement | null>)
  );

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.keys(showFilters).every(filterType => {
        const ref = filterRefs.current[filterType as keyof T];
        return !ref || !ref.contains(target);
      });
      
      if (clickedOutside) {
        setShowFilters(Object.keys(showFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>));
      }
    };

    if (Object.values(showFilters).some(show => show)) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const handleFilterChange = useCallback((filterType: keyof T, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  }, []);

  const clearFilter = useCallback((filterType: keyof T) => {
    setFilters(prev => ({ ...prev, [filterType]: [] as string[] }));
  }, []);

  const toggleFilterDropdown = useCallback((filterType: keyof T, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowFilters(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>);
      newState[filterType] = !prev[filterType];
      return newState;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(Object.keys(initialFilters).reduce((acc, key) => ({ ...acc, [key]: [] }), {} as T));
    setSearchTerm('');
  }, [initialFilters]);

  return {
    // State
    filters,
    showFilters,
    searchTerm,
    filterRefs,
    
    // Actions
    handleFilterChange,
    clearFilter,
    toggleFilterDropdown,
    clearAllFilters,
    setSearchTerm,
    setFilters,
    setShowFilters,
  };
};