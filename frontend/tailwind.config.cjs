// Blossomer GTM Dashboard Design Tokens (v1.1.0)
// This config is generated from design-system.json. Update this file as the design system evolves.

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Color palette from design system
    colors: {
      primary: {
        base: '#387FF5',
        hover: '#2968DD',
        active: '#1E57C6',
        light: '#EBF5FF',
        dark: '#1A4AA8',
      },
      secondary: {
        purple: '#6B4EF6',
        purpleHover: '#5A3FE5',
        purpleLight: '#F3F0FF',
      },
      neutral: {
        black: '#1A1A1A',
        gray900: '#111827',
        gray800: '#1F2937',
        gray700: '#374151',
        gray600: '#4B5563',
        gray500: '#6B7280',
        gray400: '#9CA3AF',
        gray300: '#D1D5DB',
        gray200: '#E5E7EB',
        gray100: '#F3F4F6',
        gray50: '#FAFAFA',
        white: '#FFFFFF',
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      special: {
        amber50: '#FEF3C7',
        amber200: '#FCD34D',
        amber600: '#D97706',
        amber800: '#92400E',
      },
      // Default Tailwind colors (optional, for utility compatibility)
      transparent: 'transparent',
      current: 'currentColor',
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
    extend: {
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