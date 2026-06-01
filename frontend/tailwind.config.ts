import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Peerlight design tokens — primary (violet)
        primary: "#7457e8",
        "on-primary": "#ffffff",
        "primary-container": "#efeaff",
        "on-primary-container": "#2c1d6b",
        "primary-fixed": "#e9e4ff",
        "primary-fixed-dim": "#cfc4ff",

        // Secondary
        secondary: "#efeaff", // light violet (bg-secondary still works)
        "secondary-stitch": "#6d7394",
        "secondary-legacy": "#efeaff",
        "on-secondary": "#2c1d6b",
        "secondary-container": "#e4e8ff",

        // Tertiary (pink accent)
        tertiary: "#f36bac",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#ffd9ec",

        // Accent family (from mockup)
        "accent-violet": "#9178ff",
        "accent-blue": "#65aefc",
        "accent-cyan": "#85e9f1",
        "accent-pink": "#f36bac",

        // Error
        error: "#ba1a1a",
        "error-container": "#ffdad6",

        // Surface
        surface: "var(--surface)",
        "surface-dim": "#dfe3f5",
        "surface-bright": "#ffffff",
        "surface-container": "#f1f0ff",
        "surface-container-low": "#f7f6ff",
        "surface-container-high": "#e9e8ff",

        // Background
        background: "var(--background)",
        "on-background": "var(--foreground)",

        // Role colors
        "student-blue": "#65aefc",
        "teacher-amber": "#D97706",
        "parent-purple": "#9178ff",
        "admin-slate": "#334155",

        // Outline
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        // Backward compat aliases
        accent: "#7457e8",
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
      borderRadius: {
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
