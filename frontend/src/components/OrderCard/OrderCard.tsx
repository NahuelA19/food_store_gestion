/**
 * OrderCard.tsx
 *
 * Presentational component for displaying a single order in the KDS.
 * Shows order details (items, notes) with urgency timer.
 * Integrates with UrgencyTimer for color-coded urgency display.
 * Provides action buttons (Start Prep, Mark Ready, Cancel).
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../../api/orderApi";
import UrgencyTimer from "../UrgencyTimer/UrgencyTimer";
import type { KitchenOrder } from "../../types/kitchen";
import "./OrderCard.css";

interface OrderCardProps {
  order: KitchenOrder;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function OrderCard({ order, isExpanded, onToggleExpand }: OrderCardProps) {
  const queryClient = useQueryClient();
  const [isActioning, setIsActioning] = useState(false);

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: "preparando" | "listo") =>
      orderApi.updateOrderStatus(order.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
      setIsActioning(false);
    },
    onError: (error) => {
      console.error("Failed to update order status:", error);
      setIsActioning(false);
    },
  });

  const handleStartPrep = async () => {
    setIsActioning(true);
    await updateStatusMutation.mutateAsync("preparando");
  };

  const handleMarkReady = async () => {
    setIsActioning(true);
    await updateStatusMutation.mutateAsync("listo");
  };

  const totalItems = order.items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className={`order-card ${order.estado_codigo.toLowerCase()} ${isExpanded ? "expanded" : ""}`}>
      {/* Card Header: Order ID + Urgency Timer */}
      <div className="order-card-header" onClick={onToggleExpand} role="button" tabIndex={0}>
        <div className="order-id-section">
          <span className="order-id">#{order.id}</span>
          <span className="item-count">{totalItems} items</span>
        </div>

        <UrgencyTimer kitchenEntryAt={order.kitchen_entry_at} />

        <div className="expand-indicator">{isExpanded ? "▼" : "▶"}</div>
      </div>

      {/* Card Body: Items and Actions (collapsible) */}
      {isExpanded && (
        <div className="order-card-body">
          {/* Items list */}
          <div className="items-section">
            <h4 className="section-title">Items</h4>
            <ul className="items-list">
              {order.items.map((item) => (
                <li key={item.id} className="item-entry">
                  <span className="item-quantity">{item.cantidad}×</span>
                  <span className="item-name">{item.nombre_snapshot}</span>
                  <span className="item-price">${item.precio_snapshot.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          {order.notas && (
            <div className="notes-section">
              <h4 className="section-title">Notes</h4>
              <p className="notes-text">{order.notas}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="action-buttons">
            {order.estado_codigo === "CONFIRMADO" && (
              <button
                className="btn btn-primary"
                onClick={handleStartPrep}
                disabled={isActioning || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Starting..." : "Start Prep"}
              </button>
            )}

            {order.estado_codigo === "EN_PREP" && (
              <button
                className="btn btn-primary"
                onClick={handleMarkReady}
                disabled={isActioning || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Marking..." : "Ready"}
              </button>
            )}
          </div>

          {/* Error display */}
          {updateStatusMutation.error && (
            <div className="error-message">
              <p>{(updateStatusMutation.error as Error).message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
