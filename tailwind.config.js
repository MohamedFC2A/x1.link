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
        background: '#000000',
        foreground: '#f8fafc',
        card: {
          DEFAULT: '#060608',
          foreground: '#f8fafc',
        },
        popover: {
          DEFAULT: '#09090c',
          foreground: '#f8fafc',
        },
        primary: {
          DEFAULT: '#e11d48',
          foreground: '#ffffff',
          hover: '#be123c',
        },
        secondary: {
          DEFAULT: '#0d0d12',
          foreground: '#f8fafc',
          hover: '#171720',
        },
        muted: {
          DEFAULT: '#14141c',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#171720',
          foreground: '#f8fafc',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        ring: '#e11d48',
      },
      fontFamily: {
        sans: ['"Readex Pro"', '"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Fira Code"', '"Plus Jakarta Sans"', 'monospace'],
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
        },
        "dots-wave": {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.75)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer-slide 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "dots-wave": "dots-wave 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
