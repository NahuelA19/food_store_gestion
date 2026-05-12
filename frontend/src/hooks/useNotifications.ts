import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notificationApi";

export function useNotifications(page = 1) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationApi.list(page),
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    items: listQuery.data?.items ?? [],
    unreadCount: unreadQuery.data?.unread_count ?? 0,
    totalPages: listQuery.data?.total_pages ?? 1,
    isLoading: listQuery.isLoading,
    error: listQuery.error
      ? listQuery.error instanceof Error ? listQuery.error.message : "Failed to load notifications"
      : null,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    refresh: listQuery.refetch,
  };
}
