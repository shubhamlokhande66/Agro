import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        line: "var(--border)",
        ink: {
          DEFAULT: "var(--text)",
          soft: "var(--text2)",
          faint: "var(--text3)",
        },
        brand: {
          navy: "#1A3A5C",
          "navy-deep": "#0f2744",
          green: "#0d9e77",
          "green-deep": "#0b7d5f",
        },
        pos: { DEFAULT: "#1a7a52", bg: "#e8f5ee" },
        neg: { DEFAULT: "#c0392b", bg: "#fdecea" },
        warn: { DEFAULT: "#b45309", bg: "#fef3c7" },
        info: { DEFAULT: "#1a4f8a", bg: "#e8f0fa" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.08)",
        pop: "0 12px 40px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
