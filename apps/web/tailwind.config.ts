import type { Config } from "tailwindcss";

export default {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{ts,tsx}"],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        panel: "0 1px 2px rgb(15 23 42 / 0.07), 0 14px 34px rgb(36 56 39 / 0.08)",
      },
      colors: {
        emerald: {
          50: "#f4f6f1",
          100: "#e5ebdf",
          200: "#cdd9c5",
          300: "#a9bea0",
          400: "#819c76",
          500: "#627f58",
          600: "#4b6545",
          700: "#394f37",
          800: "#293b2b",
          900: "#1c2b20",
          950: "#101a13",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
