/**
 * ChangePasswordPage — Formulario de cambio de contraseña obligatorio
 *
 * Se muestra cuando must_change_password === true en el store.
 * También puede accederse voluntariamente desde ajustes.
 *
 * En éxito: limpia mustChangePassword del store y navega a /
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { KeyRound, Save, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      setMustChangePassword(false);
      setTimeout(() => navigate("/"), 1200);
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Ingresá tu contraseña actual";
    }

    if (!newPassword) {
      newErrors.newPassword = "Ingresá la nueva contraseña";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmá la nueva contraseña";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={KeyRound} size={20} />
            </div>
            <div>
              <CardTitle>Cambiar contraseña</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                {mustChangePassword
                  ? "Por seguridad, tenés que cambiar tu contraseña temporal antes de continuar."
                  : "Actualizá tu contraseña de acceso."}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.currentPassword}
              placeholder="Tu contraseña actual"
              autoComplete="current-password"
            />

            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="Repetí la nueva contraseña"
              autoComplete="new-password"
            />

            {/* Error del servidor */}
            {mutation.isError && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-sm font-medium text-danger">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "Ocurrió un error al cambiar la contraseña."}
                  </p>
                </div>
              </div>
            )}

            {/* Éxito */}
            {mutation.isSuccess && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <Icon icon={CheckCircle} size={18} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Contraseña actualizada correctamente. Redirigiendo...
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={mutation.isPending || mutation.isSuccess}>
                {mutation.isPending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Icon icon={Save} size={16} className="mr-2" />
                )}
                {mutation.isPending ? "Guardando..." : "Cambiar contraseña"}
              </Button>

              {/* Solo mostramos Cancelar si el cambio NO es obligatorio */}
              {!mustChangePassword && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
