/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      colors: {
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#7c3aed',
        background: '#ffffff',
        foreground: '#111827',
      },
    },
  },
  plugins: [],
}
