import { useState, useEffect, useRef, ChangeEvent, FC } from 'react';
import { debounce } from 'lodash';
import '../styles/SearchBar.css';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Search products...',
  autoFocus = true,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedRef = useRef(debounce(onChange, 300));

  // Update debounced function when onChange changes
  useEffect(() => {
    debouncedRef.current = debounce(onChange, 300);
  }, [onChange]);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedRef.current(newValue);
  }

  function handleClear() {
    setLocalValue('');
    onClear();
  }

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="search-input"
        aria-label="Search products"
      />
      {localValue && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="clear-btn"
          type="button"
        >
          ✕
        </button>
      )}
      {isLoading && <span className="spinner" aria-label="Loading" />}
    </div>
  );
};
