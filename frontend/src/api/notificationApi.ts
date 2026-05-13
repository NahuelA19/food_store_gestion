import { useAuthStore } from "../store/authStore";
import type { NotificationListResponse, UnreadCountResponse } from "../types/notification";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const notificationApi = {
  async list(page: number = 1, unreadOnly: boolean = false): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (unreadOnly) params.set("unread", "true");
    const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch unread count");
    return response.json();
  },

  async markAsRead(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to mark all notifications as read");
  },
};
