/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          text:     'rgb(var(--notion-text) / <alpha-value>)',
          subtle:   'rgb(var(--notion-subtle) / <alpha-value>)',
          light:    'rgb(var(--notion-light) / <alpha-value>)',
          bg:       'rgb(var(--notion-bg) / <alpha-value>)',
          bgSoft:   'rgb(var(--notion-bgSoft) / <alpha-value>)',
          page:     'rgb(var(--notion-page) / <alpha-value>)',
          hover:    'rgb(var(--notion-hover) / <alpha-value>)',
          hoverMid: 'rgb(var(--notion-hoverMid) / <alpha-value>)',
          border:   'rgb(var(--notion-border) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
