import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FCFF",
        secondary: "#EAF7F3",
        accent: "#2CA58D",
        warning: "#F59E0B",
        destructive: "#DC2626",
      },
      fontSize: {
        label: ["clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem)", { lineHeight: "1.5" }],
        body: ["clamp(0.95rem, 0.9rem + 0.25vw, 1rem)", { lineHeight: "1.6" }],
        heading: ["clamp(1.125rem, 1.02rem + 0.45vw, 1.25rem)", { lineHeight: "1.25", fontWeight: "600" }],
        display: ["clamp(1.75rem, 1.4rem + 1.45vw, 2.35rem)", { lineHeight: "1.12", fontWeight: "650" }],
      },
    },
  },
  plugins: [],
};

export default config;
