import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0f0f0f",
          light: "#f5f5f0",
        },
        surface: {
          DEFAULT: "#1a1a1a",
          light: "#ffffff",
          elevated: {
            DEFAULT: "#252525",
            light: "#f0f0eb",
          },
        },
        accent: {
          DEFAULT: "#ff4444",
          primary: "#ff4444",
          secondary: {
            DEFAULT: "#ffffff",
            light: "#0f0f0f",
          },
        },
        text: {
          primary: {
            DEFAULT: "#ffffff",
            light: "#0f0f0f",
          },
          secondary: {
            DEFAULT: "#aaaaaa",
            light: "#555555",
          },
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          light: "rgba(0, 0, 0, 0.08)",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      fontSize: {
        metadata: ["11px", { lineHeight: "1.4" }],
        secondary: ["13px", { lineHeight: "1.5" }],
        body: ["15px", { lineHeight: "1.6" }],
        title: ["17px", { lineHeight: "1.4" }],
        section: ["24px", { lineHeight: "1.2" }],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
