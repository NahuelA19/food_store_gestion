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
    <div className="product-card" onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Product Image Placeholder */}
      <div className="product-image-placeholder">
        <div style={{ fontSize: "48px", textAlign: "center", paddingTop: "40px" }}>
          🥕
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category">{product.category?.name}</p>
        <p className="product-description">
          {product.description?.substring(0, 60)}
          {product.description && product.description.length > 60 ? "..." : ""}
        </p>

        {/* Price */}
        <div className="product-price">${product.price.toFixed(2)}</div>

        {/* Stock Status */}
        <div className="stock-status">
          {isOutOfStock && <span className="badge-danger">Out of Stock</span>}
          {isLowStock && <span className="badge-warning">Low Stock</span>}
          {!isOutOfStock && !isLowStock && product.is_available && (
            <span className="badge-success">In Stock</span>
          )}
        </div>

        {/* Add to Cart */}
        {!isOutOfStock && (
          <div className="add-to-cart">
            <div className="quantity-selector">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
              >
                -
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
              >
                +
              </button>
            </div>
            <button
              className="btn-add-to-cart"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        .product-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
          background: white;
        }

        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .product-image-placeholder {
          background: #f5f5f5;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-info {
          padding: 16px;
        }

        .product-name {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .product-category {
          margin: 0 0 4px;
          font-size: 12px;
          color: #666;
        }

        .product-description {
          margin: 0 0 12px;
          font-size: 13px;
          color: #999;
          line-height: 1.4;
        }

        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .stock-status {
          margin-bottom: 12px;
        }

        .badge-success {
          background: #4caf50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-warning {
          background: #ff9800;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-danger {
          background: #f44336;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .add-to-cart {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quantity-selector {
          display: flex;
          gap: 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .quantity-selector button {
          flex: 1;
          padding: 4px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          font-weight: 600;
        }

        .quantity-selector button:hover {
          background: #efefef;
        }

        .quantity-selector input {
          flex: 1;
          border: none;
          text-align: center;
          font-weight: 600;
        }

        .btn-add-to-cart {
          background: #2c3e50;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .btn-add-to-cart:hover {
          background: #1a252f;
        }
      `}</style>
    </div>
  );
};
