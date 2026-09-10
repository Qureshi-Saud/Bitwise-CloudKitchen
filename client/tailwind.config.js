/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // 'xs' covers the 320-400px phones (iPhone SE, older Androids) that the
    // default scale jumps straight past. Declared here rather than in extend so
    // the generated media queries stay in ascending width order.
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1360px' },
    },
    extend: {
      colors: {
        // Fresh-kitchen greens as the primary brand ramp.
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        // Warm accent for CTAs, badges and food photography overlays.
        carrot: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12',
        },
        cream: '#faf8f3',
        charcoal: '#1c1917',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12)',
        lift: '0 12px 32px -12px rgba(22,101,52,.28)',
        pop: '0 20px 48px -20px rgba(16,24,40,.35)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
      backgroundImage: {
        'hero-grain': 'radial-gradient(circle at 20% 20%, rgba(34,197,94,.10), transparent 45%), radial-gradient(circle at 85% 15%, rgba(249,115,22,.10), transparent 40%)',
      },
    },
  },
  plugins: [],
};
