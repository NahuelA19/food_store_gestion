/**
 * CategoriesPage — Category management (list, edit, delete)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Icon } from "../components/ui/Icon";
import { useCategories } from "../hooks/useCategories";
import { productApi } from "../api/productApi";
import { Tag, PlusCircle, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { categories, isLoading } = useCategories();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
      setDeleteError(null);
    },
    onError: (err: Error) => {
      setDeleteError(err.message || "No se pudo eliminar la categoría");
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setDeleteError(null);
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Categorías</h1>
          <p className="text-sm text-text-muted mt-1">
            {categories.length} {categories.length === 1 ? "categoría registrada" : "categorías registradas"}
          </p>
        </div>
        <Link to="/categories/new">
          <Button variant="default" size="sm">
            <Icon icon={PlusCircle} size={16} />
            Nueva categoría
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt mb-4">
                <Icon icon={Tag} size={28} className="text-text-muted" />
              </div>
              <p className="text-lg font-semibold text-text-primary">No hay categorías registradas</p>
              <p className="text-sm text-text-muted mt-1 mb-6">
                Creá la primera categoría para organizar los productos.
              </p>
              <Link to="/categories/new">
                <Button variant="default">
                  <Icon icon={PlusCircle} size={16} />
                  Nueva categoría
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Categoría</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider hidden md:table-cell">Descripción</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Productos</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                            <Icon icon={Tag} size={16} className="text-brand-600 dark:text-brand-300" />
                          </div>
                          <span className="font-semibold text-text-primary">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell max-w-xs truncate">
                        {cat.description ?? <span className="text-text-muted italic">Sin descripción</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(cat.product_count ?? 0) > 0 ? "info" : "neutral"} size="sm">
                          <Icon icon={Package} size={12} className="mr-1" />
                          {cat.product_count ?? 0} {(cat.product_count ?? 0) === 1 ? "producto" : "productos"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/categories/${cat.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Icon icon={Pencil} size={14} />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDeleteTarget({ id: cat.id, name: cat.name }); setDeleteError(null); }}
                            className="text-danger hover:bg-danger/10"
                            disabled={(cat.product_count ?? 0) > 0}
                            title={(cat.product_count ?? 0) > 0 ? "No se puede eliminar: tiene productos activos" : "Eliminar categoría"}
                          >
                            <Icon icon={Trash2} size={14} />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="dropdown rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Icon icon={AlertTriangle} size={22} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "inherit" }}>
                  Eliminar categoría
                </h3>
                <p className="text-sm opacity-70 mt-1">
                  ¿Estás seguro de que querés eliminar{" "}
                  <strong className="font-semibold opacity-100">&ldquo;{deleteTarget.name}&rdquo;</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
