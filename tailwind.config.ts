import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-contrast': 'var(--primary-contrast)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        background: 'var(--background-color)',
        surface: 'var(--surface-color)',
        text: 'var(--text-color)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border-color)',
        input: {
          bg: 'var(--input-background-color)',
          text: 'var(--input-text-color)',
        },
        error: 'var(--error-color)',
        warning: 'var(--warning-color)',
        success: 'var(--success-color)',
        admin: {
          DEFAULT: 'var(--admin-color)',
          bg: 'var(--admin-background-color)',
        },
        therapist: {
          DEFAULT: 'var(--therapist-color)',
          bg: 'var(--therapist-background-color)',
        },
        sidebar: {
          bg: 'var(--sidebar-background)',
          text: 'var(--sidebar-text-color)',
          'active-bg': 'var(--sidebar-active-background)',
          'active-text': 'var(--sidebar-active-text)',
          'hover-bg': 'var(--sidebar-hover-background)',
          'hover-text': 'var(--sidebar-hover-text)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['var(--font-family)', '"Jost"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', '"Source Code Pro"', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
export default config
