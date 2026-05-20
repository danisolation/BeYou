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
        label: ["14px", { lineHeight: "1.5" }],
        body: ["16px", { lineHeight: "1.5" }],
        heading: ["20px", { lineHeight: "1.2", fontWeight: "600" }],
        display: ["28px", { lineHeight: "1.2", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
