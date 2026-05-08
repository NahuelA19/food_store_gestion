import { useState, useCallback, useEffect, ChangeEvent, FC } from 'react';
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

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 300),
    [onChange]
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
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
