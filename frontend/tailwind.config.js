/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'stunna-bg': '#2C1414',
        'stunna-accent': '#A31616',
        'stunna-text': '#EAEAEA',
      }
    },
  },
  plugins: [],
}
