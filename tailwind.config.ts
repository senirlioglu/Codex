import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbff",
          100: "#d5f4ff",
          500: "#10b3e8",
          700: "#0576ab",
          900: "#053656"
        }
      }
    }
  },
  plugins: []
};

export default config;
