/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: soft violet (buttons, active states)
        focus: {
          50: '#F4F0FF',
          100: '#E9E2FF',
          200: '#D6C9FF',
          300: '#B9A3FF',
          400: '#9878FC',
          500: '#7C5CF8',
          600: '#6A47EE',
          700: '#5734CC',
          800: '#462AA3',
          900: '#3A2584',
          950: '#221452',
        },
        // Lime accent (selected status pill, progress knob)
        lime: {
          100: '#F1F5D2',
          200: '#E4ECA8',
          300: '#D5E08A',
          400: '#C7D46E',
          500: '#AEBF4E',
        },
        ink: '#17161D',
        // Deep forest green (habit breaker surface, charts, success)
        forest: {
          50: '#EEF3EC',
          100: '#DCE7D8',
          200: '#B9CFB1',
          300: '#8FB085',
          400: '#6B925F',
          500: '#537A48',
          600: '#416139',
          700: '#344E2F',
          800: '#2A3F28',
          900: '#213322',
          950: '#152217',
        },
        // Honey cards (priority tickets)
        honey: {
          50: '#FFF9EA',
          100: '#FDEFC9',
          200: '#FBE3A6',
          300: '#F6CF72',
          400: '#F0B84A',
          500: '#E39E2A',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F5B700', // ADHD-friendly Warm Amber
          600: '#D99B00',
          700: '#B47B00',
          800: '#925F05',
          900: '#784D09',
        },
        dino: {
          plum: '#5C2454',
          amber: '#F5B700',
          tummy: '#E8CFE0',
          leaf: '#549646',
          rest: '#407835',
          navy: '#547290',
          lightMint: '#eaf4ee',
          cream: '#fdfcf9',
        },
        leaf: {
          50: '#f2f8f0',
          100: '#e2f0dc',
          200: '#c5e2bc',
          300: '#9dcd91',
          400: '#6fb260',
          500: '#549646',
          600: '#407835',
          700: '#345e2c',
        },
        // Cool lavender-grey neutrals
        warm: {
          50: '#F8F6FC',
          100: '#F1EEF8',
          200: '#E4E0EF',
          300: '#CFCADF',
          400: '#A9A3BC',
          500: '#827C96',
          600: '#615C73',
          700: '#45415A',
          800: '#2A2733',
          850: '#211F28',
          900: '#18171E',
          950: '#0F0E13'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(90, 70, 150, 0.06)',
        'lifted': '0 10px 30px rgba(90, 70, 150, 0.14)',
        'glow': '0 10px 26px rgba(106, 71, 238, 0.38)',
        'amber-glow': '0 0 25px rgba(245, 183, 0, 0.28)',
      }
    },
  },
  plugins: [],
}
