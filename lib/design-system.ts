/**
 * Bibia Design System
 * A comprehensive design system for the Bibia physiotherapy platform
 */

// ===== COLORS =====
export const colors = {
  seafoam: {
    900: '#153b36',
    700: '#1c4a44', 
    600: '#225f56',
    500: '#2e8b75',
    400: '#3da188',
    300: '#7fd1bf',
    200: '#bfe9df',
    100: '#e9f6f3',
  },
  white: '#ffffff',
  ink: '#0e1a18',
} as const

// ===== BORDER RADIUS =====
export const radii = {
  xs: '8px',
  sm: '12px', 
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const

// ===== SHADOWS =====
export const shadows = {
  soft: '0 10px 30px rgba(0,0,0,.08)',
  glow: '0 0 24px rgba(61,161,136,.35)',
} as const

// ===== TYPOGRAPHY =====
export const typography = {
  fontFamily: {
    sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    h1: {
      size: '48px',
      lineHeight: '56px',
      fontWeight: '700',
    },
    h2: {
      size: '32px', 
      lineHeight: '40px',
      fontWeight: '700',
    },
    body: {
      size: '16px',
      lineHeight: '26px', 
      fontWeight: '500',
    },
    small: {
      size: '14px',
      lineHeight: '22px',
      fontWeight: '400',
    },
  },
} as const

// ===== MOTION =====
export const motion = {
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: 'cubic-bezier(0.22,1,0.36,1)',
  animations: {
    fadeUp: {
      initial: { opacity: 0, transform: 'translateY(8px)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      transition: { duration: 0.3, ease: 'cubic-bezier(0.22,1,0.36,1)' },
    },
  },
} as const

// ===== COMPONENT STYLES =====
export const components = {
  button: {
    primary: {
      background: `linear-gradient(135deg, ${colors.seafoam[600]} 0%, ${colors.seafoam[500]} 100%)`,
      color: colors.white,
      borderRadius: radii.md,
      padding: '12px 24px',
      fontWeight: '600',
      transition: `all ${motion.duration.normal} ${motion.easing}`,
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: shadows.soft,
      },
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${colors.seafoam[400]}`,
      },
    },
    secondary: {
      background: 'transparent',
      color: colors.seafoam[600],
      border: `2px solid ${colors.seafoam[600]}`,
      borderRadius: radii.md,
      padding: '10px 24px',
      fontWeight: '600',
      transition: `all ${motion.duration.normal} ${motion.easing}`,
      '&:hover': {
        background: colors.seafoam[600],
        color: colors.white,
        transform: 'translateY(-2px)',
      },
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${colors.seafoam[400]}`,
      },
    },
    ghost: {
      background: 'transparent',
      color: colors.seafoam[600],
      borderRadius: radii.md,
      padding: '12px 24px',
      fontWeight: '500',
      transition: `all ${motion.duration.normal} ${motion.easing}`,
      '&:hover': {
        background: colors.seafoam[100],
        color: colors.seafoam[700],
      },
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${colors.seafoam[400]}`,
      },
    },
  },
  card: {
    glassy: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.35)',
      borderRadius: radii.lg,
      boxShadow: shadows.soft,
      transition: `all ${motion.duration.normal} ${motion.easing}`,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: shadows.glow,
      },
    },
  },
  input: {
    base: {
      background: colors.white,
      border: `1px solid ${colors.seafoam[200]}`,
      borderRadius: radii.sm,
      padding: '12px 16px',
      fontSize: typography.fontSize.body.size,
      lineHeight: typography.fontSize.body.lineHeight,
      transition: `all ${motion.duration.normal} ${motion.easing}`,
      '&:focus': {
        outline: 'none',
        borderColor: colors.seafoam[400],
        boxShadow: `0 0 0 2px ${colors.seafoam[400]}20`,
      },
      '&::placeholder': {
        color: colors.seafoam[300],
      },
    },
  },
} as const

// ===== ACCESSIBILITY =====
export const accessibility = {
  focusRing: `0 0 0 2px ${colors.seafoam[400]}`,
  focusRingOffset: '2px',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const

// ===== UTILITY FUNCTIONS =====
export const utils = {
  // Generate CSS custom properties
  cssVariables: () => ({
    '--seafoam-900': colors.seafoam[900],
    '--seafoam-700': colors.seafoam[700],
    '--seafoam-600': colors.seafoam[600],
    '--seafoam-500': colors.seafoam[500],
    '--seafoam-400': colors.seafoam[400],
    '--seafoam-300': colors.seafoam[300],
    '--seafoam-200': colors.seafoam[200],
    '--seafoam-100': colors.seafoam[100],
    '--white': colors.white,
    '--ink': colors.ink,
  }),
  
  // Get responsive font size
  getResponsiveFontSize: (size: keyof typeof typography.fontSize) => {
    const config = typography.fontSize[size]
    return {
      fontSize: config.size,
      lineHeight: config.lineHeight,
      fontWeight: config.fontWeight,
    }
  },
  
  // Get motion-safe animation
  getMotionSafe: (animation: string) => ({
    [animation]: animation,
    [accessibility.reducedMotion]: {
      [animation]: 'none',
    },
  }),
}

// ===== EXPORT ALL =====
const designSystem = {
  colors,
  radii,
  shadows,
  typography,
  motion,
  components,
  accessibility,
  utils,
}

export default designSystem
