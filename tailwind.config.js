/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)', soft: 'rgb(var(--color-bg-soft) / <alpha-value>)', card: 'rgb(var(--color-card) / <alpha-value>)', elev: 'rgb(var(--color-elev) / <alpha-value>)' },
        border: { DEFAULT: 'rgb(var(--color-border) / <alpha-value>)', soft: 'rgb(var(--color-border-soft) / <alpha-value>)' },
        text: { DEFAULT: 'rgb(var(--color-text) / <alpha-value>)', muted: 'rgb(var(--color-text-muted) / <alpha-value>)', faint: 'rgb(var(--color-text-faint) / <alpha-value>)' },
        primary: { DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)', hover: 'rgb(var(--color-primary-hover) / <alpha-value>)', deep: 'rgb(var(--color-primary-deep) / <alpha-value>)' },
        success: { DEFAULT: 'rgb(var(--color-success) / <alpha-value>)' },
        warning: { DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)' },
        error: { DEFAULT: 'rgb(var(--color-error) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)',
        glow: '0 0 24px rgba(46,94,255,0.20)',
        primary: '0 0 12px rgba(46,94,255,0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
