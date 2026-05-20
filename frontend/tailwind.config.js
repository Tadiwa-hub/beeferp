/**
 * Tailwind CSS Configuration
 * FeedLot Pro — Enterprise Agricultural Design System
 */

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#2563EB',
        'primary-light': '#3B82F6',
        'primary-glow': 'rgba(37, 99, 235, 0.12)',
        'accent': '#64748B',
        'accent-light': '#94A3B8',
        'background': '#F8FAFC',
        'background-dark': '#F1F5F9',
        'surface': '#FFFFFF',
        'surface-alt': '#F8FAFC',
        'success': '#059669',
        'warning': '#D97706',
        'danger': '#DC2626',
        'info': '#0284C7',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'serif': ['Lora', 'Georgia', 'serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'slide-in': 'slideInRight 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
        'elevated': '0 20px 40px rgba(0,0,0,0.12)',
        'glow-primary': '0 4px 14px rgba(45, 80, 22, 0.2)',
        'glow-accent': '0 4px 14px rgba(139, 111, 71, 0.2)',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
