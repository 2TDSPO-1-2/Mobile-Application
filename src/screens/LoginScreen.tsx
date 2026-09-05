import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { lightColors } from '../styles/colors';
import type { AuthStackParamList } from '../interfaces/navigation';
import { spacing, fontSize, radius } from '../styles/theme';
import { shadows } from '../styles/shadows';

/**
 * Login is a pre-authentication branding moment — it must look identical
 * regardless of the user's in-app dark-mode preference (a persisted toggle
 * in Settings, not the OS setting), so this screen deliberately uses the
 * fixed `lightColors` palette instead of `useThemeColors()`. Labels, input
 * text, and the logo are additionally forced to literal pure black rather
 * than the palette's `#1F2937`, and the status bar is pinned to dark icons,
 * since dark mode was otherwise turning all three light-colored here.
 */
export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
  const colors = lightColors;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    const id = identifier.trim();

    if (!id || !password) {
      setError('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    const err = await login(id, password);
    setLoading(false);

    if (err) setError(err);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.md,
            ]}
          >
            <Image
              source={require('../assets/branding/definitive.png')}
              style={styles.logo}
              resizeMode="contain"
              // Forces the logo artwork to pure black regardless of source-asset
              // shading or theme — the PNG has a real alpha channel, so tintColor
              // only recolors the glyph itself, never the transparent background.
              tintColor="#000000"
            />

            <AppInput
              label="Login"
              labelColor="#000000"
              style={styles.inputText}
              placeholder="CRMV ou login do veterinário"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AppInput
              label="Senha"
              labelColor="#000000"
              style={styles.inputText}
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            ) : null}

            <AppButton title="Entrar" onPress={handleLogin} loading={loading} />
          </View>

          <AppButton
            title="Criar conta"
            variant="ghost"
            onPress={() => navigation.navigate('Cadastro')}
            style={styles.registerLink}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  logo: {
    // ~75% of the width of the inputs below it (same card, same padding —
    // the inputs stretch to 100% of that content width) rather than the
    // previous edge-to-edge stretch, with room to breathe on either side.
    width: '75%',
    maxWidth: 260,
    // Real asset ratio (1356x1160) — height derives from width so the mark
    // never crops or distorts regardless of screen size.
    aspectRatio: 1356 / 1160,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  inputText: { color: '#000000' },
  error: { fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.sm },
  registerLink: { marginTop: spacing.sm },
});
