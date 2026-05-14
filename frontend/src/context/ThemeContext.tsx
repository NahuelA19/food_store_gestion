/**
 * ThemeContext — Dark mode with system preference detection + manual toggle
 *
 * Features:
 * - Reads prefers-color-scheme on first visit
 * - Persists manual toggle in localStorage
 * - Adds/removes `.dark` class on document.documentElement
 * - Updates meta theme-color for mobile browser chrome
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "auto";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "food-store-theme";

function applyTheme(theme: Theme): boolean {
  const root = document.documentElement;
  const isDark = theme === "auto" 
    ? window.matchMedia("(prefers-color-scheme: dark)").matches 
    : theme === "dark";

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update meta theme-color for mobile browser chrome
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      isDark ? "#1a1a1a" : "#fbf9f7"
    );
  }
  return isDark;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  // Apply theme on mount and when theme state changes
  useEffect(() => {
    const activeIsDark = applyTheme(theme);
    setIsDark(activeIsDark);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system preference changes (only matters when "auto")
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "auto") {
        const activeIsDark = applyTheme("auto");
        setIsDark(activeIsDark);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Add meta theme-color tag if missing
  useEffect(() => {
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#fbf9f7";
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme, isDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
