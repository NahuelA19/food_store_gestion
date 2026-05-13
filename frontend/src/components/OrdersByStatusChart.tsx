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

/* ─── Color palette for statuses ─── */

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  ready: "#10b981",
  shipped: "#06b6d4",
  delivered: "#059669",
  cancelled: "#ef4444",
  payment_pending: "#f59e0b",
  payment_failed: "#ef4444",
  paid: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  payment_pending: "Pendiente",
  payment_failed: "Pago Fallido",
  paid: "Pagado",
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const DEFAULT_COLOR = "#6b7280";

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const chartData = Object.entries(data).map(([status, count]) => ({
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
