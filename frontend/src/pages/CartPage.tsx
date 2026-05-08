/**
 * CartPage — full-page cart view for authenticated users.
 */

import { Link } from "react-router-dom";
import { useCartContext } from "../context/CartContext";

export function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartContext();

  if (isLoading) {
    return (
      <div className="cart-page cart-loading">
        <div className="loading-spinner" aria-label="Loading cart">Loading...</div>

        <style>{`
          .cart-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
          }

          .loading-spinner {
            padding: 2rem;
            color: var(--text-muted, #666);
            font-size: 1.1rem;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page" role="alert">
        <div className="cart-error">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
          <Link to="/products" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>

        <style>{`
          .cart-error {
            text-align: center;
            padding: 3rem 1.5rem;
            max-width: 500px;
            margin: 0 auto;
          }

          .cart-error h2 {
            color: var(--alert, #fa2d1a);
            margin-bottom: 0.5rem;
          }

          .cart-error p {
            color: var(--text-muted, #666);
            margin-bottom: 1.5rem;
          }

          .cart-error .btn {
            display: inline-block;
            margin: 0.25rem;
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius-lg, 8px);
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            min-height: 44px;
          }

          .btn-primary {
            background: var(--primary, #2e4c8c);
            color: white;
          }

          .btn-secondary {
            background: var(--accent, #fff3e1);
            color: var(--primary, #2e4c8c);
          }
        `}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="empty-icon" aria-hidden="true">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>Agregá productos desde nuestra tienda</p>
          <Link to="/products" className="btn-continue-shopping">
            Ver productos
          </Link>
        </div>

        <style>{`
          .cart-empty {
            text-align: center;
            padding: 4rem 1.5rem;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.6;
          }

          .cart-empty h2 {
            font-size: 1.5rem;
            color: var(--primary, #2e4c8c);
            margin-bottom: 0.5rem;
          }

          .cart-empty p {
            color: var(--text-muted, #666);
            margin-bottom: 2rem;
          }

          .btn-continue-shopping {
            display: inline-block;
            background: var(--primary, #2e4c8c);
            color: white;
            padding: 0.9rem 2rem;
            border-radius: var(--radius-lg, 8px);
            text-decoration: none;
            font-weight: 600;
            min-height: 44px;
            line-height: 1.5;
            transition: var(--transition-base, 0.2s);
          }

          .btn-continue-shopping:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(46, 76, 140, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Tu carrito</h1>
        <span className="cart-count">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        <button
          onClick={() => {
            if (window.confirm("Vaciar carrito?")) {
              clearCart();
            }
          }}
          className="btn-clear-cart"
          aria-label="Clear cart"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items-section">
          {items.map((item) => (
            <div key={item.id} className="cart-item" role="group" aria-label={`Item: ${item.product_name || `Product ${item.product_id}`}`}>
              <div className="cart-item-info">
                <div className="cart-item-icon" aria-hidden="true">🥕</div>
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.product_name || `Product #${item.product_id}`}</h3>
                  <span className="cart-item-price">${Number(item.unit_price).toFixed(2)} c/u</span>
                </div>
              </div>

              <div className="cart-item-qty">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="qty-btn"
                  aria-label={`Decrease quantity for ${item.product_name}`}
                  type="button"
                >−</button>
                <span className="qty-value" aria-label="current quantity">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="qty-btn"
                  aria-label={`Increase quantity for ${item.product_name}`}
                  type="button"
                >+</button>
              </div>

              <div className="cart-item-subtotal">
                ${(Number(item.unit_price) * item.quantity).toFixed(2)}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="btn-remove-item"
                aria-label={`Remove ${item.product_name || item.product_id} from cart`}
                type="button"
              >✕</button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Resumen</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${Number(subtotal).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA (10%)</span>
            <span>${Number(tax).toFixed(2)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>${Number(total).toFixed(2)}</span>
          </div>

          <p className="checkout-note">
            El checkout se implementará próximamente.
          </p>

          <Link to="/products" className="btn-continue">
            Seguir comprando
          </Link>
        </div>
      </div>

      <style>{`
        .cart-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .cart-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .cart-header h1 {
          font-size: 1.75rem;
          color: var(--primary, #2e4c8c);
          margin: 0;
        }

        .cart-count {
          color: var(--text-muted, #666);
          font-size: 0.9rem;
        }

        .btn-clear-cart {
          margin-left: auto;
          background: none;
          border: 2px solid var(--alert, #fa2d1a);
          color: var(--alert, #fa2d1a);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg, 8px);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          min-height: 44px;
          transition: var(--transition-fast, 0.15s);
        }

        .btn-clear-cart:hover {
          background: var(--alert, #fa2d1a);
          color: white;
        }

        .cart-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
        }

        .cart-items-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          background: var(--bg-card, white);
          border: 2px solid var(--border-light, #eee);
          border-radius: var(--radius-lg, 8px);
          transition: var(--transition-fast, 0.15s);
        }

        .cart-item:hover {
          border-color: var(--primary, #2e4c8c);
        }

        .cart-item-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cart-item-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .cart-item-details h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--primary, #2e4c8c);
        }

        .cart-item-price {
          font-size: 0.85rem;
          color: var(--text-muted, #666);
        }

        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 0;
          border: 2px solid var(--border-light, #eee);
          border-radius: var(--radius-lg, 8px);
          overflow: hidden;
        }

        .cart-item-qty .qty-btn {
          width: 2.2rem;
          height: 2.2rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 700;
          font-size: 1rem;
          color: var(--primary, #2e4c8c);
          min-height: 44px;
          transition: var(--transition-fast, 0.15s);
        }

        .cart-item-qty .qty-btn:hover {
          background: var(--primary-50, rgba(46, 76, 140, 0.05));
        }

        .cart-item-qty .qty-value {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
        }

        .cart-item-subtotal {
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--primary, #2e4c8c);
          min-width: 80px;
          text-align: right;
        }

        .btn-remove-item {
          background: none;
          border: none;
          color: var(--text-muted, #999);
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg, 8px);
          transition: var(--transition-fast, 0.15s);
        }

        .btn-remove-item:hover {
          background: var(--alert-light, #fff0f0);
          color: var(--alert, #fa2d1a);
        }

        /* Summary */
        .cart-summary {
          background: var(--accent, #fff3e1);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
          position: sticky;
          top: 1.5rem;
          align-self: start;
        }

        .cart-summary h2 {
          margin: 0 0 1rem;
          font-size: 1.25rem;
          color: var(--primary, #2e4c8c);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: var(--text-main, #333);
        }

        .summary-total {
          border-top: 2px solid var(--primary, #2e4c8c);
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--primary, #2e4c8c);
        }

        .checkout-note {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted, #666);
          font-style: italic;
          text-align: center;
        }

        .btn-continue {
          display: block;
          text-align: center;
          margin-top: 1rem;
          padding: 0.8rem;
          background: var(--primary, #2e4c8c);
          color: white;
          text-decoration: none;
          border-radius: var(--radius-lg, 8px);
          font-weight: 600;
          min-height: 44px;
          line-height: 1.5;
          transition: var(--transition-base, 0.2s);
        }

        .btn-continue:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(46, 76, 140, 0.3);
        }

        @media (max-width: 768px) {
          .cart-content {
            grid-template-columns: 1fr;
          }

          .cart-item {
            grid-template-columns: 1fr auto;
          }

          .cart-item-subtotal {
            text-align: left;
          }

          .cart-summary {
            position: static;
          }

          .cart-header h1 {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
}
