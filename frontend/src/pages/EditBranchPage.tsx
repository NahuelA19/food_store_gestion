import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBranch, useUpdateBranch } from "../hooks/useBranches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export function EditBranchPage() {
  const { id } = useParams<{ id: string }>();
  const branchId = Number(id);
  const navigate = useNavigate();

  const { branch, isLoading, error: loadError } = useBranch(branchId);
  const { updateBranch, isPending, error: mutationError } = useUpdateBranch(branchId);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setAddress(branch.address ?? "");
      setPhone(branch.phone ?? "");
      setEmail(branch.email ?? "");
      setIsActive(branch.is_active);
    }
  }, [branch]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "El nombre es obligatorio";
    else if (name.trim().length > 255) next.name = "Máximo 255 caracteres";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Email inválido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await updateBranch({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_active: isActive,
    });
    navigate(`/branches/${branchId}`);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError || !branch) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-2 border-danger">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertTriangle size={48} className="text-danger" />
            <h2 className="font-display text-xl font-bold text-text-primary">
              Sucursal no encontrada
            </h2>
            <p className="text-sm text-text-muted">
              {loadError || "La sucursal no existe o fue eliminada."}
            </p>
            <Button variant="outline" onClick={() => navigate("/branches")}>
              <ArrowLeft size={16} className="mr-1" />
              Volver a sucursales
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => navigate(`/branches/${branchId}`)}
        className="mb-6 gap-2"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver al detalle
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={Building2} size={20} />
            </div>
            <div>
              <CardTitle>Editar Sucursal</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">#{branchId} — {branch.name}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nombre *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Ej: Sucursal Central"
              maxLength={255}
            />
            <Input
              label="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              placeholder="Ej: Av. Corrientes 1234"
            />
            <Input
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="Ej: +54 11 1234-5678"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="Ej: sucursal@foodstore.com"
            />

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Estado de la sucursal</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {isActive ? "La sucursal está activa y visible" : "La sucursal está desactivada"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                  isActive ? "bg-brand-500" : "bg-surface-alt border border-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {mutationError && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-sm font-semibold text-danger">{mutationError}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon icon={Save} size={16} />
                )}
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/branches/${branchId}`)}
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
