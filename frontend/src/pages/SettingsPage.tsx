import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { User, Settings, ArrowLeft } from "lucide-react";

export function SettingsPage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver al Dashboard
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={Settings} size={20} />
            </div>
            <div>
              <CardTitle>Configuración</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                Administrá tu cuenta y preferencias
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-4 rounded-xl bg-surface-alt p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <Icon icon={User} size={24} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{user.email}</p>
                <p className="text-sm text-text-muted capitalize">Rol: {user.role}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Link to="/profile">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Icon icon={User} size={16} />
                Editar Perfil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
