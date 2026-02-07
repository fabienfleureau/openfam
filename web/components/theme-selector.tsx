"use client";

import { useTheme, themes } from "@/app/providers";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const themeColors: Record<string, string> = {
  "signal-atlas": "#268bd2",
  "solarized-zen": "#2aa198",
};

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find((t) => t.id === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 theme-card hover:bg-muted transition-colors"
        aria-label="Select theme"
      >
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: themeColors[theme] || "#268bd2" }}
        />
        <span className="text-sm font-medium">{currentTheme?.name}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 theme-card bg-card shadow-lg min-w-[200px] animate-fade-in">
            <div className="p-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    theme === t.id ? "bg-muted" : "hover:bg-secondary"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border shrink-0"
                    style={{ backgroundColor: themeColors[t.id] || "#268bd2" }}
                  />
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.description}
                    </div>
                  </div>
                  {theme === t.id && (
                    <span className="ml-auto text-accent">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
