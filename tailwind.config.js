export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monad: {
          50: "#f2f7ff",
          100: "#e6f0ff",
          200: "#bfd9ff",
          300: "#99c2ff",
          400: "#73abff",
          500: "#4c94ff",
          600: "#337bff",
          700: "#1e62f5",
          800: "#174cc2",
          900: "#11368f",
          950: "#0b245e",
        },
        cyan: {
          500: "#22e1ff",
          600: "#1bcfee",
          700: "#14bddc",
        },
        indigo: {
          900: "#0b1020",
          950: "#070b17",
        },
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'monad-gradient':
          'radial-gradient(1200px 600px at 10% -10%, rgba(34,225,255,0.15), rgba(34,225,255,0) 60%), radial-gradient(1000px 500px at 110% 10%, rgba(76,148,255,0.20), rgba(76,148,255,0) 60%), linear-gradient(180deg, #070b17, #0b1020)',
        'grid-radial':
          'radial-gradient(circle at center, rgba(255,255,255,0.15) 0.5px, transparent 0.6px)',
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'popover': 'popover 200ms cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'popover': {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
