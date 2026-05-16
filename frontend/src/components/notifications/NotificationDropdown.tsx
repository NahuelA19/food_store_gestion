import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { Icon } from "../ui/Icon";
import {
  Bell,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface NotificationDropdownProps {
  onClose: () => void;
}

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

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { items, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const recentItems = items.slice(0, 5);

  const handleClick = async (notif: (typeof recentItems)[number]) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.related_order_id) {
      navigate(`/orders/${notif.related_order_id}`);
    }
    onClose();
  };

  return (
    <div className="dropdown absolute right-0 top-full mt-1.5 w-80 rounded-xl p-1.5 animate-scale-in z-50">
      {recentItems.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto">
          {recentItems.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="mt-0.5 shrink-0">
                <Icon
                  icon={getNotifIcon(notif.type)}
                  size={18}
                  className="opacity-50"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: "inherit" }}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-xs opacity-60 mt-0.5">
                  {truncate(notif.message, 80)}
                </p>
                <p className="text-[10px] opacity-40 mt-1">
                  {getRelativeTime(notif.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Icon icon={Bell} size={32} className="opacity-30 mb-3" />
          <p className="text-sm font-semibold" style={{ color: "inherit" }}>
            No hay notificaciones
          </p>
        </div>
      )}

      <div className="border-t border-black/10 dark:border-white/10 mt-1 pt-1 space-y-0.5">
        {unreadCount > 0 && (
          <button
            onClick={() => {
              markAllAsRead();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
            style={{ color: "inherit" }}
          >
            Marcar todas como leídas ({unreadCount})
          </button>
        )}
        <button
          onClick={() => {
            navigate("/notifications");
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-all duration-200"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
}
