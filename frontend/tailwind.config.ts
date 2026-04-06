import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0a0a",
          light: "#fafafa",
        },
        surface: {
          DEFAULT: "#141414",
          light: "#ffffff",
          elevated: {
            DEFAULT: "#1e1e1e",
            light: "#f5f5f5",
          },
          hover: {
            DEFAULT: "#2a2a2a",
            light: "#ebebeb",
          },
        },
        accent: {
          DEFAULT: "#fa2d48",
          hover: "#ff4d6d",
          muted: "rgba(250, 45, 72, 0.15)",
        },
        text: {
          primary: {
            DEFAULT: "#ffffff",
            light: "#0a0a0a",
          },
          secondary: {
            DEFAULT: "#a0a0a0",
            light: "#666666",
          },
          tertiary: {
            DEFAULT: "#666666",
            light: "#999999",
          },
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          strong: "rgba(255, 255, 255, 0.12)",
          light: "rgba(0, 0, 0, 0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      fontSize: {
        // Refined typography scale
        "2xs": ["10px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        xs: ["11px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        sm: ["13px", { lineHeight: "1.5", letterSpacing: "0" }],
        base: ["14px", { lineHeight: "1.6", letterSpacing: "0" }],
        md: ["15px", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        lg: ["16px", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        xl: ["18px", { lineHeight: "1.4", letterSpacing: "-0.02em" }],
        "2xl": ["20px", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "3xl": ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "4xl": ["28px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "5xl": ["32px", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },
      spacing: {
        "4.5": "18px",
        "5.5": "22px",
        "18": "72px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
        md: "0 4px 12px rgba(0, 0, 0, 0.4)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.5)",
        glow: "0 0 40px rgba(250, 45, 72, 0.15)",
        "sm-light": "0 1px 2px rgba(0, 0, 0, 0.08)",
        "md-light": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "lg-light": "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right": "slideInRight 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
