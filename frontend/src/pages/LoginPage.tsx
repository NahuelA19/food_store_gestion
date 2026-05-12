import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogIn } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-surface p-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-brand">
            Sign In
          </CardTitle>
          <p className="text-center text-sm text-text-muted">
            Welcome back to Food Store
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div
                className="rounded-lg border-l-4 border-danger bg-danger/10 p-3 text-sm font-medium text-danger-dark"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />

            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              <Icon icon={isLoading ? LogIn : LogIn} />
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-text-muted">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-brand hover:text-brand-hover hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
