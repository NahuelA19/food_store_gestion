import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogIn, Store, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role?.toLowerCase() ?? "";
      if (role === "cajero") navigate("/cajero");
      else if (role === "chef" || role === "cocina") navigate("/cocina");
      else navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Credenciales incorrectas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <div className="w-full max-w-md mx-auto animate-scale-in">
        {/* Branding header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Icon icon={Store} size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Food Store
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              ¡Bienvenido de vuelta! Ingresá a tu cuenta
            </p>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div
                  className="flex items-start gap-3 rounded-xl border-l-4 border-danger bg-danger/10 p-3.5 text-sm font-medium text-danger"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-text-primary"
                >
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  disabled={isLoading}
                  className="w-full h-11 px-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-text-primary"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-200"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <Icon icon={showPassword ? EyeOff : Eye} size={18} />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full gap-2 mt-2"
              >
                <Icon icon={LogIn} size={18} />
                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <p className="text-sm text-text-muted">
                ¿No tenés cuenta?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-accent hover:text-accent/80 hover:underline transition-colors"
                >
                  Registrate gratis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
