import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import {
  User,
  Settings,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  LogOut,
  Shield,
  ChevronRight,
  Check,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  employee: "Empleado",
  client: "Cliente",
};

const ROLE_VARIANTS: Record<string, "success" | "info" | "neutral"> = {
  admin: "success",
  employee: "info",
  client: "neutral",
};

export function SettingsPage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [stockNotifs, setStockNotifs] = useState(true);

  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "Usuario";
  const roleVariant = ROLE_VARIANTS[user?.role ?? ""] ?? "neutral";

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver al inicio
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Icon icon={Settings} size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Configuración</h1>
          <p className="text-sm text-text-muted mt-0.5">Administrá tu cuenta y preferencias</p>
        </div>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon={User} size={18} className="text-text-muted" />
            <CardTitle>Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-surface-alt p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={User} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={roleVariant} size="sm">{roleLabel}</Badge>
              </div>
            </div>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="w-full justify-between gap-2">
              <span className="flex items-center gap-2">
                <Icon icon={User} size={16} />
                Editar perfil
              </span>
              <Icon icon={ChevronRight} size={16} className="text-text-muted" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon={isDark ? Moon : Sun} size={18} className="text-text-muted" />
            <CardTitle>Apariencia</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted mb-4">Elegí el tema que más te guste</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light" as const, label: "Claro", icon: Sun },
              { value: "dark" as const, label: "Oscuro", icon: Moon },
              { value: "auto" as const, label: "Sistema", icon: Monitor },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                  theme === value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-border hover:border-brand-300 hover:bg-surface-alt"
                }`}
              >
                <Icon icon={icon} size={20} className={theme === value ? "text-brand-600" : "text-text-muted"} />
                <span className={`text-xs font-semibold ${theme === value ? "text-brand-600" : "text-text-secondary"}`}>
                  {label}
                </span>
                {theme === value && (
                  <Icon icon={Check} size={14} className="text-brand-600" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon={Bell} size={18} className="text-text-muted" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              label: "Notificaciones activas",
              description: "Recibir alertas del sistema",
              icon: notificationsEnabled ? Bell : BellOff,
              value: notificationsEnabled,
              toggle: () => setNotificationsEnabled(!notificationsEnabled),
            },
            {
              label: "Cambios en pedidos",
              description: "Alertas cuando un pedido cambia de estado",
              icon: Bell,
              value: orderNotifs,
              toggle: () => setOrderNotifs(!orderNotifs),
              disabled: !notificationsEnabled,
            },
            {
              label: "Stock bajo",
              description: "Alertas de productos con stock reducido",
              icon: Bell,
              value: stockNotifs,
              toggle: () => setStockNotifs(!stockNotifs),
              disabled: !notificationsEnabled,
            },
          ].map(({ label, description, value, toggle, disabled = false }) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                disabled ? "opacity-50 bg-surface-alt" : "bg-surface-alt hover:bg-surface-card"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={toggle}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed ${
                  value ? "bg-brand-500" : "bg-border-dark"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                    value ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon={Shield} size={18} className="text-text-muted" />
            <CardTitle>Cuenta y Seguridad</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-surface-alt p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-semibold text-text-primary">{user?.email}</p>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Rol</p>
            <Badge variant={roleVariant} size="sm">{roleLabel}</Badge>
          </div>
          <Button
            variant="outline"
            className="w-full justify-between gap-2"
            onClick={() => navigate("/profile")}
          >
            <span className="flex items-center gap-2">
              Cambiar contraseña
            </span>
            <Icon icon={ChevronRight} size={16} className="text-text-muted" />
          </Button>
        </CardContent>
      </Card>

      {/* Sesión */}
      <Card>
        <CardHeader>
          <CardTitle>Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full gap-2 text-danger hover:bg-danger-bg"
            onClick={logout}
          >
            <Icon icon={LogOut} size={16} />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
