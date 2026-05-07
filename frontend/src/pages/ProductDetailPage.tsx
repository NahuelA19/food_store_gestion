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
        <p>Product not found: {error}</p>
        <button onClick={() => navigate("/products")}>Back to Products</button>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="loading-container">
        <p>Loading product...</p>
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
      <button className="back-button" onClick={() => navigate("/products")}>
        ← Back to Products
      </button>

      <div className="product-detail-container">
        {/* Main Product Info */}
        <div className="product-main">
          {/* Product Image */}
          <div className="product-image-large">
            <div style={{ fontSize: "120px", textAlign: "center" }}>🥕</div>
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h1>{product.name}</h1>
            <p className="category">{product.category?.name}</p>
            <p className="description">{product.description}</p>

            {/* Price */}
            <div className="price-section">
              <span className="price">${product.price.toFixed(2)}</span>
            </div>

            {/* Stock Info */}
            <div className="stock-section">
              {isOutOfStock && <div className="badge-danger">Out of Stock</div>}
              {isLowStock && (
                <div className="badge-warning">
                  Low Stock ({product.inventory?.available_quantity} left)
                </div>
              )}
              {!isOutOfStock && !isLowStock && (
                <div className="badge-success">In Stock</div>
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
                  {product.inventory.available_quantity} of{" "}
                  {product.inventory.stock_quantity} available
                </p>
              </div>
            )}

            {/* Add to Cart */}
            {!isOutOfStock && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.inventory?.available_quantity || 1}
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
                  >
                    +
                  </button>
                </div>
                <button className="btn-add-to-cart">Add to Cart</button>
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
          padding: 20px;
        }

        .back-button {
          background: none;
          border: none;
          color: #2c3e50;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 20px;
          text-decoration: underline;
        }

        .product-detail-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .product-image-large {
          background: #f5f5f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .product-main h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }

        .category {
          margin: 0 0 16px;
          color: #666;
          font-size: 14px;
        }

        .description {
          margin: 0 0 24px;
          color: #666;
          line-height: 1.6;
          font-size: 15px;
        }

        .price-section {
          margin-bottom: 24px;
        }

        .price {
          font-size: 32px;
          font-weight: 700;
          color: #2c3e50;
        }

        .stock-section {
          margin-bottom: 16px;
        }

        .badge-success,
        .badge-warning,
        .badge-danger {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          font-size: 13px;
        }

        .badge-success {
          background: #4caf50;
        }

        .badge-warning {
          background: #ff9800;
        }

        .badge-danger {
          background: #f44336;
        }

        .stock-progress {
          margin-bottom: 24px;
        }

        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s;
        }

        .progress-text {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .add-to-cart-section {
          display: flex;
          gap: 12px;
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
          padding: 8px 12px;
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
          width: 60px;
        }

        .btn-add-to-cart {
          flex: 1;
          background: #2c3e50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s;
        }

        .btn-add-to-cart:hover {
          background: #1a252f;
        }

        .related-products {
          border-top: 2px solid #f0f0f0;
          padding-top: 40px;
        }

        .related-products h2 {
          margin-bottom: 24px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .error-container,
        .loading-container {
          text-align: center;
          padding: 40px;
        }

        .error-container button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #2c3e50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .product-detail-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .product-image-large {
            min-height: 300px;
          }

          .product-main h1 {
            font-size: 22px;
          }

          .price {
            font-size: 24px;
          }

          .related-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};
