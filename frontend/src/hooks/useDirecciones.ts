/**
 * useDirecciones — Hook for managing delivery addresses
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  direccionesApi,
  type DireccionCreate,
  type DireccionUpdate,
} from "../api/direccionesApi";

export function useDirecciones() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["direcciones"],
    queryFn: () => direccionesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: DireccionCreate) => direccionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DireccionUpdate }) =>
      direccionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => direccionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
    },
  });

  return {
    direcciones: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Error al cargar direcciones"
      : null,
    createDireccion: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error
      ? createMutation.error instanceof Error
        ? createMutation.error.message
        : "Error al crear dirección"
      : null,
    updateDireccion: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error
      ? updateMutation.error instanceof Error
        ? updateMutation.error.message
        : "Error al actualizar dirección"
      : null,
    deleteDireccion: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
