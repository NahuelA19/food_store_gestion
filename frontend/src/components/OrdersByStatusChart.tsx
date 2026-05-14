/**
 * OrdersByStatusChart — Pie chart showing distribution of orders by status
 *
 * Uses Recharts to render a donut chart. Displays in the admin dashboard
 * to give at-a-glance visibility into order status distribution.
 */

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export interface OrdersByStatusChartProps {
  data: Record<string, number>;
}

/* ─── Color palette for statuses ───
 *
 * Keys are LOWERCASE because the dashboard endpoint normalizes with
 * LOWER(status::text) so the frontend receives consistent lowercase keys.
 * Both English and Spanish variants are covered for robustness.
 */

const STATUS_COLORS: Record<string, string> = {
  // Pendiente / Pending
  pendiente: "#f59e0b",
  pending: "#f59e0b",

  // Pago pendiente
  pago_pendiente: "#f59e0b",
  payment_pending: "#f59e0b",

  // Pagado / Paid
  pagado: "#10b981",
  paid: "#10b981",

  // Pago fallido
  pago_fallido: "#ef4444",
  payment_failed: "#ef4444",

  // Confirmado / Confirmed
  confirmado: "#3b82f6",
  confirmed: "#3b82f6",

  // En preparación / Preparando / Preparing
  preparando: "#8b5cf6",
  en_prep: "#8b5cf6",

  // Listo / Ready
  listo: "#10b981",

  // En camino / Enviado / Shipped
  en_camino: "#06b6d4",
  shipped: "#06b6d4",

  // Entregado / Delivered
  entregado: "#059669",
  delivered: "#059669",

  // Cancelado / Cancelled
  cancelado: "#ef4444",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  pending: "Pendiente",
  pago_pendiente: "Pago Pendiente",
  payment_pending: "Pago Pendiente",
  pagado: "Pagado",
  paid: "Pagado",
  pago_fallido: "Pago Fallido",
  payment_failed: "Pago Fallido",
  confirmado: "Confirmado",
  confirmed: "Confirmado",
  preparando: "Preparando",
  en_prep: "En Preparación",
  listo: "Listo",
  en_camino: "En Camino",
  shipped: "Enviado",
  entregado: "Entregado",
  delivered: "Entregado",
  cancelado: "Cancelado",
  cancelled: "Cancelado",
};

const DEFAULT_COLOR = "#6b7280";

/** Merge status synonyms that represent the same business state. */
function normalizeData(data: Record<string, number>): Record<string, number> {
  const MERGE_MAP: Record<string, string> = {
    pending: "pendiente",
  };
  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(data)) {
    const canonical = MERGE_MAP[key] ?? key;
    result[canonical] = (result[canonical] ?? 0) + count;
  }
  return result;
}

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const normalized = normalizeData(data);
  const chartData = Object.entries(normalized).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || DEFAULT_COLOR,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border">
        <p className="text-sm text-text-muted">Sin datos de pedidos</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            formatter={(value) => [`${value} pedido(s)`, undefined]}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-text-primary">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
