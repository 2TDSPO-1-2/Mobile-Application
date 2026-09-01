import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import { updateUser } from '../services/userService';
import { spacing, fontSize } from '../styles/theme';

export function ProfileScreen() {
  const { user, role, logout, refreshUser } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState('');

  if (!user) return null;

  const subtitle = role === 'tutor' ? 'Tutor ArkIve' : 'Veterinário ArkIve';
  const documentLabel = role === 'tutor' ? `CPF: ${user.cpf}` : `CRMV: ${user.crmv}`;

  const handleSave = async () => {
    await updateUser({
      ...user,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    await refreshUser();
    setEditing(false);
    setMessage('Dados atualizados localmente.');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Perfil" />

      <ScreenContainer>
        <AppCard style={styles.profileCard}>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>{subtitle}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
            {user.email}
          </Text>
          <Text style={{ color: colors.textSecondary }}>{user.phone}</Text>
          <Text style={{ color: colors.textSecondary }}>{documentLabel}</Text>
        </AppCard>

        {editing ? (
          <AppCard>
            <AppInput
              label="Nome"
              placeholder="Digite seu nome"
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

            <AppButton title="Salvar dados" onPress={handleSave} />
            <AppButton title="Cancelar" variant="outline" onPress={() => setEditing(false)} />
          </AppCard>
        ) : (
          <AppButton
            title="Atualizar dados cadastrais"
            variant="outline"
            onPress={() => setEditing(true)}
          />
        )}

        {message ? (
          <Text style={{ color: colors.primary, textAlign: 'center' }}>{message}</Text>
        ) : null}

        <AppButton
          title="Configurações"
          variant="outline"
          onPress={() => navigation.navigate('Configuracoes')}
        />

        <AppButton
          title="Notificações"
          variant="secondary"
          onPress={() => navigation.navigate('Notificacoes')}
        />

        <AppButton title="Sair" variant="danger" onPress={logout} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileCard: {
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
