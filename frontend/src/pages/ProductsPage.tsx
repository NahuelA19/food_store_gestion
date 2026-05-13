import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { SearchResults } from '../components/SearchResults';
import { useAuthStore } from '../store/authStore';
import { PlusCircle } from 'lucide-react';

export function ProductsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Products</h1>
          <p className="mt-1 text-text-secondary">Browse our collection of fresh food products</p>
        </div>
        {user?.role === "admin" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/products/new")}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              <PlusCircle size={16} />
              New Product
            </button>
          </div>
        )}
      </header>

      <div className="mb-8">
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
            categories={categories}
            isLoading={loading}
          />
        </aside>

        <main>
          <SearchResults
            items={items}
            pagination={pagination}
            loading={loading}
            error={error}
            onPageChange={setPage}
            onProductClick={(id) => navigate(`/products/${id}`)}
          />
        </main>
      </div>
    </div>
  );
}
