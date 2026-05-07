import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <nav className="main-nav">
      <Link to="/" className="nav-logo">
        🍕 Food Store
      </Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <span className="nav-user">{user?.email}</span>
            <Link to="/profile" className="nav-link">
              Mi Perfil
            </Link>
            <button onClick={handleLogout} className="nav-logout">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="nav-link nav-register">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
