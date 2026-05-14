import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Globe, Moon, Bell, Save } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  icon: React.ComponentType;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SelectField({
  label,
  name,
  value,
  icon,
  options,
  disabled,
  onChange,
}: SelectFieldProps) {
  const fieldId = `panel-${name}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="flex items-center gap-2 text-sm font-semibold text-text-primary"
      >
        <Icon icon={icon} />
        {label}
      </label>
      <select
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="flex h-11 w-full rounded-lg border-2 border-border bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 hover:border-brand-300 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-alt"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
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

export function PreferencesPanel({
  preferences,
  onSubmit,
  isLoading,
}: PreferencesPanelProps) {
  const { setTheme } = useTheme();
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
    if (formData.language !== preferences.language)
      changes.language = formData.language;
    if (formData.theme !== preferences.theme)
      changes.theme = formData.theme;
    if (formData.notifications !== preferences.notifications)
      changes.notifications = formData.notifications;

    await onSubmit(changes);

    if (changes.theme) {
      setTheme(changes.theme as "light" | "dark" | "auto");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SelectField
        label="Language"
        name="language"
        value={formData.language}
        icon={Globe}
        options={LANGUAGE_OPTIONS}
        disabled={isLoading}
        onChange={handleChange}
      />

      <SelectField
        label="Theme"
        name="theme"
        value={formData.theme}
        icon={Moon}
        options={THEME_OPTIONS}
        disabled={isLoading}
        onChange={handleChange}
      />

      <SelectField
        label="Notifications"
        name="notifications"
        value={formData.notifications}
        icon={Bell}
        options={NOTIFICATION_OPTIONS}
        disabled={isLoading}
        onChange={handleChange}
      />

      <Button
        type="submit"
        disabled={isLoading || !hasChanges}
        className="w-full"
      >
        <Icon icon={Save} />
        {isLoading ? "Updating..." : "Save Preferences"}
      </Button>
    </form>
  );
}
