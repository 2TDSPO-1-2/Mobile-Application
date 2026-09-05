import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { spacing, fontSize } from '../styles/theme';

/**
 * Shown whenever `AuthContext.status === 'password-change-required'` —
 * mounted as the ONLY screen in its own root-level stack branch (see
 * `RootNavigator.tsx`), never nested under the normal clinical tab
 * navigator, so there is no way to swipe/navigate past it into the app
 * while a mandatory password change is still pending. There is
 * deliberately no back button (`AppHeader showBack={false}`) — the only
 * ways off this screen are completing the change or explicitly signing out.
 */
export function MandatoryPasswordChangeScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { changePassword, logout } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return; // guards against a double-tap firing two change-password requests
    setError('');

    if (!newPassword || !confirmPassword) {
      setError(t('changePassword.validationRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.validationMismatch'));
      return;
    }

    setSubmitting(true);
    const result = await changePassword(newPassword);
    setSubmitting(false);

    if (result) {
      setError(result);
    }
    // On success, AuthContext's own status flips to 'authenticated' —
    // RootNavigator reacts to that and mounts the normal app; nothing to do
    // here besides letting the pending state clear.
  };

  const handleCancel = () => {
    Alert.alert(
      t('changePassword.cancelConfirmTitle'),
      t('changePassword.cancelConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('changePassword.cancelButton'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={t('changePassword.title')} showBack={false} />
      <ScreenContainer>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('changePassword.subtitle')}
        </Text>

        <AppInput
          label={t('changePassword.newPasswordLabel')}
          placeholder={t('changePassword.newPasswordPlaceholder')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!submitting}
        />

        <AppInput
          label={t('changePassword.confirmPasswordLabel')}
          placeholder={t('changePassword.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!submitting}
        />

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <AppButton
          title={submitting ? t('changePassword.submitting') : t('changePassword.submitButton')}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />

        <AppButton
          title={t('changePassword.cancelButton')}
          variant="ghost"
          onPress={handleCancel}
          disabled={submitting}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.lg },
  error: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  submitButton: { marginTop: spacing.sm },
});
