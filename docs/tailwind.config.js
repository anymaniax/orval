// tailwind.config.js

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  corePlugins: {
    preflight: true,
    float: false,
  },
  purge: {
    enabled: process.env.NODE_ENV !== 'development',
    content: ['./src/**/*.js'],
    options: {
      defaultExtractor: (content) => content.match(/[\w-/.:]+(?<!:)/g) || [],
    },
  },
  theme: {
    backgroundColor: (theme) => ({
      ...theme('colors'),
      highlight: '#5e5a6f',
    }),
    extend: {
      colors: {
        coral: {
          light: '#5e5a6f',
          default: '#9c7344',
          dark: '#5e5a6f',
        },
      },
    },
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
      serif: ['Inter', ...defaultTheme.fontFamily.serif],
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1400px',
    },
    rotate: {
      ...defaultTheme.rotate,
      '-30': '-30deg',
    },
    container: {
      padding: '1rem',
    },
    customForms: (theme) => ({
      sm: {
        'input, textarea, multiselect, select': {
          fontSize: theme('fontSize.sm'),
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
        },
        select: {
          paddingRight: `${theme('spacing.4')}`,
        },
        'checkbox, radio': {
          width: theme('spacing.3'),
          height: theme('spacing.3'),
        },
      },
    }),
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
};
