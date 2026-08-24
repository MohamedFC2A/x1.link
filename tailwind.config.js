/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#f8fafc',
        card: {
          DEFAULT: '#121215',
          foreground: '#f8fafc',
        },
        popover: {
          DEFAULT: '#18181b',
          foreground: '#f8fafc',
        },
        primary: {
          DEFAULT: '#e11d48',
          foreground: '#ffffff',
          hover: '#be123c',
        },
        secondary: {
          DEFAULT: '#18181b',
          foreground: '#f8fafc',
          hover: '#27272a',
        },
        muted: {
          DEFAULT: '#1e1e24',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#27272a',
          foreground: '#f8fafc',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: '#27272a',
        ring: '#e11d48',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'monospace'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer-slide": {
          "0%": { transform: "translateX(150%) skewX(-12deg)" },
          "100%": { transform: "translateX(-150%) skewX(-12deg)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer-slide 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
}
