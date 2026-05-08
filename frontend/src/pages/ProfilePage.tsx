import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { UserForm } from "../components/UserForm";

interface UserPreferences {
  language: string;
  theme: string;
  notifications: string;
}

export function ProfilePage() {
  const { user, isLoading, error, updateProfile, updatePreferences } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user preferences on mount
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchPreferences = async () => {
      setPrefsLoading(true);
      setPrefsError(null);

      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/users/me/preferences`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to fetch preferences");
        }

        const data: UserPreferences = await response.json();
        setPreferences(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch preferences";
        setPrefsError(message);
      } finally {
        setPrefsLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const handleProfileUpdate = async (profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => {
    try {
      setSuccessMessage(null);
      await updateProfile(profileData);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled in useAuth hook
      console.error("Profile update error:", err);
    }
  };

  const handlePreferencesUpdate = async (prefsData: Partial<UserPreferences>) => {
    try {
      setSuccessMessage(null);
      await updatePreferences(prefsData);
      setPreferences((prev) => (prev ? { ...prev, ...prefsData } : null));
      setSuccessMessage("Preferences updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled in useAuth hook
      console.error("Preferences update error:", err);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="auth-notice">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      {prefsError && <div className="error-message" role="alert">{prefsError}</div>}
      {successMessage && <div className="success-message" role="status">{successMessage}</div>}

      <div className="profile-grid">
        <div className="profile-section">
          <div className="section-header">
            <h2>Profile Information</h2>
            <span className="section-icon">ℹ️</span>
          </div>
          {isLoading ? (
            <p className="loading-text">Loading...</p>
          ) : (
            <UserForm
              user={user}
              onSubmit={handleProfileUpdate}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className="preferences-section">
          <div className="section-header">
            <h2>Preferences</h2>
            <span className="section-icon">⚙️</span>
          </div>
          {prefsLoading ? (
            <p className="loading-text">Loading preferences...</p>
          ) : preferences ? (
            <PreferencesForm
              preferences={preferences}
              onSubmit={handlePreferencesUpdate}
              isLoading={prefsLoading}
            />
          ) : (
            <p className="empty-text">No preferences found</p>
          )}
        </div>
      </div>

      <style>{`
        .profile-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: var(--space-xl);
          animation: fadeIn 0.3s ease-out;
        }

        .profile-header {
          text-align: center;
          margin-bottom: var(--space-3xl);
          padding-bottom: var(--space-xl);
          border-bottom: 2px solid var(--primary-50);
        }

        .profile-header h1 {
          margin: 0 0 var(--space-sm) 0;
          color: var(--primary);
          font-size: var(--text-4xl);
        }

        .profile-header p {
          margin: 0;
          color: var(--text-muted);
          font-size: var(--text-base);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: var(--space-2xl);
        }

        .profile-section, .preferences-section {
          background: var(--bg-card);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          box-shadow: var(--shadow-md);
          transition: var(--transition-base);
        }

        .profile-section:hover, .preferences-section:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-lg);
          border-bottom: 2px solid var(--border-light);
        }

        .section-header h2 {
          margin: 0;
          color: var(--primary);
          font-size: var(--text-2xl);
        }

        .section-icon {
          font-size: var(--text-2xl);
        }

        .loading-text, .empty-text {
          color: var(--text-muted);
          text-align: center;
          padding: var(--space-lg);
          font-size: var(--text-base);
        }

        .error-message {
          background: var(--alert-light);
          color: var(--alert-dark);
          border: 2px solid var(--alert);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          animation: slideInDown 0.3s ease-out;
        }

        .success-message {
          background: var(--success-light);
          color: var(--success-dark);
          border: 2px solid var(--success);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          animation: slideInDown 0.3s ease-out;
          font-weight: var(--font-semibold);
        }

        .auth-notice {
          background: linear-gradient(135deg, var(--primary-50), var(--accent));
          border: 2px dashed var(--primary);
          border-radius: var(--radius-lg);
          padding: var(--space-3xl) var(--space-lg);
          text-align: center;
        }

        .auth-notice p {
          color: var(--primary-dark);
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .profile-container {
            padding: var(--space-lg);
          }

          .profile-grid {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }

          .profile-section, .preferences-section {
            padding: var(--space-lg);
          }

          .profile-header h1 {
            font-size: var(--text-3xl);
          }
        }

        @media (max-width: 480px) {
          .profile-container {
            padding: var(--space-md);
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}

interface PreferencesFormProps {
  preferences: UserPreferences;
  onSubmit: (prefs: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

function PreferencesForm({ preferences, onSubmit, isLoading }: PreferencesFormProps) {
  const [formData, setFormData] = useState<UserPreferences>(preferences);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const changes: Partial<UserPreferences> = {};

    if (formData.language !== preferences.language) {
      changes.language = formData.language;
    }
    if (formData.theme !== preferences.theme) {
      changes.theme = formData.theme;
    }
    if (formData.notifications !== preferences.notifications) {
      changes.notifications = formData.notifications;
    }

    if (Object.keys(changes).length > 0) {
      await onSubmit(changes);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="preferences-form">
      <div className="form-group">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="en">🇬🇧 English</option>
          <option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="theme">Theme</label>
        <select
          id="theme"
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="auto">🔄 Auto</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notifications">Notifications</label>
        <select
          id="notifications"
          name="notifications"
          value={formData.notifications}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="email">✉️ Email</option>
          <option value="push">🔔 Push</option>
          <option value="off">🔕 Off</option>
        </select>
      </div>

      <button type="submit" disabled={isLoading} className="btn btn-primary">
        {isLoading ? "Updating..." : "Update Preferences"}
      </button>

      <style>{`
        .preferences-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
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

        .form-group select {
          padding: var(--space-md);
          border: 2px solid var(--border-light);
          border-radius: var(--radius-lg);
          font-size: var(--text-base);
          transition: var(--transition-base);
          min-height: 44px;
          background: var(--bg-card);
        }

        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(46, 76, 140, 0.1);
        }

        .form-group select:disabled {
          background: var(--neutral-100);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn {
          padding: var(--space-md);
          border: none;
          border-radius: var(--radius-lg);
          font-weight: var(--font-bold);
          cursor: pointer;
          transition: var(--transition-base);
          min-height: 44px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          box-shadow: 0 4px 12px rgba(46, 76, 140, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(46, 76, 140, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
