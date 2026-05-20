/**
 * Tailwind CSS Configuration
 * FeedLot Pro custom theme and colors
 */

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Agricultural theme colors
        'primary': '#2D5016', // Dark green
        'primary-light': '#3D6B1F',
        'accent': '#8B6F47', // Earth brown
        'accent-light': '#A68F5E',
        'background': '#F5F1E8', // Cream
        'background-dark': '#E8E3D6',
        'success': '#22863A',
        'warning': '#ED8D00',
        'danger': '#CB2431',
        'info': '#0366D6',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Lora', 'serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'default': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'default': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
