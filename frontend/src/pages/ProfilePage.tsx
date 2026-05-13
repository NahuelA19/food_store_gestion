import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { UserForm } from "../components/UserForm";
import { PreferencesPanel } from "../components/PreferencesPanel";
import { DireccionesPanel } from "../components/DireccionesPanel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { User, Settings, Package, MapPin } from "lucide-react";

interface UserPreferences {
  language: string;
  theme: string;
  notifications: string;
}

type Tab = "perfil" | "preferencias" | "direcciones" | "ordenes";

const TABS: { key: Tab; label: string; icon: React.ComponentType }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "preferencias", label: "Preferencias", icon: Settings },
  { key: "direcciones", label: "Direcciones", icon: MapPin },
  { key: "ordenes", label: "Órdenes", icon: Package },
];

export function ProfilePage() {
  const {
    user,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("perfil");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

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
        const message =
          err instanceof Error ? err.message : "Failed to fetch preferences";
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
      console.error("Profile update error:", err);
    }
  };

  const handlePreferencesUpdate = async (
    prefsData: Partial<UserPreferences>
  ) => {
    try {
      setSuccessMessage(null);
      await updatePreferences(prefsData);
      setPreferences((prev) => (prev ? { ...prev, ...prefsData } : null));
      setSuccessMessage("Preferences updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Preferences update error:", err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-2 border-dashed border-brand text-center py-16">
          <CardContent>
            <p className="text-lg font-semibold text-brand-dark">
              Please log in to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center pb-4 border-b-2 border-brand-50">
        <h1 className="text-4xl font-bold text-brand m-0">My Profile</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border-2 border-danger bg-danger/10 p-4 text-danger-dark font-medium"
          role="alert"
        >
          {error}
        </div>
      )}
      {prefsError && (
        <div
          className="rounded-lg border-2 border-danger bg-danger/10 p-4 text-danger-dark font-medium"
          role="alert"
        >
          {prefsError}
        </div>
      )}
      {successMessage && (
        <div
          className="rounded-lg border-2 border-success bg-success/10 p-4 font-semibold text-success-dark"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <div className="flex gap-2 border-b border-border pb-0">
        {TABS.map(({ key, label, icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? "default" : "outline"}
            onClick={() => setActiveTab(key)}
            className="rounded-b-none border-b-0"
          >
            <Icon icon={icon} />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-text-muted py-4">Loading...</p>
            ) : (
              <UserForm
                user={user}
                onSubmit={handleProfileUpdate}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "preferencias" && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            {prefsLoading ? (
              <p className="text-center text-text-muted py-4">
                Loading preferences...
              </p>
            ) : preferences ? (
              <PreferencesPanel
                preferences={preferences}
                onSubmit={handlePreferencesUpdate}
                isLoading={prefsLoading}
              />
            ) : (
              <p className="text-center text-text-muted py-4">
                No preferences found
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "direcciones" && (
        <Card>
          <CardHeader>
            <CardTitle>Direcciones de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <DireccionesPanel />
          </CardContent>
        </Card>
      )}

      {activeTab === "ordenes" && (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-text-muted py-4">
              Your orders will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
