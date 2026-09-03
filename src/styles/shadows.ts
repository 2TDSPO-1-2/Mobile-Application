/**
 * Cross-platform equivalents of the web's shadow-sm/shadow-md. iOS reads the
 * shadow* props, Android reads elevation — both live on the same object and
 * each platform ignores what it doesn't understand, so no Platform.select
 * branching is needed.
 */
export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
