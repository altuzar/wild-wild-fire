import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        flame: {
          50: "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          900: "#7c2d12",
        },
        ember: {
          900: "#1c0a03",
          800: "#2a0e04",
          700: "#3b1207",
        },
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "1", transform: "translateY(0)" },
          "50%": { opacity: "0.85", transform: "translateY(-1px)" },
        },
        deal: {
          "0%": { transform: "translateY(-200px) rotate(-15deg)", opacity: "0" },
          "100%": { transform: "translateY(0) rotate(0)", opacity: "1" },
        },
      },
      animation: {
        flicker: "flicker 1.6s ease-in-out infinite",
        deal: "deal 350ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
