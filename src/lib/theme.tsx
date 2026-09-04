"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
type Ctx = { mode: Mode; toggle: () => void; setMode: (m: Mode) => void };

const ThemeContext = createContext<Ctx | null>(null);

const KEY = "cda_theme";

/** Inline script — runs before paint to avoid a flash of the wrong theme. */
export const themeInitScript = `
(function(){try{
  var s = localStorage.getItem('${KEY}');
  var m = s || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', m);
}catch(e){}})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Mode) ?? "light";
    setModeState(current);
  }, []);

  const apply = useCallback((m: Mode) => {
    document.documentElement.setAttribute("data-theme", m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    setModeState(m);
  }, []);

  const toggle = useCallback(
    () => apply(mode === "dark" ? "light" : "dark"),
    [mode, apply],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggle, setMode: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
