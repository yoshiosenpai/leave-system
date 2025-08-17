/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f9fc",
        card: "#ffffff",
        border: "#e5e7eb",
        accent: "#3b82f6",
      },
      borderRadius: {
        soft: "18px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(20, 30, 55, .06)",
        inset: "inset 0 1px 0 rgba(255,255,255,.9)",
      },
    },
  },
  plugins: [],
};
