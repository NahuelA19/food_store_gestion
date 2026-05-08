/**
 * ProductsPage - Main product browsing page with full-text search and advanced filters
 */

import { useSearch } from '../hooks/useSearch';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { SearchResults } from '../components/SearchResults';
import '../styles/ProductsPage.css';

export function ProductsPage() {
  const {
    query,
    filters,
    items,
    pagination,
    loading,
    error,
    categories,
    setQuery,
    setFilters,
    setPage,
    resetFilters,
    clearSearch,
  } = useSearch();

  return (
    <div className="products-page">
      <header className="page-header">
        <h1>Products</h1>
        <p>Browse our collection of fresh food products</p>
      </header>

      <div className="search-section">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          isLoading={loading}
        />
      </div>

      <div className="content">
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
            categories={categories}
            isLoading={loading}
          />
        </aside>

        <main className="results">
          <SearchResults
            items={items}
            pagination={pagination}
            loading={loading}
            error={error}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}
