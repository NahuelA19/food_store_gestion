/**
 * ClientsPage — Customer list for admins
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useUsers } from "../hooks/useUsers";
import type { AdminUser } from "../api/userApi";
import { UserCheck, Search, X } from "lucide-react";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatUserName(user: AdminUser): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email.split("@")[0];
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  joinDate: string;
}

export function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const { users: apiUsers, isLoading } = useUsers();

  const clientsList = useMemo((): Client[] => {
    return apiUsers
      .filter((u: AdminUser) => u.role.toLowerCase() === "customer" || u.role.toLowerCase() === "client")
      .map((u: AdminUser) => ({
        id: u.id,
        name: formatUserName(u),
        email: u.email,
        phone: u.phone,
        status: u.is_active ? "active" as const : "inactive" as const,
        joinDate: u.created_at ? u.created_at.split("T")[0] : "",
      }));
  }, [apiUsers]);

  const filteredClients = useMemo(() => {
    let list = clientsList;

    if (activeFilter !== "all") {
      list = list.filter((c) => c.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }

    return list;
  }, [clientsList, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Clientes</h1>
        <p className="text-sm text-text-muted mt-1">
          {clientsList.length} {clientsList.length === 1 ? "cliente registrado" : "clientes registrados"}
        </p>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon icon={Search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-surface-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <Icon icon={X} size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeFilter === f
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              )}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={UserCheck} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {clientsList.length === 0
                  ? "No hay clientes registrados"
                  : searchQuery
                  ? "No se encontraron clientes con ese criterio"
                  : "No hay clientes con el estado seleccionado"}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider hidden sm:table-cell">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-accent text-xs font-bold">
                            {getInitials(client.name)}
                          </div>
                          <span className="font-semibold text-text-primary">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{client.email}</td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                        {client.phone ?? <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={client.status === "active" ? "success" : "danger"} size="sm">
                          {client.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary hidden sm:table-cell">
                        {client.joinDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
