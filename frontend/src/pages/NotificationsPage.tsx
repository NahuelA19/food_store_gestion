import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  Bell,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

function getNotifIcon(type: string) {
  if (type.includes("shipped")) return Truck;
  if (type.includes("delivered")) return CheckCircle;
  if (type.includes("cancelled")) return XCircle;
  if (type.includes("confirmed") || type.includes("ready")) return CheckCircle;
  if (type.includes("preparing")) return Clock;
  if (type.includes("payment")) return CreditCard;
  if (type.includes("order")) return Package;
  return Bell;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { items, unreadCount, totalPages, isLoading, markAsRead, markAllAsRead } =
    useNotifications(page);

  const handleItemClick = async (notif: (typeof items)[number]) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.related_order_id) {
      navigate(`/orders/${notif.related_order_id}`);
    }
  };

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-text-muted" />
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Notifications
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface-card p-4"
            >
              <div className="flex items-start gap-3">
                <Skeleton variant="circle" className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={cn(
                "flex items-start gap-4 rounded-xl border border-border bg-surface-card p-4 transition-all duration-200 cursor-pointer hover:shadow-sm",
                !notif.is_read && "border-blue-200 dark:border-blue-800",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                <Icon
                  icon={getNotifIcon(notif.type)}
                  size={20}
                  className="text-text-muted"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm truncate",
                      notif.is_read
                        ? "text-text-secondary"
                        : "font-bold text-text-primary",
                    )}
                  >
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-text-muted line-clamp-2">
                  {notif.message}
                </p>
                <p className="mt-1.5 text-xs text-text-muted">
                  {getRelativeTime(notif.created_at)}
                </p>
              </div>
              {!notif.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notif.id);
                  }}
                  className="shrink-0"
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bell size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="mb-2 font-display text-2xl font-bold text-text-primary">
            No notifications yet
          </h2>
          <p className="max-w-md text-text-muted">
            Notifications about your orders and payments will appear here.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
