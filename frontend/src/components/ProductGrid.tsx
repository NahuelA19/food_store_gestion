/**
 * ProductGrid component - Display products in a responsive grid
 */

import React from "react";
import { Product } from "../types/product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  error?: string | null;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onRetry?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  error,
  onProductClick,
  onAddToCart,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="product-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="product-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-products-state">
        <div className="empty-icon">🍕</div>
        <h3>No products found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onClick={() => onProductClick?.(product)}
        />
      ))}

      <style>{`
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-xl);
          padding: var(--space-lg) 0;
          animation: fadeIn 0.3s ease-out;
        }

        .error-state {
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
          background: var(--alert-light);
          border: 2px solid var(--alert);
          border-radius: var(--radius-lg);
          animation: fadeIn 0.3s ease-out;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: var(--space-lg);
        }

        .error-state h3 {
          color: var(--alert-dark);
          margin-bottom: var(--space-md);
        }

        .error-state p {
          color: var(--alert);
          margin-bottom: var(--space-lg);
        }

        .error-state button {
          margin-top: var(--space-md);
        }

        .no-products-state {
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
          background: linear-gradient(135deg, var(--primary-50), rgba(255, 243, 225, 0.3));
          border: 2px dashed var(--primary);
          border-radius: var(--radius-lg);
          animation: fadeIn 0.3s ease-out;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-lg);
          display: block;
        }

        .no-products-state h3 {
          color: var(--primary);
          margin-bottom: var(--space-md);
        }

        .no-products-state p {
          color: var(--text-muted);
        }

        .product-skeleton {
          padding: var(--space-lg);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          animation: pulse 2s infinite;
        }

        .skeleton-image {
          height: 160px;
          background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-lg);
        }

        .skeleton-text {
          height: 14px;
          background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-md);
        }

        .skeleton-text.short {
          width: 60%;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @media (max-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: var(--space-lg);
          }
        }

        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: var(--space-lg);
          }
        }

        @media (max-width: 480px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: var(--space-md);
          }

          .product-skeleton {
            padding: var(--space-md);
          }
        }
      `}</style>
    </div>
  );
};
