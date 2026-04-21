/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C63FF',
          secondary: '#00D4AA',
          light: '#8B85FF',
        },
        surface: {
          0: '#FFFFFF',
          1: '#F6F6F8',
          2: '#EDEDF2',
        },
        dark: {
          0: '#0F0F13',
          1: '#18181E',
          2: '#222228',
          3: '#2A2A35',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      animation: {
        'shimmer': 'shimmer 1.4s linear infinite',
        'fade-up': 'fadeUp 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10)',
        'modal': '0 20px 60px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
