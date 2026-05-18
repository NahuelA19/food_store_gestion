import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  const userRole = user?.role?.toLowerCase() ?? "";

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.map((r) => r.toLowerCase()).includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  } else if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
