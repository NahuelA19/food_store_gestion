/**
 * DashboardLayout — Main layout wrapper with sidebar + topbar + content area
 * Responsive: collapses sidebar on tablet, drawer on mobile
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveCollapsed = isMobile ? false : sidebarCollapsed;

  return (
    <div className="min-h-screen bg-surface/85 dark:bg-surface/85">
      {/* Sidebar — overlay on mobile */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 animate-slide-down">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Mobile hamburger — fixed button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30"
          aria-label="Abrir menú"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Topbar */}
      <Topbar sidebarCollapsed={effectiveCollapsed} />

      {/* Main content area */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isMobile ? "ml-0" : effectiveCollapsed ? "ml-[68px]" : "ml-60"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Breadcrumbs />
          {children}
        </div>
      </main>

      {/* Mobile bottom nav (quick access) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface-card px-2">
          {[
            { to: "/", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", label: "Dashboard" },
            { to: "/orders", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0", label: "Pedidos" },
            { to: "/branches", icon: "M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M20 10v11 M8 14v3 M12 14v3 M16 14v3", label: "Sucursales" },
            { to: "/employees", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", label: "Empleados" },
          ].map((item) => (
            <a
              key={item.to}
              href={item.to}
              className="flex flex-col items-center gap-0.5 text-text-muted hover:text-brand-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
