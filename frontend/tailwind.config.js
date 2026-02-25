/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9eeff",
          200: "#b9ddff",
          300: "#8cc6ff",
          400: "#5aa8ff",
          500: "#2f84ff",
          600: "#1f66e5",
          700: "#1b54bf",
          800: "#1a4698",
          900: "#1a3b7a",
        },
      },
      boxShadow: {
        soft: "0 10px 40px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
}

