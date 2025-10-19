/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GitHub color palette
        github: {
          canvas: {
            default: '#0d1117',
            subtle: '#161b22',
            inset: '#010409',
          },
          border: {
            default: '#30363d',
            muted: '#21262d',
          },
          fg: {
            default: '#e6edf3',
            muted: '#848d97',
            subtle: '#6e7681',
          },
          accent: {
            fg: '#2f81f7',
            emphasis: '#1f6feb',
          },
          success: {
            fg: '#3fb950',
          },
          attention: {
            fg: '#d29922',
          },
          danger: {
            fg: '#f85149',
          },
        },
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
