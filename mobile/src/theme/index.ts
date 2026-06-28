import { Dimensions, Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * FamilyVault Design System — "Trusted Emerald"
 * Bank-grade, calm, trustworthy. Single source of truth for all screens.
 */

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
export const colors = {
  // Brand
  primary: '#0F6B4F',
  primaryDark: '#0B5440',
  primaryLight: '#E3F1EA', // tinted fills / chips
  primaryBorder: '#BFE0CF',

  // Canvas & surfaces
  background: '#F4F7F5', // app canvas (behind cards)
  surface: '#FFFFFF', // cards / sheets
  surfaceAlt: '#EEF2F0', // subtle fills, inactive chips
  overlay: 'rgba(17, 24, 21, 0.45)',

  // Text
  text: '#111827', // near-black slate
  textSecondary: '#5B6B66',
  textTertiary: '#9AA5A1',
  textInverse: '#FFFFFF',

  // Lines
  border: '#E2E8E5',
  borderStrong: '#CBD5D0',

  // Status
  error: '#DC2626',
  errorLight: '#FDECEC',
  success: '#16A34A',
  successLight: '#E6F6EC',
  warning: '#D97706',
  warningLight: '#FDF1E1',
  info: '#2563EB',
  infoLight: '#E7EEFE',

  // Absolutes
  white: '#FFFFFF',
  black: '#000000',
};

// ---------------------------------------------------------------------------
// Spacing — 4pt grid
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// ---------------------------------------------------------------------------
// Responsive font scaling — baseline 375pt (iPhone X width), gentle clamp
// ---------------------------------------------------------------------------
const BASE_WIDTH = 375;
const screenWidth = Dimensions.get('window').width;

export function scaleFont(size: number): number {
  const factor = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.92), 1.12);
  return Math.round(size * factor);
}

// Raw numeric sizes (kept for backward compatibility with existing screens)
export const fontSize = {
  xs: scaleFont(11),
  sm: scaleFont(13),
  md: scaleFont(15),
  lg: scaleFont(18),
  xl: scaleFont(22),
  xxl: scaleFont(28),
};

// ---------------------------------------------------------------------------
// Typography presets — use via <Text variant="..."> or spread into styles
// ---------------------------------------------------------------------------
const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export const typography = {
  display: {
    fontFamily,
    fontSize: scaleFont(30),
    lineHeight: scaleFont(38),
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,
  h1: {
    fontFamily,
    fontSize: scaleFont(24),
    lineHeight: scaleFont(30),
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  } as TextStyle,
  h2: {
    fontFamily,
    fontSize: scaleFont(20),
    lineHeight: scaleFont(26),
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  } as TextStyle,
  title: {
    fontFamily,
    fontSize: scaleFont(17),
    lineHeight: scaleFont(23),
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    fontWeight: '400',
    color: colors.text,
  } as TextStyle,
  bodyMedium: {
    fontFamily,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: scaleFont(13),
    lineHeight: scaleFont(18),
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  label: {
    fontFamily,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(16),
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  } as TextStyle,
  button: {
    fontFamily,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(20),
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
};

export type TypographyVariant = keyof typeof typography;

// ---------------------------------------------------------------------------
// Shadows / elevation
// ---------------------------------------------------------------------------
export const shadows: Record<'none' | 'sm' | 'md' | 'lg', ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
export const layout = {
  screenPadding: spacing.lg,
  headerHeight: 56,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  maxContentWidth: 520, // tablets: keep content readable
};

export const theme = { colors, spacing, radius, fontSize, typography, shadows, layout, scaleFont };
export default theme;
