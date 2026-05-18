import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateBranch } from "../hooks/useBranches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export function CreateBranchPage() {
  const navigate = useNavigate();
  const { createBranch, isPending, isSuccess, error: mutationError } = useCreateBranch();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    await createBranch({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    navigate("/branches");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/branches")} className="mb-6 gap-2">
        <Icon icon={ArrowLeft} size={16} />
        Volver a sucursales
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={Building2} size={20} />
            </div>
            <div>
              <CardTitle>Nueva Sucursal</CardTitle>
              <p className="text-sm text-text-muted mt-0.5">
                Completá los datos para registrar una nueva sucursal
              </p>
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
              autoFocus
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

            {mutationError && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={AlertTriangle} size={18} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-sm font-semibold text-danger">{mutationError}</p>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <Icon icon={CheckCircle} size={18} className="shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Sucursal creada correctamente
                  </p>
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
                {isPending ? "Guardando..." : "Crear Sucursal"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/branches")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
