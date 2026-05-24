import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, radius } from '../styles/theme';
import type { AppStackParamList } from '../interfaces/navigation';

function NotificationIcon() {
  return (
    <View style={styles.notificationIcon}>
      <View style={styles.notificationDome} />
      <View style={styles.notificationBody} />
      <View style={styles.notificationClapper} />
    </View>
  );
}

function UserIcon() {
  return (
    <View style={styles.userIcon}>
      <View style={styles.userHead} />
      <View style={styles.userBody} />
    </View>
  );
}

export function HomeHeader() {
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={[styles.header, { backgroundColor: colors.header }]}>
      <Image
        source={require('../assets/arkive_icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.brand, { color: colors.headerText }]}>ArkIve</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('Notificacoes')}
          style={[styles.iconBtn, { borderColor: colors.headerText }]}
        >
          <NotificationIcon />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Perfil')}
          style={[styles.iconBtn, { borderColor: colors.headerText }]}
        >
          <UserIcon />
        </Pressable>
      </View>
    </View>
  );
}

const iconColor = '#EAF5EE';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: spacing.sm,
  },
  brand: { flex: 1, fontSize: fontSize.xl, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    backgroundColor: iconColor,
  },
  notificationBody: {
    width: 16,
    height: 9,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: iconColor,
  },
  notificationClapper: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: iconColor,
    marginTop: -1,
  },
  userIcon: { alignItems: 'center', justifyContent: 'center' },
  userHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: iconColor,
    marginBottom: 2,
  },
  userBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: iconColor,
  },
});
