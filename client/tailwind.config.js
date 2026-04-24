/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        notion: {
          text:     '#2a2a27',
          subtle:   '#6b6b68',
          light:    '#9b9a97',
          bg:       '#ffffff',
          bgSoft:   '#ebeae4',
          page:     '#d3d2cd',
          hover:    '#ebeae4',
          hoverMid: '#dedcd4',
          border:   '#c7c6bf',
          blue:     '#2383e2',
          blueBg:   '#d3e5ef',
          green:    '#448361',
          greenBg:  '#dbeddb',
          red:      '#e03e3e',
          redBg:    '#ffe2dd',
          orange:   '#d9730d',
          orangeBg: '#fadec9',
          yellow:   '#dfab01',
          yellowBg: '#fdecc8',
          purple:   '#6940a5',
          purpleBg: '#e8deee',
          pink:     '#ad1a72',
          pinkBg:   '#f5e0e9'
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
