export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  related_order_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total_count: number;
  unread_count: number;
  page: number;
  total_pages: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
