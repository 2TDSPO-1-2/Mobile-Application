export const STORAGE_KEYS = {
  users: '@arkive/users',
  session: '@arkive/session',
  theme: '@arkive/theme',
  animals: '@arkive/animals',
  appointments: '@arkive/appointments',
  evaluations: '@arkive/evaluations',
  feedbacks: '@arkive/feedbacks',
  notifications: '@arkive/notifications',
  initialized: '@arkive/initialized',
  devSeedEnabled: '@arkive/dev-seed-enabled',
  currentUser: '@arkive/current-user',
  /** Non-sensitive UX preference (pt-BR/en-US for voice dictation) — AsyncStorage is appropriate; this never touches SecureStore. */
  voiceLocale: '@arkive/voice-locale',
} as const;
