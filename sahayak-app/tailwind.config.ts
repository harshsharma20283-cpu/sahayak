import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F6F4A",
          hover: "#18583B",
          light: "#E8F5EE",
        },
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          light: "#FFF6E5",
        },
        bg: "#FAF8F3",
        ink: {
          DEFAULT: "#14211B",
          secondary: "#4B5B53",
          muted: "#6B7280",
        },
        success: "#16A34A",
        warning: "#D97706",
        neutral: "#6B7280",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-devanagari)", "Inter", "Noto Sans Devanagari", "sans-serif"],
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(31, 111, 74, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        "glass-strong": "0 10px 40px rgba(31, 111, 74, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        "glass-hover": "0 12px 36px rgba(31, 111, 74, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        glow: "0 0 28px rgba(31, 111, 74, 0.35)",
        "glow-accent": "0 0 28px rgba(245, 158, 11, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
