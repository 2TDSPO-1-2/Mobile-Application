import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AuthStackParamList } from '../interfaces/navigation';
import type { UserRole } from '../types';
import { spacing, fontSize, radius } from '../styles/theme';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
  const colors = useThemeColors();

  const [role, setRole] = useState<UserRole>('tutor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    const id = identifier.trim();
    const pwd = password.trim();

    if (!id || !pwd) {
      setError('Preencha CPF/CRMV e senha.');
      return;
    }

    setLoading(true);
    const err = await login(id, pwd, role, autoLogin);
    setLoading(false);

    if (err) setError(err);
  };

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Image
            source={require('../assets/arkive_logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gestão veterinária otimizada
          </Text>
        </View>

        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole('tutor')}
            style={[
              styles.roleBtn,
              {
                backgroundColor: role === 'tutor' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: role === 'tutor' ? '#FFF' : colors.text }}>Tutor</Text>
          </Pressable>

          <Pressable
            onPress={() => setRole('veterinario')}
            style={[
              styles.roleBtn,
              {
                backgroundColor:
                  role === 'veterinario' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: role === 'veterinario' ? '#FFF' : colors.text }}>
              Veterinário
            </Text>
          </Pressable>
        </View>

        <AppInput
          label={role === 'tutor' ? 'CPF' : 'CRMV'}
          placeholder={role === 'tutor' ? 'Digite seu CPF' : 'Digite seu CRMV'}
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType={role === 'tutor' ? 'numeric' : 'default'}
          autoCapitalize={role === 'veterinario' ? 'characters' : 'none'}
        />

        <AppInput
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>Início automático</Text>
          <Switch
            value={autoLogin}
            onValueChange={setAutoLogin}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <AppButton title="Entrar" onPress={handleLogin} loading={loading} />

        <AppButton
          title="Criar conta"
          variant="secondary"
          onPress={() => navigation.navigate('Cadastro')}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  logo: {
    width: 126,
    height: 126,
    borderRadius: 63,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  error: { textAlign: 'center', marginBottom: spacing.sm },
});
