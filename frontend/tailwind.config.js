/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
        fontFamily: {
            sans: ['"SF Pro"', "ui-sans-serif", "system-ui"],
        },
      colors: {
        bg: "#f7f9fc",      // used as bg-bg
        card: "#ffffff",     // used as bg-card
        border: "#e5e7eb",   // used as border-border
        accent: "#3b82f6",   // used as bg-accent / text-accent
      },
      borderRadius: { soft: "18px" },
      boxShadow: {
        soft: "0 8px 24px rgba(20, 30, 55, .06)",
        inset: "inset 0 1px 0 rgba(255,255,255,.9)",
      },
    },
  },
  plugins: [],
};
