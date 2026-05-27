import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Stitch design tokens — primary
        primary: "#00604e",
        "on-primary": "#ffffff",
        "primary-container": "#1e7a65",
        "on-primary-container": "#b1ffe6",
        "primary-fixed": "#9ef3d9",
        "primary-fixed-dim": "#82d6bd",

        // Secondary
        secondary: "#EAF7F3", // keep legacy value for backward compat (bg-secondary still works)
        "secondary-stitch": "#55615f",
        "secondary-legacy": "#EAF7F3",
        "on-secondary": "#ffffff",
        "secondary-container": "#d9e5e2",

        // Tertiary
        tertiary: "#854034",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#a3574a",

        // Error
        error: "#ba1a1a",
        "error-container": "#ffdad6",

        // Surface
        surface: "var(--surface)",
        "surface-dim": "#ccdbf3",
        "surface-bright": "#f8f9ff",
        "surface-container": "#e6eeff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",

        // Background
        background: "var(--background)",
        "on-background": "var(--foreground)",

        // Role colors
        "student-blue": "#3B82F6",
        "teacher-amber": "#D97706",
        "parent-purple": "#8B5CF6",
        "admin-slate": "#334155",

        // Outline
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        // Backward compat aliases
        accent: "#00604e",
        destructive: "#ba1a1a",
        warning: "#F59E0B",
      },
      fontSize: {
        // Legacy — keep for backward compat
        label: ["clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem)", { lineHeight: "1.5" }],
        body: ["clamp(0.95rem, 0.9rem + 0.25vw, 1rem)", { lineHeight: "1.6" }],
        heading: ["clamp(1.125rem, 1.02rem + 0.45vw, 1.25rem)", { lineHeight: "1.25", fontWeight: "600" }],
        display: ["clamp(1.75rem, 1.4rem + 1.45vw, 2.35rem)", { lineHeight: "1.12", fontWeight: "650" }],

        // Stitch typography scale
        "display-stitch": ["48px", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-lg": ["32px", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.5", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
      },
      spacing: {
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
      },
      maxWidth: {
        "container-stitch": "1280px",
      },
      borderRadius: {
        card: "32px",
        hero: "48px",
        button: "16px",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
