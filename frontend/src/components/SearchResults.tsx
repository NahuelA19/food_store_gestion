import { FC } from 'react';
import { Product } from '../hooks/useSearch';
import { PaginationInfo } from '../hooks/useSearch';
import '../styles/SearchResults.css';

export interface SearchResultsProps {
  items: Product[];
  pagination: PaginationInfo;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
}

const ProductCardSkeleton: FC = () => (
  <div className="product-card skeleton">
    <div className="skeleton-image"></div>
    <div className="skeleton-text"></div>
    <div className="skeleton-text short"></div>
  </div>
);

const ProductCard: FC<{ product: Product }> = ({ product }) => (
  <div className="product-card">
    <div className="product-info">
      <h3 className="product-name">{product.name}</h3>
      <p className="product-description">{product.description?.substring(0, 100)}</p>
      <div className="product-meta">
        <span className="product-price">${parseFloat(product.price.toString()).toFixed(2)}</span>
        {product.inventory && (
          <span className={`stock-status ${product.inventory.stock_quantity > product.inventory.low_stock_threshold ? 'in-stock' : 'low-stock'}`}>
            {product.inventory.stock_quantity > product.inventory.low_stock_threshold
              ? 'In Stock'
              : `Low Stock (${product.inventory.stock_quantity})`}
          </span>
        )}
      </div>
    </div>
  </div>
);

export const SearchResults: FC<SearchResultsProps> = ({
  items,
  pagination,
  loading,
  error,
  onPageChange,
}) => {
  if (error) {
    return (
      <div className="search-error">
        <p>⚠️ {error}</p>
        <p className="text-muted">Please try again or contact support.</p>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="results-container">
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="no-results">
        <p>🔍 No products found</p>
        <p className="text-muted">Try clearing your filters or searching for something else.</p>
      </div>
    );
  }

  return (
    <div className="results-section">
      <div className="results-count">
        Showing {items.length} of {pagination.total} products
      </div>

      <div className="results-grid">
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.has_previous}
          className="btn-pagination"
          type="button"
        >
          ← Previous
        </button>

        <span className="page-info">
          Page {pagination.page} of {pagination.total_pages}
        </span>

        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.has_next}
          className="btn-pagination"
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
