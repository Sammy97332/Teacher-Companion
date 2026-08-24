/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        chalkboard: "#1F3D2E",
        chalkboard2: "#28493A",
        paper: "#FBF9F4",
        slate: "#3D4A47",
        amber: "#C99A3A",
        terracotta: "#B5563C",
        line: "#E4DFD3",
      },
      fontFamily: {
        display: ["Lora", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
