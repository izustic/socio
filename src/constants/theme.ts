export const Colors = {
  // Core
  primary: '#FFB60C',
  primaryDark: '#D98F00',
  primaryLight: '#FFF4DD',
  orange: '#FFB60C',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  inputBg: '#F5F5F5',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textDisabled: '#AAAAAA',

  // Structure
  divider: '#EFEFEF',
  placeholder: '#D4D4D4',
  border: '#E5E5E5',

  // State
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  white: '#FFFFFF',
};

export const Typography = {
  // Display — for hero moments (Welcome screen, Circle complete)
  display: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 46,
  },
  // Headings — screen titles
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  // Body
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Labels
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    // textTransform: 'uppercase' as const,
  },
  // Button text
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 24,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 100,
  full: 999,
};

export const Shadow = {
  // NO shadows — flat design only
  none: {},
};
