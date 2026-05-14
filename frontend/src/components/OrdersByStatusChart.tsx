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
 * Keys are LOWERCASE. Before lookup, each incoming key is lowercased so
 * this works regardless of whether the backend returns UPPERCASE enum
 * names or already-normalized lowercase (via LOWER()).
 *
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
  pendiente: "Pendiente de Pago",
  pending: "Pendiente de Pago",
  pago_pendiente: "Pendiente de Pago",
  payment_pending: "Pendiente de Pago",
  pagado: "Pagado",
  paid: "Pagado",
  pago_fallido: "Pago Fallido",
  payment_failed: "Pago Fallido",
  confirmado: "Confirmado",
  confirmed: "Confirmado",
  preparando: "Preparando",
  en_prep: "En Preparación",
  listo: "Listo",
  en_camino: "Enviado",
  shipped: "Enviado",
  entregado: "Entregado",
  delivered: "Entregado",
  cancelado: "Cancelado",
  cancelled: "Cancelado",
};

const DEFAULT_COLOR = "#6b7280";

/** Normalize incoming keys: lowercase and merge synonyms. */
function normalizeData(data: Record<string, number>): Record<string, number> {
  const CANONICAL_MAP: Record<string, string> = {
    // Pendiente
    pending: "pendiente",
    pendiente: "pendiente",
    pago_pendiente: "pendiente",
    payment_pending: "pendiente",
    
    // Confirmado
    confirmed: "confirmado",
    confirmado: "confirmado",
    
    // Enviado / En camino
    shipped: "en_camino",
    en_camino: "en_camino",
    enviado: "en_camino",
    
    // Entregado
    delivered: "entregado",
    entregado: "entregado",
    
    // Cancelado
    cancelled: "cancelado",
    cancelado: "cancelado",
  };

  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase();
    const canonical = CANONICAL_MAP[normalizedKey] || normalizedKey;
    result[canonical] = (result[canonical] ?? 0) + count;
  }
  return result;
}

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const normalized = normalizeData(data);
  
  // Define canonical order for consistent legend
  const CANONICAL_STATUSES = ["pendiente", "confirmado", "en_camino", "entregado", "cancelado"];
  
  const allData = CANONICAL_STATUSES.map((status) => ({
    name: STATUS_LABELS[status] || status,
    value: normalized[status] || 0,
    color: STATUS_COLORS[status] || DEFAULT_COLOR,
  }));

  // Filter for Pie segments (hide 0s) but we can keep all for Legend if needed
  // However, Recharts Pie usually works better if we only pass non-zero values
  const pieData = allData.filter(item => item.value > 0);
  const total = allData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border">
        <p className="text-sm text-text-muted">Sin datos de pedidos</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationDuration={800}
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "10px 14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
            itemStyle={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}
            labelStyle={{ display: "none" }}
            cursor={{ fill: "transparent" }}
            formatter={(value, name) => [
              <span key="val" style={{ color: "white" }}>{value} pedido(s)</span>,
              <span key="name" style={{ color: "#94a3b8", marginRight: "8px" }}>{name}:</span>
            ]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: "20px" }}
            payload={allData.map(item => ({
              value: item.name,
              type: "circle",
              id: item.name,
              color: item.color
            }))}
            formatter={(value: string) => (
              <span className="text-[12px] font-medium text-text-primary mr-2">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
