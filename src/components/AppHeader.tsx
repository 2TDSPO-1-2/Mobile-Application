import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize } from '../styles/theme';
import type { AppStackParamList } from '../interfaces/navigation';

interface Props {
  title: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

/**
 * White surface with a thin bottom border — the ArkIve default. Title is
 * dark on white; back/action affordances are primary blue on white, never
 * the reverse (no solid brand-colored bar behind white text).
 */
export function AppHeader({ title, showBack = true, rightAction }: Props) {
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
      {showBack ? (
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={[styles.iconText, { color: colors.primary }]}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} style={styles.iconBtn}>
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {rightAction.label}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  iconBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 24, fontWeight: '600' },
  actionText: { fontSize: fontSize.sm, fontWeight: '700' },
});
