/**
 * ArkIve palette — mirrors the web application's design system exactly.
 * These values are the source of truth; do not substitute "similar" shades.
 * Every screen/component reads colors exclusively through useThemeColors(),
 * so this file is the single place the brand identity lives.
 */
export const lightColors = {
  primary: '#3F51B5',
  primaryDark: '#3347A8',
  primaryLight: '#5A6FD6',
  primaryTint: '#EEF0FB',

  background: '#F4F5F7',
  surface: '#FFFFFF',
  neutralBackground: '#F5F5F5',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#DDE2EA',
  inputBorder: '#D1D5DB',

  error: '#D32F2F',
  errorDark: '#B71C1C',
  errorTint: '#FFEBEE',

  warning: '#EF6C00',
  warningTint: '#FFF3E0',

  success: '#2E7D32',
  successDark: '#1B5E20',
  successTint: '#E8F5E9',

  // Kept for any legacy reference — header chrome is white-by-default now
  // (see AppHeader/HomeHeader), not a solid brand-colored bar.
  tabBar: '#FFFFFF',
  header: '#FFFFFF',
  headerText: '#1F2937',

  cardShadow: 'rgba(15, 23, 42, 0.10)',
};

export const darkColors = {
  primary: '#5A6FD6',
  primaryDark: '#3F51B5',
  primaryLight: '#7C8EE8',
  primaryTint: '#1D2340',

  background: '#12141C',
  surface: '#1B1F2C',
  neutralBackground: '#20242F',
  text: '#E7EAF2',
  textSecondary: '#9AA3B8',
  border: '#2B3040',
  inputBorder: '#39415A',

  error: '#EF5350',
  errorDark: '#FF8A80',
  errorTint: '#3A1F1E',

  warning: '#FFA654',
  warningTint: '#3A2A18',

  success: '#66BB6A',
  successDark: '#8FD693',
  successTint: '#1C3327',

  tabBar: '#1B1F2C',
  header: '#1B1F2C',
  headerText: '#E7EAF2',

  cardShadow: 'rgba(0, 0, 0, 0.4)',
};

export type ColorPalette = typeof lightColors;
