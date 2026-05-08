/**
 * SearchInput component - Debounced search for products
 */

import React, { useEffect, useState } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        role="searchbox"
        aria-label="Search products"
        style={{
          width: "100%",
          padding: "8px 12px",
          paddingRight: "32px",
          borderRadius: "4px",
          border: "1px solid #ddd",
          fontSize: "14px",
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ×
        </button>
      )}

      <style>{`
        .search-input-wrapper {
          position: relative;
          width: 100%;
        }
      `}</style>
    </div>
  );
};
