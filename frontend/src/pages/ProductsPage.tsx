import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useSearch } from '../hooks/useSearch';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { SearchResults } from '../components/SearchResults';
import { useAuthStore } from '../store/authStore';
import { useWishlist } from '../hooks/useWishlist';
import { useCartContext } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
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
  const { items: wishlistItems, toggle } = useWishlist();
  const { addItem } = useCartContext();
  const { toast } = useToast();

  const isCustomer = !user?.role || user.role.toLowerCase() === 'customer' || user.role.toLowerCase() === 'client';

  // Base set from server data, plus optimistic local overrides for instant feedback
  const baseFavIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.product_id)),
    [wishlistItems],
  );
  const [optimisticFavs, setOptimisticFavs] = useState<Set<number> | null>(null);
  const favoriteIds = optimisticFavs ?? baseFavIds;

  // When server data catches up with optimistic state, clear the overlay
  useEffect(() => {
    if (!optimisticFavs) return;
    let shouldClear = true;
    for (const id of optimisticFavs) {
      if (baseFavIds.has(id) !== optimisticFavs.has(id)) {
        shouldClear = false;
        break;
      }
    }
    if (shouldClear) setOptimisticFavs(null);
  }, [baseFavIds, optimisticFavs]);

  const handleToggleFavorite = async (productId: number) => {
    setOptimisticFavs((prev) => {
      const current = prev ?? baseFavIds;
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    await toggle(productId);
  };

  const handleAddToCart = async (productId: number, quantity: number) => {
    await addItem(productId, quantity);
    toast('Producto agregado al carrito', 'success');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Productos</h1>
          <p className="mt-1 text-text-muted">Explorá nuestra selección de productos frescos</p>
        </div>
        {user?.role?.toLowerCase() === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/products/new')}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              <PlusCircle size={16} />
              Nuevo Producto
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
          placeholder="Buscar productos..."
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
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={isCustomer ? handleAddToCart : undefined}
          />
        </main>
      </div>
    </div>
  );
}
