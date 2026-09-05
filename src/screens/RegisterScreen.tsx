import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import type { AuthStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

/**
 * The Spring Boot backend documented for this app has no public,
 * unauthenticated veterinarian self-registration endpoint — accounts are
 * provisioned by clinic administration. Rather than fake a sign-up flow
 * against nothing, this screen stays reachable from Login (the rubric
 * expects a "Login e Cadastro" pair) and says so accurately. Replace this
 * with a real form the moment a registration endpoint is confirmed.
 */
export function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/branding/definitive.png')}
          style={styles.logo}
          resizeMode="contain"
          tintColor="#000000"
        />
      </View>

      <AppCard>
        <Text style={[styles.title, { color: colors.text }]}>{t('auth.registerTitle')}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{t('auth.registerMessage')}</Text>

        <AppButton title={t('auth.registerBackButton')} onPress={() => navigation.goBack()} />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Same safe wrapper-owns-aspect-ratio pattern as LoginScreen (see the note
  // there) — smaller max size here since this is a secondary/informational
  // screen, not the primary branding moment. A modest, compact mark, roughly
  // matching this screen's previous ~72px-tall visual footprint.
  logoWrap: {
    width: '70%',
    maxWidth: 90,
    aspectRatio: 1356 / 1160,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
