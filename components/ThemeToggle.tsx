"use client";

import { useEffect, useSyncExternalStore } from "react";

// External store for theme state - shared across all components and synced across tabs
const themeStore = {
  listeners: new Set<() => void>(),
  theme: "dark" as "dark" | "light",

  getSnapshot() {
    return themeStore.theme;
  },

  getServerSnapshot() {
    return "dark" as const;
  },

  subscribe(listener: () => void) {
    themeStore.listeners.add(listener);

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        themeStore.theme = e.newValue as "dark" | "light";
        document.documentElement.setAttribute("data-theme", e.newValue);
        themeStore.notifyListeners();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      themeStore.listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  },

  notifyListeners() {
    themeStore.listeners.forEach((listener) => listener());
  },

  setTheme(newTheme: "dark" | "light") {
    themeStore.theme = newTheme;
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    themeStore.notifyListeners();
  },

  initialize() {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    themeStore.theme = (stored || (prefersDark ? "dark" : "light")) as "dark" | "light";
  },
};

// Initialize on module load (client-side only)
if (typeof window !== "undefined") {
  themeStore.initialize();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );

  // Initialize on mount to handle edge cases
  useEffect(() => {
    themeStore.initialize();
  }, []);

  const toggleTheme = () => {
    themeStore.setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

