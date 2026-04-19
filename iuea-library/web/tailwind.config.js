/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── IUEA Design System v1.0 ───────────────────────────────────────
        primary: {
          DEFAULT: '#8A1228',
          dark:    '#5C0F1F',
          darker:  '#3D0810',
          light:   '#A6182F',
          soft:    '#F8D7D3',
        },
        maroon: {
          950: '#2A050C',
          900: '#3D0810',
          800: '#5C0F1F',
          700: '#8A1228',
          600: '#A6182F',
          500: '#BD2640',
          400: '#D05468',
          300: '#E590A0',
        },
        blush: {
          50:  '#FDF4F2',
          100: '#FCE8E6',
          200: '#F8D7D3',
          300: '#F2BEB8',
          400: '#E89F98',
        },
        gold: {
          300: '#D9B96B',
          500: '#B8964A',
          700: '#8B6F2E',
        },
        ink: {
          900: '#1C0A0C',
          700: '#3E2B2E',
          500: '#6B5456',
          300: '#A89597',
        },
        accent: {
          DEFAULT: '#B8964A',
          light:   '#D9B96B',
          dark:    '#8B6F2E',
          soft:    '#F5E8C9',
        },
        // Semantic
        'bg-app':     '#FCE8E6',
        'bg-sidebar': '#5C0F1F',
        'bg-card':    '#FFFFFF',
        'border-line':'#EBD2CF',
        // Status
        success: '#2E7D5B',
        warning: '#D07E1A',
        error:   '#B5352F',
      },

      fontFamily: {
        serif:    ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        sans:     ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:     ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        headline: ['Playfair Display', 'Georgia', 'serif'],
        body:     ['Inter', 'sans-serif'],
        reading:  ['Playfair Display', 'Georgia', 'serif'],
      },

      borderRadius: {
        xs:   '6px',
        sm:   '10px',
        md:   '14px',
        lg:   '20px',
        xl:   '28px',
        pill: '999px',
        full: '9999px',
        // legacy
        card:  '14px',
        btn:   '999px',
        input: '14px',
      },

      boxShadow: {
        xs:   '0 1px 2px rgba(107,15,26,0.06)',
        sm:   '0 2px 6px rgba(107,15,26,0.07), 0 1px 2px rgba(107,15,26,0.04)',
        md:   '0 8px 24px rgba(107,15,26,0.10), 0 2px 6px rgba(107,15,26,0.06)',
        lg:   '0 18px 40px rgba(107,15,26,0.14), 0 4px 10px rgba(107,15,26,0.06)',
        book: '0 10px 24px rgba(60,10,18,0.28)',
        // legacy
        card:  '0 2px 6px rgba(107,15,26,0.07), 0 1px 2px rgba(107,15,26,0.04)',
        modal: '0 18px 40px rgba(107,15,26,0.14), 0 4px 10px rgba(107,15,26,0.06)',
        nav:   '0 -2px 8px rgba(0,0,0,0.06)',
        btn:   '0 2px 6px rgba(138,18,40,0.25)',
      },

      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to:   { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
