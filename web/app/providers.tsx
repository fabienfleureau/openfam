"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "signal-atlas" | "playground-control" | "nightshift";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "openfam-theme";

const themes: { id: Theme; name: string; description: string }[] = [
  {
    id: "signal-atlas",
    name: "Signal Atlas",
    description: "Serif headings, crisp borders",
  },
  {
    id: "playground-control",
    name: "Playground Control",
    description: "Friendly, rounded sans-serif",
  },
  {
    id: "nightshift",
    name: "Nightshift Utilities",
    description: "Industrial, condensed display",
  },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("signal-atlas");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (stored && themes.some((t) => t.id === stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {mounted ? children : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export { themes };
