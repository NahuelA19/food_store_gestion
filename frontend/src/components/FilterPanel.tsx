import { useState, FC, useEffect } from 'react';
import { Filters } from '../hooks/useSearch';
import '../styles/FilterPanel.css';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  categories?: Category[];
  isLoading?: boolean;
}

export const FilterPanel: FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  categories = [],
  isLoading = false,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [errors, setErrors] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync local filters with prop
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    // Validate
    const newErrors: string[] = [];

    if (
      localFilters.min_price !== null &&
      localFilters.max_price !== null &&
      localFilters.min_price > localFilters.max_price
    ) {
      newErrors.push('Min price must be <= max price');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onFilterChange(localFilters);
  }

  function handleReset() {
    setLocalFilters({
      category_id: null,
      min_price: null,
      max_price: null,
      in_stock: null,
      min_stock: null,
    });
    setErrors([]);
    onReset();
  }

  return (
    <div className="filter-panel">
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="filter-title">Filters</h3>
        <button
          className="collapse-btn"
          aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          type="button"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((err, i) => (
                <p key={i} className="error">
                  ⚠️ {err}
                </p>
              ))}
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={localFilters.category_id || ''}
              onChange={e =>
                handleFilterChange(
                  'category_id',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isLoading}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min $"
                value={localFilters.min_price !== null ? localFilters.min_price : ''}
                onChange={e =>
                  handleFilterChange('min_price', e.target.value ? parseFloat(e.target.value) : null)
                }
                step="0.01"
                min="0"
                disabled={isLoading}
              />
              <span className="price-separator">—</span>
              <input
                type="number"
                placeholder="Max $"
                value={localFilters.max_price !== null ? localFilters.max_price : ''}
                onChange={e =>
                  handleFilterChange('max_price', e.target.value ? parseFloat(e.target.value) : null)
                }
                step="0.01"
                min="0"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.in_stock === true}
                onChange={e =>
                  handleFilterChange('in_stock', e.target.checked ? true : null)
                }
                disabled={isLoading}
              />
              In Stock Only
            </label>
          </div>

          <div className="filter-group">
            <label htmlFor="min-stock">Minimum Stock</label>
            <input
              id="min-stock"
              type="number"
              placeholder="Any"
              value={localFilters.min_stock !== null ? localFilters.min_stock : ''}
              onChange={e =>
                handleFilterChange('min_stock', e.target.value ? parseInt(e.target.value) : null)
              }
              min="1"
              disabled={isLoading}
            />
          </div>

          <div className="filter-actions">
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="btn-primary"
              type="button"
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="btn-secondary"
              type="button"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
};
