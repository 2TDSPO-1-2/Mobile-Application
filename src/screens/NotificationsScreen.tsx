import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  getNotificationsByUser,
  markNotificationRead,
  markAllRead,
} from '../services/notificationService';
import type { AppNotification } from '../types';
import type { AppStackParamList } from '../interfaces/navigation';
import { formatDateTime } from '../utils/date';
import { spacing, fontSize } from '../styles/theme';

export function NotificationsScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // `/notifications` has no Spring equivalent (confirmed against the backend
  // controller list — same class of gap as the old /appointments,/animals,
  // /users routes) and always fails against the real API. This was
  // previously fire-and-forget inside useFocusEffect, producing an unhandled
  // promise rejection ("ApiError: Erro interno do servidor") every time this
  // screen gained focus.
  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      setItems(await getNotificationsByUser(user.id, user.responsavelId, undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as notificações.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRead = async (id: string) => {
    setError('');
    try {
      await markNotificationRead(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível marcar como lida.');
    }
  };

  const handleReadAll = async () => {
    if (!user) return;
    setError('');
    try {
      await markAllRead(user.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível marcar todas como lidas.');
    }
  };

  const handleVerify = (notification: AppNotification) => {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();

    if (title.includes('feedback') || message.includes('feedback')) {
      navigation.navigate('Feedback', {});
      return;
    }

    navigation.navigate('MainTabs');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Notificações" />

      <ScreenContainer>
        {error ? (
          <Text style={{ color: colors.error, marginBottom: spacing.sm }}>{error}</Text>
        ) : null}

        {items.length > 0 ? (
          <AppButton
            title="Marcar todas como lidas"
            variant="outline"
            onPress={handleReadAll}
          />
        ) : null}

        {items.length === 0 ? (
          <EmptyState title="Sem notificações" />
        ) : (
          items.map((notification) => {
            const isExpanded = expanded[notification.id];

            return (
              <Pressable
                key={notification.id}
                onPress={() =>
                  setExpanded((current) => ({
                    ...current,
                    [notification.id]: !current[notification.id],
                  }))
                }
              >
                <AppCard
                  style={
                    !notification.read
                      ? { borderColor: colors.primary, borderWidth: 2 }
                      : undefined
                  }
                >
                  <Text style={[styles.title, { color: colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {notification.message}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                    {formatDateTime(notification.createdAt)}
                  </Text>

                  {isExpanded ? (
                    <View style={styles.actions}>
                      <AppButton
                        title="Marcar como lida"
                        variant="outline"
                        onPress={() => handleRead(notification.id)}
                      />
                      <AppButton
                        title="Verificar"
                        variant="secondary"
                        onPress={() => handleVerify(notification)}
                      />
                    </View>
                  ) : null}
                </AppCard>
              </Pressable>
            );
          })
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  actions: { marginTop: spacing.sm },
});
