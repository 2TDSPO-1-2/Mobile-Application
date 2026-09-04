import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, radius } from '../styles/theme';
import type { AppStackParamList } from '../interfaces/navigation';

function NotificationIcon({ color }: { color: string }) {
  return (
    <View style={styles.notificationIcon}>
      <View style={[styles.notificationDome, { backgroundColor: color }]} />
      <View style={[styles.notificationBody, { backgroundColor: color }]} />
      <View style={[styles.notificationClapper, { backgroundColor: color }]} />
    </View>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <View style={styles.userIcon}>
      <View style={[styles.userHead, { backgroundColor: color }]} />
      <View style={[styles.userBody, { backgroundColor: color }]} />
    </View>
  );
}

/** White surface with a thin bottom border, matching AppHeader — one coherent header system app-wide. */
export function HomeHeader() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Image
        source={require('../assets/branding/favicon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.brand, { color: colors.text }]}>ArkIve</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('Notificacoes')}
          style={[styles.iconBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Notificações"
        >
          <NotificationIcon color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Perfil')}
          style={[styles.iconBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Perfil"
        >
          <UserIcon color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    // favicon.png is a near-white mark — without this it's essentially
    // invisible against the white header surface. Force pure black, same
    // as the Login screen's logo (the asset has a real alpha channel).
    tintColor: '#000000',
  },
  brand: { flex: 1, fontSize: fontSize.xl, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: { width: 18, height: 18, alignItems: 'center' },
  notificationDome: {
    width: 10,
    height: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  notificationBody: {
    width: 16,
    height: 9,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  notificationClapper: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: -1,
  },
  userIcon: { alignItems: 'center', justifyContent: 'center' },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: 2,
  },
  userBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
});
