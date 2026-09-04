import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        elevated: "var(--elevated)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        ink: {
          DEFAULT: "var(--text)",
          soft: "var(--text-2)",
          faint: "var(--text-3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
          soft: "var(--accent-soft)",
          contrast: "var(--accent-contrast)",
        },
        pos: { DEFAULT: "var(--pos)", soft: "var(--pos-soft)" },
        neg: { DEFAULT: "var(--neg)", soft: "var(--neg-soft)" },
        warn: { DEFAULT: "var(--warn)", soft: "var(--warn-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        violet: { DEFAULT: "var(--violet)", soft: "var(--violet-soft)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        panel: "16px",
      },
      boxShadow: {
        panel: "0 1px 2px rgb(var(--shadow-color) / 0.04), 0 8px 24px -12px rgb(var(--shadow-color) / 0.12)",
        pop: "0 24px 60px -18px rgb(var(--shadow-color) / 0.32)",
      },
      screens: {
        xs: "460px",
      },
    },
  },
  plugins: [],
};

export default config;
