import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { useRecommendations } from "../hooks/useRecommendations";
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { SearchResults } from '../components/SearchResults';
import { ProductCard } from "../components/ProductCard";

export function ProductsPage() {
  const navigate = useNavigate();
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
  const { trending, loading: trendingLoading } = useRecommendations(8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Products</h1>
        <p className="mt-1 text-text-secondary">Browse our collection of fresh food products</p>
      </header>

      {trending.length > 0 && !trendingLoading && (
        <section className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold text-text-primary">Trending Now 🔥</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {trending.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => navigate(`/products/${p.id}`)}
              />
            ))}
          </div>
        </section>
      )}

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
          />
        </main>
      </div>
    </div>
  );
}
