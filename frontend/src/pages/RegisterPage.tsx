import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { UserPlus } from "lucide-react";

export function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { register, isLoading } = useAuthContext();

  const validatePassword = (): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setValidationErrors([]);

    const errors = validatePassword();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-surface p-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-brand">
            Create Account
          </CardTitle>
          <p className="text-center text-sm text-text-muted">
            Join Food Store today
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

            {validationErrors.length > 0 && (
              <div
                className="rounded-lg border-l-4 border-warning bg-warning/10 p-3 text-sm text-warning-dark"
                role="alert"
              >
                <strong className="font-semibold">Password requirements:</strong>
                <ul className="mt-1 ml-5 list-disc space-y-0.5">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={isLoading}
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={isLoading}
              />
            </div>

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
              helperText="8+ characters, uppercase letter, and number"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />

            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              <Icon icon={UserPlus} />
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-brand hover:text-brand-hover hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
