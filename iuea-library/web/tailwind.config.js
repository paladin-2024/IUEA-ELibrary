/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B0D1E',
          dark:    '#4A0810',
          light:   '#9B2D3E',
        },
        accent: {
          DEFAULT: '#C9A84C',
          light:   '#E8C97A',
        },
        surface: {
          DEFAULT: '#FDF6F7',
          dark:    '#2A0D12',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      borderRadius: {
        card:  '12px',
        btn:   '8px',
        input: '6px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(123,13,30,0.08)',
        btn:  '0 2px 6px rgba(123,13,30,0.20)',
      },
    },
  },
  plugins: [],
};
