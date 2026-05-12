/**
 * BranchesPage — Branch list with card grid and quick actions
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useBranches, useToggleBranchStatus } from "../hooks/useBranches";
import {
  Building2,
  MapPin,
  Eye,
  Power,
} from "lucide-react";

/* ─── Static demo data (fallback) ─── */

interface BranchRow {
  id: number;
  name: string;
  address: string;
  status: "active" | "inactive";
}

const FALLBACK_BRANCHES: BranchRow[] = [
  { id: 1, name: "Sucursal Central", address: "Av. Corrientes 1234", status: "active" },
  { id: 2, name: "Sucursal Norte", address: "Av. Cabildo 5678", status: "active" },
  { id: 3, name: "Sucursal Sur", address: "Av. Boedo 9012", status: "active" },
];

export function BranchesPage() {
  const { branches: apiBranches, isLoading } = useBranches();
  const { toggleStatus: apiToggle, isLoading: toggling } = useToggleBranchStatus();

  const branches = useMemo((): BranchRow[] => {
    if (apiBranches.length > 0) {
      return apiBranches.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address || "",
        status: b.is_active ? "active" as const : "inactive" as const,
      }));
    }
    return FALLBACK_BRANCHES;
  }, [apiBranches]);

  const toggleStatus = async (id: number) => {
    try {
      await apiToggle(id);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Sucursales
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Administra las sucursales de tu restaurante
        </p>
      </div>

      {/* Branch cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card key={branch.id} className="group relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                    <Icon icon={Building2} size={20} />
                  </div>
                  <Badge
                    variant={branch.status === "active" ? "success" : "danger"}
                    size="sm"
                  >
                    <span className="sr-only">Estado: </span>
                    {branch.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <p className="font-display text-base font-bold text-text-primary">
                  {branch.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Icon icon={MapPin} size={12} className="text-text-muted shrink-0" />
                  <p className="text-xs text-text-muted truncate">{branch.address}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Link to={`/branches/${branch.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full gap-1.5">
                      <Icon icon={Eye} size={14} />
                      Ver detalle
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => toggleStatus(branch.id)}
                    disabled={toggling}
                    aria-label={
                      branch.status === "active"
                        ? `Desactivar ${branch.name}`
                        : `Activar ${branch.name}`
                    }
                  >
                    <Icon icon={Power} size={14} />
                    {branch.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
