import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { spacing, fontSize } from '../styles/theme';

/**
 * Shown when a stored credential exists but the backend couldn't be reached
 * to confirm it (Render cold start, dropped connection, 5xx) — distinct from
 * "unauthenticated", so the veterinarian isn't asked to log in again just
 * because the server was briefly asleep.
 */
export function BackendUnavailableScreen() {
  const { refreshUser } = useAuth();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await refreshUser();
    setRetrying(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]}>{t('backendUnavailable.title')}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('backendUnavailable.message')}
          </Text>
          <AppButton title={t('common.tryAgain')} onPress={handleRetry} loading={retrying} />
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
