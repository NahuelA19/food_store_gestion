/**
 * CreateEmployeePage — Formulario para crear un nuevo empleado (solo admin)
 *
 * - La contraseña generada es temporal: el empleado debe cambiarla en el primer login.
 * - Roles disponibles: employee, manager, chef, cashier, waiter (no admin).
 * - En éxito: navega a /employees.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEmployee } from "../hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ArrowLeft, UserPlus, Save, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

/* ─── Inline Select ─── */

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

function Select({ label, value, onChange, options, error, placeholder }: SelectProps) {
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

export function CreateEmployeePage() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Ingresá un email válido";
    }

    if (!role) {
      newErrors.role = "Seleccioná un rol";
    }

    if (!password) {
      newErrors.password = "La contraseña temporal es obligatoria";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmá la contraseña";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createEmployee.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
        role,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTimeout(() => navigate("/employees"), 1000);
        },
      }
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
              <Icon icon={UserPlus} size={20} />
            </div>
            <div>
              <CardTitle>Nuevo Empleado</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                El empleado deberá cambiar su contraseña al primer inicio de sesión.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="empleado@foodstore.com"
              autoComplete="off"
            />

            {/* Nombre y apellido */}
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
              placeholder="Seleccioná un rol..."
            />

            {/* Contraseña temporal */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Contraseña temporal"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
              />
            </div>

            {/* Error del servidor */}
            {createEmployee.isError && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-semibold text-danger">
                      No se pudo crear el empleado
                    </p>
                    <p className="text-sm text-danger/80 mt-0.5">
                      {createEmployee.error instanceof Error
                        ? createEmployee.error.message
                        : "Ocurrió un error inesperado."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Éxito */}
            {createEmployee.isSuccess && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <Icon icon={CheckCircle} size={18} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Empleado creado correctamente. Redirigiendo...
                  </p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={createEmployee.isPending || createEmployee.isSuccess}
              >
                {createEmployee.isPending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Icon icon={Save} size={16} className="mr-2" />
                )}
                {createEmployee.isPending ? "Creando..." : "Crear empleado"}
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
