// Blossomer GTM Dashboard Design Tokens (v1.1.0)
// This config is generated from design-system.json. Update this file as the design system evolves.
// Custom colors are now under theme.extend.colors for Tailwind compatibility.

const defaultColors = require('tailwindcss/colors');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-primary-base',
    'bg-primary-hover',
    'bg-primary-active',
    'bg-primary-light',
    'bg-primary-dark',
    'bg-secondary-purple',
    'bg-secondary-purple-hover',
    'bg-secondary-purple-light',
    'bg-neutral-black',
    'bg-neutral-gray900',
    'bg-neutral-gray800',
    'bg-neutral-gray700',
    'bg-neutral-gray600',
    'bg-neutral-gray500',
    'bg-neutral-gray400',
    'bg-neutral-gray300',
    'bg-neutral-gray200',
    'bg-neutral-gray100',
    'bg-neutral-gray50',
    'bg-neutral-white',
    'bg-semantic-success',
    'bg-semantic-warning',
    'bg-semantic-error',
    'bg-semantic-info',
    'bg-special-amber50',
    'bg-special-amber200',
    'bg-special-amber600',
    'bg-special-amber800',
  ],
  theme: {
    extend: {
      colors: {
        'primary-base': '#387FF5',
        'primary-hover': '#2968DD',
        'primary-active': '#1E57C6',
        'primary-light': '#EBF5FF',
        'primary-dark': '#1A4AA8',
        'secondary-purple': '#6B4EF6',
        'secondary-purple-hover': '#5A3FE5',
        'secondary-purple-light': '#F3F0FF',
        'neutral-black': '#1A1A1A',
        'neutral-gray900': '#111827',
        'neutral-gray800': '#1F2937',
        'neutral-gray700': '#374151',
        'neutral-gray600': '#4B5563',
        'neutral-gray500': '#6B7280',
        'neutral-gray400': '#9CA3AF',
        'neutral-gray300': '#D1D5DB',
        'neutral-gray200': '#E5E7EB',
        'neutral-gray100': '#F3F4F6',
        'neutral-gray50': '#FAFAFA',
        'neutral-white': '#FFFFFF',
        'semantic-success': '#10B981',
        'semantic-warning': '#F59E0B',
        'semantic-error': '#EF4444',
        'semantic-info': '#3B82F6',
        'special-amber50': '#FEF3C7',
        'special-amber200': '#FCD34D',
        'special-amber600': '#D97706',
        'special-amber800': '#92400E',
      },
      // Spacing scale from design system
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '48px',
      },
      // Border radius tokens
      borderRadius: {
        none: '0',
        sm: '4px',
        base: '6px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      // Typography tokens
      fontFamily: {
        primary: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.2',
        base: '1.5',
        relaxed: '1.6',
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.05em',
      },
      // Custom animation for skeleton pulse
      animation: {
        pulse: 'pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}; 