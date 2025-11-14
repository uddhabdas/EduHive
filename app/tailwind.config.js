module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#16A34A", soft: "#22C55E", dark: "#15803D" },
        accent: { DEFAULT: "#10B981" },
        bg: { light: "#FFFFFF", dark: "#0B0F17" },
        primary1: '#00C6FF',
        primary2: '#0072FF',
        neutralDark: '#0F172A',
        muted: '#64748B',
      },
      borderRadius: {
        xl: 16,
        "2xl": 20,
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

