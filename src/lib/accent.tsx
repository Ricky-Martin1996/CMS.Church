"use client";

import * as React from "react";

export type AccentId = "teal" | "ocean" | "sage" | "copper" | "indigo";

const ACCENT_KEY = "churchos-accent";

type AccentContextValue = {
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
};

const AccentContext = React.createContext<AccentContextValue | null>(null);

export const accents: { id: AccentId; label: string; swatch: string }[] = [
  { id: "teal", label: "Teal", swatch: "hsl(174 48% 40%)" },
  { id: "ocean", label: "Ocean", swatch: "hsl(199 72% 42%)" },
  { id: "sage", label: "Sage", swatch: "hsl(152 28% 40%)" },
  { id: "copper", label: "Copper", swatch: "hsl(24 55% 46%)" },
  { id: "indigo", label: "Indigo", swatch: "hsl(226 42% 48%)" },
];

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<AccentId>("teal");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(ACCENT_KEY) as AccentId | null;
    if (stored && accents.some((a) => a.id === stored)) {
      setAccentState(stored);
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (accent === "teal") {
      root.removeAttribute("data-accent");
    } else {
      root.setAttribute("data-accent", accent);
    }
    window.localStorage.setItem(ACCENT_KEY, accent);
  }, [accent, ready]);

  const setAccent = React.useCallback((next: AccentId) => {
    setAccentState(next);
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const ctx = React.useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within AccentProvider");
  return ctx;
}
