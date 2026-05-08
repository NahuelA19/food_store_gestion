/**
 * CartBadge component — shows item count in navbar.
 */

import { Link } from "react-router-dom";
import { useCartContext } from "../../context/CartContext";

export function CartBadge() {
  const { itemCount } = useCartContext();

  return (
    <Link to="/cart" className="cart-badge" aria-label={`Cart with ${itemCount} items`}>
      <span className="cart-badge-icon" aria-hidden="true">🛒</span>
      {itemCount > 0 && (
        <span className="cart-badge-count" aria-hidden="true">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}

      <style>{`
        .cart-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          min-width: 44px;
          min-height: 44px;
          padding: 0.5rem;
          color: var(--text-main, #333);
          transition: var(--transition-fast, 0.2s);
          border-radius: var(--radius-lg, 8px);
        }

        .cart-badge:hover {
          background: var(--primary-50, rgba(46, 76, 140, 0.05));
        }

        .cart-badge:focus-visible {
          outline: 2px solid var(--primary, #2e4c8c);
          outline-offset: 2px;
        }

        .cart-badge-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .cart-badge-count {
          position: absolute;
          top: 0;
          right: -2px;
          background: var(--alert, #fa2d1a);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 1.2rem;
          height: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 0.25rem;
          line-height: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          animation: badge-pop 0.3s ease-out;
        }

        @keyframes badge-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Link>
  );
}
