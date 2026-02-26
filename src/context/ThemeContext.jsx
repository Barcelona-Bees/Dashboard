/**
 * ThemeContext – provides light/dark theme state app-wide
 *
 * - Persists preference to localStorage (key: bb_theme)
 * - Applies data-theme="dark" on <html> so CSS variables switch
 * - Default: light (or system preference via prefers-color-scheme if we add that later)
 */
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "bb_theme";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = (value) => setThemeState(value === "dark" ? "dark" : "light");
  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
