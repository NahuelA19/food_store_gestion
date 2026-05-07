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
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      {error && <div className="error-message">{error}</div>}
      {prefsError && <div className="error-message">{prefsError}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="profile-section">
        <h2>Profile Information</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <UserForm
            user={user}
            onSubmit={handleProfileUpdate}
            isLoading={isLoading}
          />
        )}
      </div>

      <div className="preferences-section">
        <h2>Preferences</h2>
        {prefsLoading ? (
          <p>Loading preferences...</p>
        ) : preferences ? (
          <PreferencesForm
            preferences={preferences}
            onSubmit={handlePreferencesUpdate}
            isLoading={prefsLoading}
          />
        ) : (
          <p>No preferences found</p>
        )}
      </div>
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
        <label htmlFor="language">Language:</label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="theme">Theme:</label>
        <select
          id="theme"
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notifications">Notifications:</label>
        <select
          id="notifications"
          name="notifications"
          value={formData.notifications}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="email">Email</option>
          <option value="push">Push</option>
          <option value="off">Off</option>
        </select>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Preferences"}
      </button>
    </form>
  );
}
