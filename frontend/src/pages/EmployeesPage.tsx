/**
 * EmployeesPage — Employee list with role filtering
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

/* ─── Static demo data (fallback) ─── */

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  joinDate: string;
  branch?: string;
}

const FALLBACK_EMPLOYEES: Employee[] = [
  { id: 1, name: "María García", email: "maria.garcia@foodstore.com", role: "Manager", status: "active", joinDate: "2024-01-15" },
  { id: 2, name: "Carlos López", email: "carlos.lopez@foodstore.com", role: "Chef", status: "active", joinDate: "2024-03-01" },
  { id: 3, name: "Ana Martínez", email: "ana.martinez@foodstore.com", role: "Cajero", status: "active", joinDate: "2024-06-10" },
  { id: 4, name: "Pedro Sánchez", email: "pedro.sanchez@foodstore.com", role: "Chef", status: "active", joinDate: "2024-08-20" },
  { id: 5, name: "Laura Rodríguez", email: "laura.rodriguez@foodstore.com", role: "Manager", status: "active", joinDate: "2024-02-14" },
  { id: 6, name: "Sofía Fernández", email: "sofia.fernandez@foodstore.com", role: "Mesero", status: "active", joinDate: "2024-09-05" },
  { id: 7, name: "Diego Morales", email: "diego.morales@foodstore.com", role: "Cajero", status: "inactive", joinDate: "2024-04-18" },
  { id: 8, name: "Valentina Torres", email: "valentina.torres@foodstore.com", role: "Mesero", status: "active", joinDate: "2025-01-10" },
];

const ROLES = ["Todos", "Manager", "Chef", "Cajero", "Mesero", "admin"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatUserName(user: AdminUser): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email.split("@")[0];
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Admin",
    customer: "Cliente",
    employee: "Empleado",
    manager: "Manager",
    chef: "Chef",
    cashier: "Cajero",
    waiter: "Mesero",
  };
  return roleMap[role] || role;
}

export function EmployeesPage() {
  const [activeRole, setActiveRole] = useState("Todos");
  const { users: apiUsers, isLoading } = useUsers();

  const employeesList = useMemo((): Employee[] => {
    if (apiUsers.length > 0) {
      return apiUsers.map((u: AdminUser) => ({
        id: u.id,
        name: formatUserName(u),
        email: u.email,
        role: formatRole(u.role),
        status: u.is_active ? "active" as const : "inactive" as const,
        joinDate: u.created_at ? u.created_at.split("T")[0] : "",
      }));
    }
    return FALLBACK_EMPLOYEES;
  }, [apiUsers]);

  const filteredEmployees = useMemo(() => {
    if (activeRole === "Todos") return employeesList;
    return employeesList.filter((e) => e.role.toLowerCase() === activeRole.toLowerCase());
  }, [activeRole, employeesList]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Empleados
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Gestiona el equipo de todas las sucursales
        </p>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
              activeRole === role
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
            )}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Employees table */}
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
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={Users} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">
                No se encontraron empleados
              </p>
              <p className="text-sm text-text-muted mt-1">
                No hay empleados con el filtro seleccionado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                      Ingreso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 text-xs font-bold">
                            {getInitials(employee.name)}
                          </div>
                          <span className="font-semibold text-text-primary">
                            {employee.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {employee.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm">
                          <span className="sr-only">Rol: </span>
                          {employee.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {employee.branch}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={employee.status === "active" ? "success" : "danger"}
                          size="sm"
                        >
                          <span className="sr-only">Estado: </span>
                          {employee.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        {employee.joinDate}
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
