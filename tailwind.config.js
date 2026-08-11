/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // Prevents Tailwind from resetting global styles like h1, h2 and margins
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
