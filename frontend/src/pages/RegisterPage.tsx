import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export function RegisterPage() {
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>✨ Create Account</h1>
          <p>Join Food Store today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {submitError && (
            <div className="form-alert alert-danger" role="alert">
              {submitError}
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="form-alert alert-warning" role="alert">
              <strong>Password requirements:</strong>
              <ul style={{ margin: 'var(--space-sm) 0 0 var(--space-lg)', paddingLeft: 'var(--space-lg)' }}>
                {validationErrors.map((error, i) => (
                  <li key={i} style={{ marginBottom: 'var(--space-xs)' }}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              8+ characters, uppercase letter, and number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary btn-large"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-lg);
          background: linear-gradient(135deg, var(--accent), var(--primary-50));
        }

        .auth-card {
          background: var(--bg-card);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          max-width: 420px;
          width: 100%;
          box-shadow: var(--shadow-xl);
          animation: slideInUp 0.4s ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .auth-header h1 {
          margin: 0 0 var(--space-sm) 0;
          font-size: var(--text-3xl);
          color: var(--primary);
        }

        .auth-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: var(--text-base);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-alert {
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          border-left: 4px solid;
        }

        .alert-danger {
          background: var(--alert-light);
          color: var(--alert-dark);
          border-color: var(--alert);
        }

        .alert-warning {
          background: var(--warning-light);
          color: var(--warning-dark);
          border-color: var(--warning);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-group label {
          font-weight: var(--font-semibold);
          color: var(--text-main);
          font-size: var(--text-sm);
          text-transform: capitalize;
        }

        .form-group input {
          padding: var(--space-md);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: var(--text-base);
          transition: var(--transition-base);
          min-height: 44px;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(46, 76, 140, 0.1);
        }

        .form-group input:disabled {
          background: var(--neutral-100);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-large {
          padding: var(--space-md) var(--space-lg);
          font-size: var(--text-base);
          font-weight: var(--font-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          min-height: 48px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: var(--text-white);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: var(--transition-base);
          box-shadow: 0 4px 12px rgba(46, 76, 140, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(46, 76, 140, 0.3);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: 2px solid var(--border-light);
        }

        .auth-footer p {
          margin: 0;
          color: var(--text-muted);
          font-size: var(--text-sm);
        }

        .auth-footer a {
          color: var(--primary);
          font-weight: var(--font-semibold);
          text-decoration: none;
          transition: var(--transition-fast);
        }

        .auth-footer a:hover {
          color: var(--primary-dark);
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: var(--space-lg);
          }

          .auth-header h1 {
            font-size: var(--text-2xl);
          }
        }
      `}</style>
    </div>
  );
}
