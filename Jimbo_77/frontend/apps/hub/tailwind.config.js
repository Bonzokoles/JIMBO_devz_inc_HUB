/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        brand: ['"Twobit"', '"Orbitron"', 'sans-serif'], // Using Twobit as primary brand font
        display: ['"Steelfish"', 'sans-serif'], // Secondary display font
      },
      colors: {
        background: '#0f111a', // Lighter dark theme (Reduced contrast)
        surface: '#1a1f2e',     // Lighter surface
        surfaceHighlight: '#252b40',
        primary: {
          DEFAULT: '#3B82F6',   // Electric Blue
          glow: '#60A5FA',
        },
        accent: {
          DEFAULT: '#8B5CF6',   // Neon Purple
          glow: '#A78BFA',
        },
        jimbo: {
          gold: '#F59E0B',      // The classic Jimbo Gold/Yellow
          dark: '#B45309',
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'neon-gradient': 'linear-gradient(to right, #3B82F6, #8B5CF6)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon': '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 25px rgba(139, 92, 246, 0.6)' },
        },
      }
    },
  },
  plugins: [],
}
