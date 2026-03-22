/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter — same as PyCharm's UI font
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        // ── Sidebar (JetBrains dark) ──────────────────────────────
        sidebar: {
          bg:      '#1a1b1e',
          surface: '#2c2d31',
          hover:   '#25262a',
          border:  '#2c2d31',
          text:    '#ebebeb',
          muted:   '#9b9da8',
          subtle:  '#5c5e6e',
        },
        // ── Main content area ─────────────────────────────────────
        clinical: {
          bg:      '#f4f6f9',
          surface: '#ffffff',
          border:  '#e3e7ec',
          text:    '#19191c',
          muted:   '#62656e',
          subtle:  '#9ba0ad',
          accent:  '#3574f0',   // JetBrains blue
        },
        // ── Alert levels ──────────────────────────────────────────
        status: {
          normal:   '#1a9e50',
          monitor:  '#d98a00',
          elevated: '#d45f00',
          critical: '#d91a0d',
        },
      },
    },
  },
  plugins: [],
};
