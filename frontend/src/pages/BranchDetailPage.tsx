/**
 * BranchDetailPage — Full branch detail with contact info from API
 */

import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useBranch } from "../hooks/useBranches";
import { useAuthStore } from "../store/authStore";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
} from "lucide-react";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const branchId = Number(id);
  const navigate = useNavigate();
  const { branch, isLoading, error } = useBranch(branchId);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!branch || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
          <Icon icon={Building2} size={28} className="text-text-muted" />
        </div>
        <p className="text-lg font-semibold text-text-primary">
          Sucursal no encontrada
        </p>
        <p className="text-sm text-text-muted mt-1">
          {error || `La sucursal solicitada no existe`}
        </p>
        <Link to="/branches">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft size={16} />
            Volver a sucursales
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link
        to="/branches"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon icon={ArrowLeft} size={16} />
        Volver a sucursales
      </Link>

      {/* Branch header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <Icon icon={Building2} size={28} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {branch.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={branch.is_active ? "success" : "danger"}
                size="sm"
              >
                <span className="sr-only">Estado: </span>
                {branch.is_active ? "Activo" : "Inactivo"}
              </Badge>
              <span className="text-sm text-text-muted">{branch.address || ""}</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 self-start sm:self-center"
            onClick={() => navigate(`/branches/${branchId}/edit`)}
          >
            <Icon icon={Pencil} size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-text-primary">
                Contacto
              </h3>
              <div className="space-y-3">
                {branch.address && (
                  <div className="flex items-center gap-3">
                    <Icon icon={MapPin} size={15} className="text-text-muted shrink-0" />
                    <p className="text-sm text-text-secondary">{branch.address}</p>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-3">
                    <Icon icon={Phone} size={15} className="text-text-muted shrink-0" />
                    <p className="text-sm text-text-secondary">{branch.phone}</p>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-3">
                    <Icon icon={Mail} size={15} className="text-text-muted shrink-0" />
                    <p className="text-sm text-text-secondary">{branch.email}</p>
                  </div>
                )}
                {!branch.address && !branch.phone && !branch.email && (
                  <p className="text-sm text-text-muted">Sin información de contacto</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
