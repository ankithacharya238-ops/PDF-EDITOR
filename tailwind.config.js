/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: '#050711',
        navy: '#090d1f',
        slateDeep: '#0f162d',
        electric: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          indigo: '#6366f1',
        },
      },
      boxShadow: {
        glowPurple: '0 0 30px rgba(139, 92, 246, 0.35)',
        glowCyan: '0 0 30px rgba(6, 182, 212, 0.3)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
    },
  },
  plugins: [],
};
