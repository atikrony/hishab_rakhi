/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#079be8",
          ink: "#17191d",
          muted: "#a4a5a8",
          line: "#ededf0",
          green: "#219b35",
          red: "#fa4563",
          bg: "#f4f5f7",
          card: "#fbfbfc"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        app: "0 0 35px rgba(16, 24, 40, 0.05)",
        card: "0 1px 3px rgba(0, 0, 0, 0.03)",
        modal: "0 20px 40px -15px rgba(0,0,0,0.12)",
        actionAdd: "inset 0 2px 4px rgba(255, 255, 255, 0.38), inset 0 -2px 4px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.07)",
        actionSave: "inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.12)",
      }
    },
  },
  plugins: [],
};
