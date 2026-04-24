/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        notion: {
          text:     '#37352f',
          subtle:   '#787774',
          light:    '#9b9a97',
          bg:       '#ffffff',
          bgSoft:   '#f7f7f5',
          hover:    '#f1f1ef',
          hoverMid: '#e9e9e7',
          border:   '#e9e9e7',
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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
}
