import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AuthStackParamList } from '../interfaces/navigation';
import { isEmpty, isValidEmail } from '../utils/validation';
import { spacing, fontSize } from '../styles/theme';

export function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { register } = useAuth();
  const colors = useThemeColors();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [isVet, setIsVet] = useState(false);
  const [crmv, setCrmv] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (
      isEmpty(name) ||
      isEmpty(email) ||
      isEmpty(phone) ||
      isEmpty(password) ||
      (!isVet && isEmpty(cpf))
    ) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('E-mail inválido.');
      return;
    }

    if (isVet && isEmpty(crmv)) {
      setError('Informe o CRMV.');
      return;
    }

    setLoading(true);
    const err = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password.trim(),
      cpf: isVet ? '00000000000' : cpf.trim(),
      isVeterinarian: isVet,
      crmv: isVet ? crmv.trim() : undefined,
      autoLogin: true,
    });
    setLoading(false);

    if (err) setError(err);
  };

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('../assets/arkive_logo.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={[styles.title, { color: colors.primary }]}>Cadastro</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Gestão veterinária otimizada
        </Text>
      </View>

      <AppInput
        label="Nome"
        placeholder="Digite seu nome completo"
        value={name}
        onChangeText={setName}
      />

      <AppInput
        label="E-mail"
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AppInput
        label="Telefone"
        placeholder="Digite seu telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {!isVet ? (
        <AppInput
          label="CPF"
          placeholder="Digite seu CPF"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
        />
      ) : null}

      <AppInput
        label="Senha"
        placeholder="Crie uma senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.switchRow}>
        <Text style={{ color: colors.text }}>Sou veterinário</Text>
        <Switch
          value={isVet}
          onValueChange={setIsVet}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {isVet ? (
        <AppInput
          label="CRMV"
          placeholder="Digite seu CRMV"
          value={crmv}
          onChangeText={setCrmv}
          autoCapitalize="characters"
        />
      ) : null}

      {error ? (
        <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text>
      ) : null}

      <AppButton title="Cadastrar" onPress={handleRegister} loading={loading} />

      <AppButton
        title="Já tenho conta"
        variant="outline"
        onPress={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
