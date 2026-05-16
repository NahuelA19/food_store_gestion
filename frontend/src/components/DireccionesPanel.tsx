/**
 * DireccionesPanel — CRUD for user delivery addresses
 *
 * Architecture:
 * - Uses useDirecciones hook (TanStack Query) for all data operations
 * - Inline editing: add/edit forms expand in place
 * - Confirmation dialog for delete
 * - Shows empty state when no addresses exist
 */

import { useState } from "react";
import { useDirecciones } from "../hooks/useDirecciones";
import type { Direccion, DireccionCreate, DireccionUpdate } from "../api/direccionesApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Home,
} from "lucide-react";

/* ─── Address card ─── */

interface AddressCardProps {
  address: Direccion;
  onEdit: (address: Direccion) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

function AddressCard({ address, onEdit, onDelete, isDeleting }: AddressCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-card p-4 transition-all hover:border-brand-200 hover:shadow-sm">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <Icon icon={MapPin} size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {address.direccion}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {address.ciudad}, {address.provincia}
            {address.codigo_postal ? ` - CP: ${address.codigo_postal}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(address)}
          aria-label="Editar dirección"
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(address.id)}
          disabled={isDeleting}
          className="text-danger hover:text-danger hover:bg-danger/10"
          aria-label="Eliminar dirección"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Address form (create/edit) ─── */

interface AddressFormProps {
  initial?: Direccion;
  onSubmit: (data: DireccionCreate | DireccionUpdate) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function AddressForm({ initial, onSubmit, onCancel, isSubmitting, error }: AddressFormProps) {
  const [direccion, setDireccion] = useState(initial?.direccion ?? "");
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? "");
  const [provincia, setProvincia] = useState(initial?.provincia ?? "");
  const [codigoPostal, setCodigoPostal] = useState(initial?.codigo_postal ?? "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!direccion.trim()) errs.direccion = "La dirección es obligatoria";
    if (!ciudad.trim()) errs.ciudad = "La ciudad es obligatoria";
    if (!provincia.trim()) errs.provincia = "La provincia es obligatoria";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: DireccionCreate = {
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      provincia: provincia.trim(),
      codigo_postal: codigoPostal.trim() || undefined,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 form-panel">
      <h4 className="text-sm font-bold text-white">
        {initial ? "Editar dirección" : "Nueva dirección"}
      </h4>

      <Input
        label="Dirección"
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        error={formErrors.direccion}
        placeholder="Calle y número"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          error={formErrors.ciudad}
          placeholder="Ciudad"
        />
        <Input
          label="Provincia"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          error={formErrors.provincia}
          placeholder="Provincia"
        />
      </div>

      <Input
        label="Código Postal"
        value={codigoPostal}
        onChange={(e) => setCodigoPostal(e.target.value)}
        placeholder="Opcional"
        maxLength={20}
      />

      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" variant="default" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1" />
              Guardando...
            </>
          ) : (
            <>
              <Check size={14} className="mr-1" />
              {initial ? "Guardar cambios" : "Agregar dirección"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X size={14} className="mr-1" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/* ─── Main panel ─── */

export function DireccionesPanel() {
  const {
    direcciones,
    isLoading,
    error,
    createDireccion,
    isCreating,
    createError,
    updateDireccion,
    isUpdating,
    updateError,
    deleteDireccion,
  } = useDirecciones();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const editingAddress = editingId !== null
    ? direcciones.find((d) => d.id === editingId) ?? null
    : null;

  async function handleCreate(data: DireccionCreate | DireccionUpdate) {
    await createDireccion(data as DireccionCreate);
    setShowForm(false);
  }

  async function handleUpdate(data: DireccionCreate | DireccionUpdate) {
    if (editingId === null) return;
    await updateDireccion({ id: editingId, data });
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteDireccion(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border-2 border-danger bg-danger/10 p-6 text-center">
        <Icon icon={MapPin} size={32} className="text-danger mb-2" />
        <p className="text-sm font-medium text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {direcciones.length === 0
            ? "No tenés direcciones guardadas"
            : `${direcciones.length} dirección(es) guardada(s)`}
        </p>
        {!showForm && editingId === null && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} className="mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <AddressForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={isCreating}
          error={createError}
        />
      )}

      {/* Edit form */}
      {editingId !== null && editingAddress && (
        <AddressForm
          key={editingAddress.id}
          initial={editingAddress}
          onSubmit={handleUpdate}
          onCancel={() => setEditingId(null)}
          isSubmitting={isUpdating}
          error={updateError}
        />
      )}

      {/* Address list */}
      {direcciones.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-400 mb-3">
            <Icon icon={Home} size={28} />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Sin direcciones
          </p>
          <p className="text-xs text-text-muted mt-1">
            Agregá una dirección para recibir tus pedidos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {direcciones.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={(a) => {
                setShowForm(false);
                setEditingId(a.id);
              }}
              onDelete={handleDelete}
              isDeleting={deletingId === addr.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
