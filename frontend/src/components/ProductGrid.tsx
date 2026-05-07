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
        <p>{error}</p>
        {onRetry && <button onClick={onRetry}>Retry</button>}
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
      <div className="no-products">
        <p>No products found</p>
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
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          padding: 20px 0;
        }

        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
          }
        }

        .error-state {
          padding: 40px;
          text-align: center;
          color: #f44336;
        }

        .error-state button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .no-products {
          padding: 40px;
          text-align: center;
          color: #999;
        }

        .product-skeleton {
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          animation: pulse 2s infinite;
        }

        .skeleton-image {
          height: 120px;
          background: #f0f0f0;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .skeleton-text {
          height: 12px;
          background: #f0f0f0;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skeleton-text.short {
          width: 60%;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};
