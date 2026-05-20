/**
 * ChefDashboard.jsx
 *
 * Kitchen Display System (KDS) dashboard for chefs.
 * Real-time order management with Kanban-style layout.
 *
 * Implements RN-CO01, RN-CO02: display CONFIRMADO and EN_PREP orders
 * Implements RN-CO05, RN-CO06: real-time updates via WebSocket
 *
 * Design: Industrial minimalism with high-contrast typography.
 * Dark theme for reduced eye strain in kitchen environment.
 * Three-column Kanban: CONFIRMADO → EN_PREP → (Auto-removal at EN_CAMINO)
 */

import { useState, useMemo } from "react";
import { useKitchenSocket } from "../hooks/useKitchenSocket";
import OrderCard from "../components/OrderCard/OrderCard";
import UrgencyTimer from "../components/UrgencyTimer/UrgencyTimer";
import "./ChefDashboard.css";

function ChefDashboard() {
  const { orders, isLoading, isConnected, error, refetch } = useKitchenSocket();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Group orders by estado_codigo
  const groupedOrders = useMemo(() => {
    return {
      CONFIRMADO: orders.filter((o) => o.estado_codigo === "CONFIRMADO"),
      EN_PREP: orders.filter((o) => o.estado_codigo === "EN_PREP"),
    };
  }, [orders]);

  return (
    <div className="chef-dashboard">
      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-content">
          <h1 className="kds-title">Kitchen Display System</h1>
          <div className="kds-status-bar">
            <span className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}>
              <span className="status-dot"></span>
              {isConnected ? "Connected" : "Offline - Polling"}
            </span>
            <span className="order-count">{orders.length} orders in queue</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="kds-actions">
          <button
            onClick={refetch}
            className="btn btn-secondary"
            disabled={isLoading}
            aria-label="Refresh orders"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={refetch} className="btn btn-small">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && orders.length === 0 && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading kitchen orders...</p>
        </div>
      )}

      {/* Kanban layout */}
      {!isLoading || orders.length > 0 ? (
        <div className="kanban-container">
          {/* Column 1: CONFIRMADO (newly arrived) */}
          <div className="kanban-column">
            <div className="kanban-header">
              <h2>Confirmadas</h2>
              <span className="badge">{groupedOrders.CONFIRMADO.length}</span>
            </div>
            <div className="kanban-cards">
              {groupedOrders.CONFIRMADO.length === 0 ? (
                <div className="empty-state">
                  <p>No pending orders</p>
                </div>
              ) : (
                groupedOrders.CONFIRMADO.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrderId === order.id}
                    onToggleExpand={() =>
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: EN_PREP (being cooked) */}
          <div className="kanban-column">
            <div className="kanban-header">
              <h2>Preparing</h2>
              <span className="badge">{groupedOrders.EN_PREP.length}</span>
            </div>
            <div className="kanban-cards">
              {groupedOrders.EN_PREP.length === 0 ? (
                <div className="empty-state">
                  <p>No orders in prep</p>
                </div>
              ) : (
                groupedOrders.EN_PREP.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrderId === order.id}
                    onToggleExpand={() =>
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Info/Help */}
          <div className="kanban-column info-column">
            <div className="kanban-header">
              <h2>Guide</h2>
            </div>
            <div className="kanban-info">
              <div className="info-section">
                <h3>Urgency Colors</h3>
                <div className="urgency-legend">
                  <div className="legend-item">
                    <span className="color green"></span>
                    <p>&lt;5 min</p>
                  </div>
                  <div className="legend-item">
                    <span className="color yellow"></span>
                    <p>5-10 min</p>
                  </div>
                  <div className="legend-item">
                    <span className="color orange"></span>
                    <p>10-15 min</p>
                  </div>
                  <div className="legend-item">
                    <span className="color red"></span>
                    <p>&gt;15 min</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Actions</h3>
                <ul className="action-list">
                  <li>Click "Start Prep" to begin cooking</li>
                  <li>Click "Ready" to mark as complete</li>
                  <li>Orders auto-remove when dispatched</li>
                </ul>
              </div>

              <div className="info-section">
                <h3>Status</h3>
                <p className="status-text">
                  🔴 <strong>WS:</strong> {isConnected ? "Live" : "Offline"}
                </p>
                <p className="status-text">
                  📊 <strong>Queue:</strong> {orders.length} orders
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ChefDashboard;
