/**
 * EmployeesPage — Admin/Employee list (excludes customers)
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { cn } from "@/lib/utils";
import { useUsers } from "../hooks/useUsers";
import type { AdminUser } from "../api/userApi";
import { Users } from "lucide-react";

const STAFF_ROLES = ["admin", "employee", "manager", "chef", "cashier", "waiter"];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  employee: "Empleado",
  manager: "Manager",
  chef: "Chef",
  cashier: "Cajero",
  waiter: "Mesero",
};

const FILTER_TABS = ["Todos", "Admin", "Empleado", "Manager", "Chef", "Cajero", "Mesero"];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatUserName(user: AdminUser): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email.split("@")[0];
}

function formatRole(role: string): string {
  return ROLE_LABELS[role.toLowerCase()] ?? role;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  status: "active" | "inactive";
  joinDate: string;
}

export function EmployeesPage() {
  const [activeRole, setActiveRole] = useState("Todos");
  const { users: apiUsers, isLoading } = useUsers();

  const staffList = useMemo((): Employee[] => {
    return apiUsers
      .filter((u: AdminUser) => STAFF_ROLES.includes(u.role.toLowerCase()))
      .map((u: AdminUser) => ({
        id: u.id,
        name: formatUserName(u),
        email: u.email,
        role: u.role.toLowerCase(),
        roleLabel: formatRole(u.role),
        status: u.is_active ? "active" as const : "inactive" as const,
        joinDate: u.created_at ? u.created_at.split("T")[0] : "",
      }));
  }, [apiUsers]);

  const filteredList = useMemo(() => {
    if (activeRole === "Todos") return staffList;
    return staffList.filter((e) => e.roleLabel.toLowerCase() === activeRole.toLowerCase());
  }, [activeRole, staffList]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Empleados</h1>
        <p className="text-sm text-text-muted mt-1">
          Gestioná el equipo de todas las sucursales
        </p>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeRole === role
                ? "pill-active"
                : "pill-inactive"
            )}
          >
            {role}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={Users} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {apiUsers.length === 0 && !isLoading
                  ? "No hay empleados registrados"
                  : "No hay empleados con el filtro seleccionado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Empleado</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((emp) => (
                    <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 text-xs font-bold">
                            {getInitials(emp.name)}
                          </div>
                          <span className="font-semibold text-text-primary">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{emp.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.role === "admin" ? "warning" : "info"} size="sm">
                          {emp.roleLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.status === "active" ? "success" : "danger"} size="sm">
                          {emp.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">{emp.joinDate}</td>
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
