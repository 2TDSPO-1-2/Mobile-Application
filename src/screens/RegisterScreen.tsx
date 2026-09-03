import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
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

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('../assets/branding/definitive.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <AppCard>
        <Text style={[styles.title, { color: colors.text }]}>Cadastro</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          O cadastro de veterinários ainda não está disponível diretamente pelo aplicativo. O
          acesso ao ArkIve é criado pela administração da clínica. Se você já possui usuário e
          senha, volte para a tela de login.
        </Text>

        <AppButton title="Voltar para o login" onPress={() => navigation.goBack()} />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: '70%', height: 72 },
  title: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
