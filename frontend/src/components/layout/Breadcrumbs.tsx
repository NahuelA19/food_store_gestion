/**
 * Breadcrumbs — Auto-generated from current route path
 */

import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Productos",
  "/orders": "Pedidos",
  "/branches": "Sucursales",
  "/employees": "Empleados",
  "/cart": "Carrito",
  "/profile": "Mi Perfil",
  "/login": "Iniciar Sesión",
  "/register": "Registrarse",
  "/settings": "Configuración",
  "/help": "Ayuda",
};

export function Breadcrumbs() {
  const location = useLocation();

  // Build path segments from current URL
  const segments = location.pathname
    .split("/")
    .filter(Boolean)
    .reduce<{ path: string; label: string }[]>((acc, segment, i, arr) => {
      // Build cumulative path
      const parentPath = i === 0 ? "" : acc[i - 1].path;
      const fullPath = `${parentPath}/${segment}`;

      // Check if this exact segment has a label
      let label = ROUTE_LABELS[fullPath];

      // If no label, try to derive from the segment
      if (!label) {
        // Handle dynamic segments like /products/123
        if (i === arr.length - 1 && !isNaN(Number(segment))) {
          label = `#${segment}`;
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
      }

      acc.push({ path: fullPath, label });
      return acc;
    }, []);

  // If we're at root, show just "Inicio"
  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
        <Home size={14} />
        <span>Inicio</span>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <Home size={14} />
          </Link>
        </li>
        {segments.map((segment, index) => (
          <li key={segment.path} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-text-muted/50" />
            {index === segments.length - 1 ? (
              <span className="font-semibold text-text-primary">
                {segment.label}
              </span>
            ) : (
              <Link
                to={segment.path}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                {segment.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
