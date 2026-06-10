import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { UserPlus, Store, Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Al menos 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Al menos una mayúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Al menos un número", test: (pw) => /[0-9]/.test(pw) },
];

export function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const validatePassword = (): string[] => {
    const errors: string[] = [];
    if (!PASSWORD_RULES[0].test(password)) errors.push("La contraseña debe tener al menos 8 caracteres");
    if (!PASSWORD_RULES[1].test(password)) errors.push("La contraseña debe tener al menos una letra mayúscula");
    if (!PASSWORD_RULES[2].test(password)) errors.push("La contraseña debe tener al menos un número");
    if (password !== confirmPassword) errors.push("Las contraseñas no coinciden");
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validatePassword();
    if (errors.length > 0) {
      setSubmitError(errors[0]);
      return;
    }

    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al crear la cuenta");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6 py-12">
      <div className="w-full max-w-md mx-auto animate-scale-in">
        {/* Branding header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Icon icon={Store} size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Crear Cuenta
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Unite a Food Store y empezá a pedir
            </p>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div
                  className="flex items-start gap-3 rounded-xl border-l-4 border-danger bg-danger/10 p-3.5 text-sm font-medium text-danger"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="reg-firstname" className="block text-sm font-semibold text-text-primary">
                    Nombre
                  </label>
                  <input
                    id="reg-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    disabled={isLoading}
                    className="w-full h-11 px-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reg-lastname" className="block text-sm font-semibold text-text-primary">
                    Apellido
                  </label>
                  <input
                    id="reg-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    disabled={isLoading}
                    className="w-full h-11 px-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-sm font-semibold text-text-primary">
                  Correo electrónico
                </label>
                <input
                  id="reg-email"
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
                <label htmlFor="reg-password" className="block text-sm font-semibold text-text-primary">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
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

                {/* Password rules indicator */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          <div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-200 ${ok ? "bg-emerald-500/20" : "bg-white/5"}`}>
                            {ok
                              ? <Check size={10} className="text-emerald-400" />
                              : <X size={10} className="text-text-muted" />
                            }
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${ok ? "text-emerald-400" : "text-text-muted"}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="block text-sm font-semibold text-text-primary">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-200"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <Icon icon={showConfirmPassword ? EyeOff : Eye} size={18} />
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-danger mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full gap-2 mt-2"
              >
                <Icon icon={UserPlus} size={18} />
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <p className="text-sm text-text-muted">
                ¿Ya tenés cuenta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-accent hover:text-accent/80 hover:underline transition-colors"
                >
                  Iniciá sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
