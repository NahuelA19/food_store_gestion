/**
 * Sidebar — Fixed left navigation panel, collapsible
 * Sections: Panel, Gestión
 */

import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../ui/Icon";
import { cn } from "@/lib/utils";
import logoImg from "../../assets/images/logo.png";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FolderPlus,
  Heart,
  Bell,
  ClipboardList,
  Tag,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isEmployee = user?.role?.toLowerCase() === "employee";

  // Diferentes menús según el rol
  const navSections = isAdmin
    ? [
        {
          title: "Panel",
          links: [
            { to: "/", label: "Dashboard", icon: LayoutDashboard },
            { to: "/products", label: "Productos", icon: Package },
            { to: "/orders", label: "Pedidos", icon: ShoppingCart },
          ],
        },
        {
          title: "Gestión",
          links: [
            { to: "/branches", label: "Sucursales", icon: Building2 },
            { to: "/employees", label: "Empleados", icon: Users },
            { to: "/clients", label: "Clientes", icon: UserCheck },
            { to: "/categories", label: "Categorías", icon: Tag },
            { to: "/settings", label: "Configuración", icon: Settings },
          ],
        },
        {
          title: "Admin",
          links: [
            { to: "/products/new", label: "Nuevo Producto", icon: PlusCircle },
            { to: "/categories/new", label: "Nueva Categoría", icon: FolderPlus },
          ],
        },
      ]
    : isEmployee
    ? [
        {
          title: "Operaciones",
          links: [
            { to: "/orders", label: "Pedidos", icon: ClipboardList },
            { to: "/products", label: "Productos", icon: Package },
            { to: "/branches", label: "Sucursales", icon: Building2 },
          ],
        },
        {
          title: "Mi cuenta",
          links: [
            { to: "/notifications", label: "Notificaciones", icon: Bell },
            { to: "/settings", label: "Configuración", icon: Settings },
          ],
        },
      ]
    : [
        {
          title: "Mi Tienda",
          links: [
            { to: "/products", label: "Productos", icon: Package },
            { to: "/orders", label: "Mis Pedidos", icon: ShoppingCart },
            { to: "/wishlist", label: "Favoritos", icon: Heart },
            { to: "/cart", label: "Carrito", icon: ShoppingCart },
          ],
        },
        {
          title: "Mi cuenta",
          links: [
            { to: "/notifications", label: "Notificaciones", icon: Bell },
            { to: "/settings", label: "Configuración", icon: Settings },
          ],
        },
      ];

  return (
    <aside
      className={cn(
        "glass fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logoImg}
            alt="Food Store"
            className={cn(
              "shrink-0 object-contain transition-transform duration-200 group-hover:scale-105",
              collapsed ? "h-9 w-9" : "h-12 w-12"
            )}
          />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight text-text-primary truncate">
              Food Store
            </span>
          )}
        </Link>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      collapsed && "justify-center px-0",
                      isActive(link.to)
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                    )}
                    title={collapsed ? link.label : undefined}
                  >
                    <Icon icon={link.icon} size={20} />
                    {!collapsed && <span>{link.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-border p-3">
        {isAuthenticated ? (
          <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
            {!collapsed && (
              <div className="px-3 py-1.5">
                <p className="truncate text-xs font-medium text-text-muted">
                  {user?.email}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition-all duration-200 hover:bg-danger/20",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Cerrar sesión" : undefined}
            >
              <Icon icon={LogOut} size={20} />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        ) : (
          <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
            <Link
              to="/login"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-alt hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Iniciar sesión" : undefined}
            >
              <Icon icon={Users} size={20} />
              {!collapsed && <span>Iniciar sesión</span>}
            </Link>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center rounded-xl px-3 py-2 text-text-muted hover:bg-surface-alt hover:text-text-primary transition-all duration-200"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <Icon icon={collapsed ? ChevronRight : ChevronLeft} size={18} />
        </button>
      </div>
    </aside>
  );
}
