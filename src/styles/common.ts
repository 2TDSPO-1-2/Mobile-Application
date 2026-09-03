import { StyleSheet } from 'react-native';
import { spacing, radius, fontSize } from './theme';
import { shadows } from './shadows';

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  /** Small uppercase section label, e.g. above a card group on Consultation Detail. */
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
