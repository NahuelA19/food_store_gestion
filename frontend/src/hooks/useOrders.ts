import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../api/orderApi";
import type { OrderStatus } from "../types/order";

export function useOrders(page = 1, status?: string) {
  const query = useQuery({
    queryKey: ["orders", { page, status }],
    queryFn: () => orderApi.getOrders(page, status),
  });

  return {
    orders: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.total_pages ?? 0,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch orders"
      : null,
  };
}

export function useOrder(id: number) {
  const query = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderApi.getOrder(id),
    enabled: !!id,
    refetchInterval: 30000,
  });

  return {
    order: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to fetch order"
      : null,
  };
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      orderApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    updateStatus: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error
        ? mutation.error.message
        : "Failed to update status"
      : null,
  };
}
