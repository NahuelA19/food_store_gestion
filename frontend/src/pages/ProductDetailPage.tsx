/**
 * ProductDetailPage - Single product detail view
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productApi } from "../api/productApi";
import { ProductCard } from "../components/ProductCard";
import { useProduct } from "../hooks/useProduct";
import { Product } from "../types/product";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id) : undefined;
  const { product, isLoading, error } = useProduct(productId);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const fetchRelated = async () => {
        try {
          const related = await productApi.getRelatedProducts(product.id, 4);
          setRelatedProducts(related);
        } catch (err) {
          console.error("Failed to fetch related products:", err);
        }
      };
      fetchRelated();
    }
  }, [product]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Product not found</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/products")} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="loading-container">
        <div className="spinner-icon">⏳</div>
        <p>Loading product details...</p>
      </div>
    );
  }

  const isOutOfStock = product.inventory && product.inventory.available_quantity === 0;
  const isLowStock =
    product.inventory &&
    product.inventory.available_quantity > 0 &&
    product.inventory.available_quantity <= product.inventory.low_stock_threshold;

  return (
    <div className="product-detail-page">
      <button className="back-button" onClick={() => navigate("/products")} type="button">
        ← Back to Products
      </button>

      <div className="product-detail-container">
        {/* Main Product Info */}
        <div className="product-main">
          {/* Product Image */}
          <div className="product-image-large">
            <div className="emoji-large">🥕</div>
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h1>{product.name}</h1>
            
            {product.category && (
              <p className="category">{product.category.name}</p>
            )}
            
            {product.description && (
              <p className="description">{product.description}</p>
            )}

            {/* Price */}
            <div className="price-section">
              <span className="price">${product.price.toFixed(2)}</span>
            </div>

            {/* Stock Info */}
            <div className="stock-section">
              {isOutOfStock && (
                <span className="badge badge-alert" role="status">Out of Stock</span>
              )}
              {isLowStock && (
                <span className="badge badge-warning" role="status">
                  Low Stock ({product.inventory?.available_quantity} left)
                </span>
              )}
              {!isOutOfStock && !isLowStock && (
                <span className="badge badge-success" role="status">In Stock</span>
              )}
            </div>

            {/* Stock Progress */}
            {product.inventory && (
              <div className="stock-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (product.inventory.available_quantity /
                          product.inventory.stock_quantity) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="progress-text">
                  {product.inventory.available_quantity} of {product.inventory.stock_quantity} available
                </p>
              </div>
            )}

            {/* Add to Cart */}
            {!isOutOfStock && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                    type="button"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.inventory?.available_quantity || 1}
                    className="qty-input"
                    aria-label="Quantity"
                  />
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          quantity + 1,
                          product.inventory?.available_quantity || 1
                        )
                      )
                    }
                    className="qty-btn"
                    type="button"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button className="btn-add-to-cart" type="button">Add to Cart</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Related Products</h2>
          <div className="related-grid">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => navigate(`/products/${p.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .product-detail-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-xl);
          animation: fadeIn 0.3s ease-out;
        }

        .back-button {
          background: transparent;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: var(--text-base);
          margin-bottom: var(--space-xl);
          text-decoration: none;
          font-weight: var(--font-semibold);
          transition: var(--transition-base);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-lg);
          min-height: 44px;
        }

        .back-button:hover {
          background: var(--primary-50);
          color: var(--primary-dark);
        }

        .back-button:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .error-container {
          text-align: center;
          padding: var(--space-3xl);
          background: var(--alert-light);
          border: 2px solid var(--alert);
          border-radius: var(--radius-lg);
          animation: fadeIn 0.3s ease-out;
        }

        .error-icon, .spinner-icon {
          font-size: 3rem;
          margin-bottom: var(--space-lg);
          display: block;
        }

        .error-container h2 {
          color: var(--alert-dark);
          margin-bottom: var(--space-md);
        }

        .error-container p {
          color: var(--alert);
          margin-bottom: var(--space-xl);
        }

        .loading-container {
          text-align: center;
          padding: var(--space-3xl);
        }

        .loading-container p {
          color: var(--text-muted);
          font-size: var(--text-lg);
        }

        .product-detail-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3xl);
          margin-bottom: var(--space-3xl);
          background: var(--bg-card);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
          box-shadow: var(--shadow-lg);
        }

        .product-image-large {
          background: linear-gradient(135deg, var(--primary-50), var(--accent));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 450px;
          border: 2px solid var(--border-light);
        }

        .emoji-large {
          font-size: 8rem;
          text-align: center;
        }

        .product-main h1 {
          margin: 0 0 var(--space-sm) 0;
          font-size: var(--text-4xl);
          color: var(--primary);
        }

        .category {
          margin: 0 0 var(--space-lg) 0;
          color: var(--text-muted);
          font-size: var(--text-base);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-semibold);
        }

        .description {
          margin: 0 0 var(--space-xl) 0;
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
          font-size: var(--text-lg);
        }

        .price-section {
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 2px solid var(--border-light);
        }

        .price {
          font-size: var(--text-5xl);
          font-weight: var(--font-black);
          color: var(--primary);
        }

        .stock-section {
          margin-bottom: var(--space-lg);
          display: flex;
          gap: var(--space-sm);
        }

        .badge {
          display: inline-block;
          padding: 0.5rem var(--space-md);
          border-radius: var(--radius-full);
          color: white;
          font-weight: var(--font-bold);
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-success {
          background: var(--success);
        }

        .badge-warning {
          background: var(--warning);
        }

        .badge-alert {
          background: var(--alert);
        }

        .stock-progress {
          margin-bottom: var(--space-xl);
        }

        .progress-bar {
          height: 10px;
          background: var(--border-light);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-md);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary-light));
          transition: width 0.4s ease-out;
          border-radius: var(--radius-full);
        }

        .progress-text {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: var(--font-semibold);
        }

        .add-to-cart-section {
          display: flex;
          gap: var(--space-lg);
          margin-top: var(--space-xl);
        }

        .quantity-selector {
          display: flex;
          gap: 0;
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--neutral-100);
          flex: 0 0 auto;
        }

        .qty-btn {
          width: 3.5rem;
          padding: var(--space-md);
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: var(--font-bold);
          font-size: var(--text-xl);
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
          width: 4rem;
          border: none;
          text-align: center;
          font-weight: var(--font-bold);
          font-size: var(--text-lg);
          background: transparent;
          color: var(--text-main);
          min-height: 44px;
        }

        .qty-input:focus {
          outline: none;
          background: var(--primary-50);
        }

        .btn-add-to-cart {
          flex: 1;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          border: none;
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-weight: var(--font-bold);
          font-size: var(--text-lg);
          transition: var(--transition-base);
          min-height: 44px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-add-to-cart:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(46, 76, 140, 0.3);
        }

        .btn-add-to-cart:active {
          transform: translateY(0);
        }

        .related-products {
          border-top: 2px solid var(--border-light);
          padding-top: var(--space-2xl);
        }

        .related-products h2 {
          color: var(--primary);
          margin-bottom: var(--space-xl);
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-xl);
        }

        @media (max-width: 768px) {
          .product-detail-page {
            padding: var(--space-lg);
          }

          .product-detail-container {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
            padding: var(--space-lg);
          }

          .product-image-large {
            min-height: 350px;
          }

          .emoji-large {
            font-size: 6rem;
          }

          .product-main h1 {
            font-size: var(--text-3xl);
          }

          .price {
            font-size: var(--text-3xl);
          }

          .add-to-cart-section {
            flex-direction: column;
          }

          .quantity-selector {
            width: 100%;
          }

          .qty-btn {
            width: auto;
            flex: 1;
          }

          .qty-input {
            width: auto;
            flex: 1;
          }

          .related-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }
        }

        @media (max-width: 480px) {
          .product-detail-container {
            padding: var(--space-md);
          }

          .product-image-large {
            min-height: 280px;
          }

          .emoji-large {
            font-size: 5rem;
          }

          .product-main h1 {
            font-size: var(--text-2xl);
          }

          .price {
            font-size: var(--text-2xl);
          }

          .related-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};
