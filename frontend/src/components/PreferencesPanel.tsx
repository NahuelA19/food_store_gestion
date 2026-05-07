import { useState } from "react";

interface UserPreferences {
  language: string;
  theme: string;
  notifications: string;
}

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onSubmit: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const NOTIFICATION_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "off", label: "Off" },
];

export function PreferencesPanel({ preferences, onSubmit, isLoading }: PreferencesPanelProps) {
  const [formData, setFormData] = useState<UserPreferences>(preferences);

  const hasChanges =
    formData.language !== preferences.language ||
    formData.theme !== preferences.theme ||
    formData.notifications !== preferences.notifications;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    const changes: Partial<UserPreferences> = {};
    if (formData.language !== preferences.language) changes.language = formData.language;
    if (formData.theme !== preferences.theme) changes.theme = formData.theme;
    if (formData.notifications !== preferences.notifications) changes.notifications = formData.notifications;

    await onSubmit(changes);
  };

  return (
    <form onSubmit={handleSubmit} className="preferences-panel">
      <div className="form-group">
        <label htmlFor="panel-language">Language</label>
        <select
          id="panel-language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          disabled={isLoading}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="panel-theme">Theme</label>
        <select
          id="panel-theme"
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          disabled={isLoading}
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="panel-notifications">Notifications</label>
        <select
          id="panel-notifications"
          name="notifications"
          value={formData.notifications}
          onChange={handleChange}
          disabled={isLoading}
        >
          {NOTIFICATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={isLoading || !hasChanges} className="submit-button">
        {isLoading ? "Updating..." : "Save Preferences"}
      </button>
    </form>
  );
}
