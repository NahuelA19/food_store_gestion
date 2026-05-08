/**
 * ProductCard component - Display single product in grid
 */

import React from "react";
import { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
}) => {
  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
  };

  const isOutOfStock = product.inventory && product.inventory.available_quantity === 0;
  const isLowStock =
    product.inventory &&
    product.inventory.available_quantity > 0 &&
    product.inventory.available_quantity <= product.inventory.low_stock_threshold;

  return (
    <div 
      className="product-card-container" 
      onClick={onClick} 
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Product Image */}
      <div className="product-image" aria-label={`${product.name} image`}>
        <div className="emoji-placeholder">🥕</div>
      </div>

      {/* Product Info */}
      <div className="product-details">
        <h3 className="product-title">{product.name}</h3>
        
        {product.category && (
          <p className="product-category">{product.category.name}</p>
        )}
        
        {product.description && (
          <p className="product-desc">
            {product.description.substring(0, 80)}
            {product.description.length > 80 ? "..." : ""}
          </p>
        )}

        {/* Price */}
        <div className="price-row">
          <span className="price" aria-label={`Price: $${product.price.toFixed(2)}`}>
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Stock Status Badge */}
        <div className="stock-badges">
          {isOutOfStock && (
            <span className="badge badge-alert" role="status" aria-label="Out of stock">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="badge badge-warning" role="status" aria-label={`Low stock: ${product.inventory?.available_quantity} remaining`}>
              Low Stock
            </span>
          )}
          {!isOutOfStock && !isLowStock && product.is_available && (
            <span className="badge badge-success" role="status" aria-label="In stock">
              In Stock
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {!isOutOfStock && (
          <div className="add-to-cart-wrapper">
            <div className="qty-selector">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="qty-btn"
                aria-label="Decrease quantity"
                type="button"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                }}
                min="1"
                max={product.inventory?.available_quantity || 1}
                className="qty-input"
                aria-label="Quantity"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(
                    Math.min(
                      quantity + 1,
                      product.inventory?.available_quantity || 1
                    )
                  );
                }}
                className="qty-btn"
                aria-label="Increase quantity"
                type="button"
              >
                +
              </button>
            </div>
            <button
              className="btn-add-cart"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              type="button"
              aria-label={`Add ${quantity} ${product.name} to cart`}
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        .product-card-container {
          background: var(--bg-card);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: var(--transition-base);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-shadow: var(--shadow-sm);
        }

        .product-card-container:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
          border-color: var(--primary);
        }

        .product-image {
          background: linear-gradient(135deg, var(--primary-50), var(--accent));
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .emoji-placeholder {
          font-size: 4rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .product-details {
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .product-title {
          margin: 0 0 var(--space-xs) 0;
          font-size: var(--text-base);
          font-weight: var(--font-bold);
          color: var(--primary);
          line-height: var(--leading-tight);
          transition: var(--transition-fast);
        }

        .product-card-container:hover .product-title {
          color: var(--primary-dark);
        }

        .product-category {
          margin: 0 0 var(--space-sm) 0;
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-desc {
          margin: 0 0 var(--space-md) 0;
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: var(--leading-normal);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .price-row {
          margin-bottom: var(--space-md);
          padding-bottom: var(--space-md);
          border-bottom: 2px solid var(--border-light);
        }

        .price {
          font-size: var(--text-2xl);
          font-weight: var(--font-black);
          color: var(--primary);
          display: block;
        }

        .stock-badges {
          margin-bottom: var(--space-md);
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .badge {
          display: inline-block;
          padding: 0.3rem var(--space-sm);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .badge-success {
          background: var(--success-light);
          color: var(--success-dark);
        }

        .badge-warning {
          background: var(--warning-light);
          color: var(--warning-dark);
        }

        .badge-alert {
          background: var(--alert-light);
          color: var(--alert-dark);
        }

        .add-to-cart-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-top: auto;
        }

        .qty-selector {
          display: flex;
          gap: 0;
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--neutral-100);
        }

        .qty-btn {
          flex: 0 0 auto;
          width: 2.5rem;
          padding: var(--space-sm);
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: var(--font-bold);
          font-size: var(--text-lg);
          color: var(--primary);
          transition: var(--transition-fast);
          min-height: 44px;
        }

        .qty-btn:hover {
          background: var(--primary-50);
        }

        .qty-btn:active {
          background: var(--primary);
          color: white;
        }

        .qty-input {
          flex: 1;
          border: none;
          text-align: center;
          font-weight: var(--font-bold);
          font-size: var(--text-base);
          background: transparent;
          color: var(--text-main);
        }

        .qty-input:focus {
          outline: none;
        }

        .btn-add-cart {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          border: none;
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-weight: var(--font-bold);
          transition: var(--transition-base);
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          min-height: 44px;
        }

        .btn-add-cart:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(46, 76, 140, 0.3);
        }

        .btn-add-cart:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .product-image {
            height: 140px;
          }

          .emoji-placeholder {
            font-size: 3.5rem;
          }

          .product-title {
            font-size: var(--text-sm);
          }

          .price {
            font-size: var(--text-xl);
          }
        }

        @media (max-width: 480px) {
          .product-details {
            padding: var(--space-md);
          }

          .product-image {
            height: 120px;
          }

          .emoji-placeholder {
            font-size: 3rem;
          }

          .product-title {
            font-size: var(--text-xs);
          }

          .product-desc {
            font-size: var(--text-xs);
          }

          .price {
            font-size: var(--text-lg);
          }
        }
      `}</style>
    </div>
  );
};
