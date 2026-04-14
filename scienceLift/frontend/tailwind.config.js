module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        'primary-dark': '#0052a3',
        secondary: '#f5f5f5',
        border: '#e0e0e0',
      },
    },
  },
  plugins: [],
}
