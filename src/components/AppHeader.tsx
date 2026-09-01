import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, radius } from '../styles/theme';
import type { AppStackParamList } from '../interfaces/navigation';

interface Props {
  title: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function AppHeader({ title, showBack = true, rightAction }: Props) {
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={[styles.header, { backgroundColor: colors.header }]}>
      {showBack ? (
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: colors.headerText }]}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={[styles.title, { color: colors.headerText }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} style={styles.iconBtn}>
          <Text style={[styles.actionText, { color: colors.headerText }]}>
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
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 24, fontWeight: '600' },
  actionText: { fontSize: fontSize.sm, fontWeight: '600' },
});
