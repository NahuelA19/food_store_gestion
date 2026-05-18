/**
 * EditEmployeePage — Formulario de edición de empleado (solo admin)
 *
 * - Carga el empleado por ID desde la lista de usuarios.
 * - No incluye campo de contraseña.
 * - En éxito: navega a /employees.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/userApi";
import { useUpdateEmployee } from "../hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  UserCog,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

/* ─── Inline Select ─── */

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

function Select({ label, value, onChange, options, error, placeholder, disabled }: SelectProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-text-primary">
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`flex h-11 w-full rounded-lg border-2 bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 ${
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
            : "border-border hover:border-brand-300 focus-visible:border-brand-500"
        } disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-alt`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/* ─── Constantes ─── */

const ROLE_OPTIONS = [
  { value: "employee", label: "Empleado" },
  { value: "manager", label: "Manager" },
  { value: "chef", label: "Chef" },
  { value: "cashier", label: "Cajero" },
  { value: "waiter", label: "Mesero" },
];

/* ─── Página ─── */

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const navigate = useNavigate();
  const updateEmployee = useUpdateEmployee(employeeId);

  const {
    data: employee,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => userApi.getEmployee(employeeId),
    enabled: !isNaN(employeeId),
  });

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-carga cuando llegan los datos
  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name ?? "");
      setLastName(employee.last_name ?? "");
      setPhone(employee.phone ?? "");
      setRole(employee.role);
      setIsActive(employee.is_active);
    }
  }, [employee]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!role) newErrors.role = "Seleccioná un rol";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateEmployee.mutate(
      {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          setTimeout(() => navigate("/employees"), 1000);
        },
      }
    );
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error o empleado no encontrado
  if (loadError || (!isLoading && !employee)) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-2 border-danger">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertTriangle size={48} className="text-danger" />
            <h2 className="font-display text-xl font-bold text-text-primary">
              Empleado no encontrado
            </h2>
            <p className="text-sm text-text-muted">
              {loadError instanceof Error
                ? loadError.message
                : "No se encontró el empleado solicitado."}
            </p>
            <Button variant="outline" onClick={() => navigate("/employees")}>
              <ArrowLeft size={16} className="mr-1" />
              Volver a Empleados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Navegación atrás */}
      <Button variant="ghost" onClick={() => navigate("/employees")} className="mb-6">
        <Icon icon={ArrowLeft} size={16} className="mr-2" />
        Volver a Empleados
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={UserCog} size={20} />
            </div>
            <div>
              <CardTitle>Editar empleado</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                {employee?.email} — #{employeeId}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="María"
              />
              <Input
                label="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="García"
              />
            </div>

            {/* Teléfono */}
            <Input
              label="Teléfono (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
            />

            {/* Rol */}
            <Select
              label="Rol"
              value={role}
              onChange={setRole}
              options={ROLE_OPTIONS}
              error={errors.role}
            />

            {/* Estado activo/inactivo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  isActive ? "bg-emerald-500" : "bg-border-dark"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {isActive ? "Empleado activo" : "Empleado inactivo"}
                </p>
                <p className="text-xs text-text-muted">
                  {isActive
                    ? "El empleado puede iniciar sesión normalmente"
                    : "El empleado no puede iniciar sesión"}
                </p>
              </div>
            </div>

            {/* Error del servidor */}
            {updateEmployee.isError && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-medium text-danger">
                <AlertTriangle size={18} />
                {updateEmployee.error instanceof Error
                  ? updateEmployee.error.message
                  : "No se pudo actualizar el empleado"}
              </div>
            )}

            {/* Éxito */}
            {updateEmployee.isSuccess && (
              <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-500/30 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle size={18} />
                Empleado actualizado correctamente. Redirigiendo...
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={updateEmployee.isPending || updateEmployee.isSuccess}
              >
                {updateEmployee.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/employees")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
