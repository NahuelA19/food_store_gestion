/**
 * Topbar — Horizontal bar with branch selector, theme toggle, and user menu
 */

import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "@/lib/utils";
import { useWishlist } from "../../hooks/useWishlist";
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

const BRANCHES = [
  { id: 1, name: "Sucursal Central", address: "Av. Corrientes 1234" },
  { id: 2, name: "Sucursal Norte", address: "Av. Cabildo 5678" },
  { id: 3, name: "Sucursal Sur", address: "Av. Boedo 9012" },
];

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthContext();
  const { count: wishlistCount } = useWishlist();
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center border-b border-border bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70 transition-all duration-300 px-4 sm:px-6",
        sidebarCollapsed ? "left-[68px]" : "left-60"
      )}
    >
      {/* Branch Selector */}
      <div ref={branchRef} className="relative">
        <button
          onClick={() => setBranchOpen(!branchOpen)}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-card px-3.5 py-2 text-sm font-semibold text-text-primary hover:border-brand-300 transition-all duration-200"
        >
          <Building2 size={16} className="text-text-muted" />
          <span className="hidden sm:inline">{selectedBranch.name}</span>
          <span className="sm:hidden">{selectedBranch.name.split(" ")[1]}</span>
          <ChevronDown
            size={14}
            className={cn(
              "text-text-muted transition-transform duration-200",
              branchOpen && "rotate-180"
            )}
          />
        </button>

        {branchOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-surface-card p-1.5 shadow-dropdown animate-scale-in z-50">
            {BRANCHES.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranch(branch);
                  setBranchOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  selectedBranch.id === branch.id
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                )}
              >
                <Building2 size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{branch.name}</p>
                  <p className="text-xs text-text-muted">{branch.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications (placeholder) */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 relative">
          <Icon icon={Bell} size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface" />
        </button>

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
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-surface-card p-1.5 shadow-dropdown animate-scale-in z-50">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {user?.email}
                    </p>
                    <p className="text-xs text-text-muted">Administrador</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200"
                  >
                    <Icon icon={Settings} size={16} />
                    Configuración
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200"
                  >
                    <Icon icon={HelpCircle} size={16} />
                    Ayuda
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-bg transition-all duration-200"
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
