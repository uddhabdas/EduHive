module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      spacing: {
        2: 8,
        3: 12,
        4: 16,
        6: 24,
      },
      borderRadius: {
        xl: 16,
      },
    },
  },
  plugins: [],
};
