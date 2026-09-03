export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  /** Pill radius (≥ half the control's height). */
  full: 999,
} as const;

/**
 * Mapped to the exact web type scale: 11 / 13 / 15 / 17 / 20, plus one larger
 * size for page-level titles the web spec doesn't need (a mobile page title
 * carries hierarchy a desktop page header gets from surrounding chrome).
 * Every screen/component references these by name, so this single mapping
 * is what makes the whole app's type scale match the web app's.
 */
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
} as const;
