/**
 * Topbar — Horizontal bar with branch selector, theme toggle, and user menu
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "@/lib/utils";
import { useWishlist } from "../../hooks/useWishlist";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { CartBadge } from "../Cart/CartBadge";
import { branchApi } from "../../api/branchApi";
import { useCartUIStore } from "../../store/cartUIStore";
import type { Branch } from "../../types/branch";
import logoImg from "../../assets/images/logo.png";
import {
  Sun,
  Moon,
  ChevronDown,
  Building2,
  Bell,
  Heart,
  User,
  LogOut,
  HelpCircle,
  Settings,
} from "lucide-react";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const STORAGE_KEY = "food-store-active-branch";

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { toggle: toggleCart } = useCartUIStore();
  const isCustomer = !user?.role || ["customer", "client"].includes(user.role.toLowerCase());
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load branches from API and restore saved selection
  useEffect(() => {
    branchApi.getBranches().then((data) => {
      const items = data.items ?? [];
      setBranches(items);
      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId ? items.find((b) => String(b.id) === savedId) : null;
      setSelectedBranch(saved || items[0] || null);
    }).catch(() => {
      // Fallback: no branches loaded
    });
  }, []);

  const handleBranchChange = useCallback((branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem(STORAGE_KEY, String(branch.id));
    setBranchOpen(false);
  }, []);

    return (
      <header
        className={cn(
          "glass-light dark:glass-dark fixed top-0 right-0 z-30 flex h-16 items-center border-b border-border transition-all duration-300 px-4 sm:px-6",
          sidebarCollapsed ? "left-[68px]" : "left-60"
        )}
      >
       {/* Logo on mobile */}
       <Link to="/" className="md:hidden flex items-center gap-2 mr-4">
         <img
           src={logoImg}
           alt="Food Store"
           className="h-8 w-8 object-contain"
         />
         <span className="font-display text-sm font-bold text-text-primary">
           Food Store
         </span>
       </Link>

       {/* Branch Selector */}
       <div ref={branchRef} className="relative">
        <button
          onClick={() => setBranchOpen(!branchOpen)}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-card px-3.5 py-2 text-sm font-semibold text-text-primary hover:border-brand-300 transition-all duration-200"
        >
          <Building2 size={16} className="text-text-muted" />
          <span className="hidden sm:inline">{selectedBranch?.name ?? "Sucursal"}</span>
          <span className="sm:hidden">{selectedBranch?.name?.split(" ")[1] ?? "..."}</span>
          <ChevronDown
            size={14}
            className={cn(
              "text-text-muted transition-transform duration-200",
              branchOpen && "rotate-180"
            )}
          />
        </button>

        {branchOpen && (
          <div className="dropdown absolute left-0 top-full mt-1.5 w-64 rounded-xl p-1.5 animate-scale-in z-50">
            {branches.length === 0 ? (
              <div className="px-3 py-2 text-sm opacity-60">No hay sucursales</div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchChange(branch)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 text-white",
                    selectedBranch?.id === branch.id
                      ? "bg-brand-500/25 text-brand-200"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Building2 size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{branch.name}</p>
                    <p className="text-xs opacity-50">{branch.address}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        {isAuthenticated && (
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 relative"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Icon icon={Bell} size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notificationOpen && (
              <NotificationDropdown
                onClose={() => setNotificationOpen(false)}
              />
            )}
          </div>
        )}

        {/* Wishlist */}
        {isAuthenticated && (
          <Link
            to="/wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 relative"
            aria-label={`Wishlist (${wishlistCount} items)`}
          >
            <Icon icon={Heart} size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>
        )}

        {/* Cart button — customers only */}
        {isAuthenticated && isCustomer && (
          <button
            onClick={toggleCart}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 relative"
            aria-label="Abrir carrito"
          >
            <CartBadge />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200"
          aria-label={isDark ? "Modo claro" : "Modo oscuro"}
        >
          <Icon icon={isDark ? Sun : Moon} size={20} />
        </button>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 ml-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Icon icon={User} size={16} />
            </div>
            {isAuthenticated && (
              <span className="hidden lg:block max-w-[120px] truncate">
                {user?.email}
              </span>
            )}
          </button>

          {userMenuOpen && (
            <div className="dropdown absolute right-0 top-full mt-1.5 w-56 rounded-xl p-1.5 animate-scale-in z-50">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-b border-white/15 mb-1">
                    <p className="text-sm font-semibold text-white">
                      {user?.email}
                    </p>
                    <p className="text-xs text-white/50 capitalize">{user?.role ?? "Usuario"}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <Icon icon={Settings} size={16} />
                    Configuración
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <Icon icon={HelpCircle} size={16} />
                    Ayuda
                  </Link>
                  <div className="border-t border-white/15 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-400/15 transition-all duration-200"
                    >
                      <Icon icon={LogOut} size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-text-muted">
                  Sesión no iniciada
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
