/**
 * Navigation — Sticky top navbar with responsive mobile menu
 * Uses: lucide-react icons, dark mode toggle, active route indicators
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { CartBadge } from "./Cart/CartBadge";
import { Button } from "./ui/Button";
import { Icon, IconSize } from "./ui/Icon";
import {
  Store,
  ShoppingBag,
  User,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const isChef = ["chef", "cocina"].includes(user?.role?.toLowerCase() ?? "");

  const navLinks = isAuthenticated
    ? [
        { to: "/", label: "Inicio", icon: Store },
        ...(isChef ? [{ to: "/chef", label: "Cocina", icon: Package }] : []),
        { to: "/products", label: "Productos", icon: Package },
        { to: "/cart", label: "Carrito", icon: ShoppingBag },
        { to: "/profile", label: "Mi Perfil", icon: User },
      ]
    : [
        { to: "/", label: "Inicio", icon: Store },
        { to: "/products", label: "Productos", icon: Package },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={closeMobile}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <Icon icon={Store} size={IconSize.sm} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-text-primary hidden sm:block">
            Food Store
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                isActive(link.to)
                  ? "pill-active"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-alt"
              )}
            >
              <Icon icon={link.icon} size={16} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Cart badge (always visible) */}
          <Link
            to="/cart"
            className={cn(
              "relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200",
              isActive("/cart")
                ? "pill-active"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-alt"
            )}
            aria-label="Carrito de compras"
          >
            <CartBadge />
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center h-10 w-10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all duration-200"
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
          >
            <Icon icon={isDark ? Sun : Moon} size={IconSize.md} />
          </button>

          {/* Desktop user menu */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive("/profile")
                    ? "pill-active"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-alt"
                )}
              >
                <Icon icon={User} size={16} />
                <span className="max-w-[120px] truncate">{user?.email}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <Icon icon={LogOut} size={16} />
                <span className="sr-only lg:not-sr-only">Salir</span>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden items-center justify-center h-10 w-10 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all duration-200"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            <Icon icon={mobileOpen ? X : Menu} size={IconSize.md} />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer */}
          <nav className="fixed top-16 right-0 bottom-0 w-72 bg-surface border-l border-border z-50 md:hidden animate-slide-down shadow-dropdown">
            <div className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                    isActive(link.to)
                      ? "pill-active"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-alt"
                  )}
                >
                  <Icon icon={link.icon} size={IconSize.md} />
                  {link.label}
                </Link>
              ))}

              <hr className="my-3 border-border" />

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger-bg transition-all duration-200"
                  >
                    <Icon icon={LogOut} size={IconSize.md} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-2 pt-2">
                  <Link to="/login" onClick={closeMobile}>
                    <Button variant="outline" className="w-full">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/register" onClick={closeMobile}>
                    <Button className="w-full">Registrarse</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
