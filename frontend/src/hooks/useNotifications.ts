import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../api/notificationApi";
import type { Notification } from "../types/notification";

export function useNotifications(page = 1) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationApi.list(page);
      setItems(data.items);
      setUnreadCount(data.unread_count);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await notificationApi.getUnreadCount();
        setUnreadCount(data.unread_count);
      } catch {
        // silent — polling errors should not update UI error state
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  }, []);

  return {
    items,
    unreadCount,
    totalPages,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
