import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { commonStyles } from '../styles/common';
import type { ColorPalette } from '../styles/colors';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Forces a specific palette instead of the app's current theme — see AppButton's note on the same prop. */
  colors?: ColorPalette;
}

export function ScreenContainer({
  children,
  scroll = true,
  style,
  edges = ['bottom'],
  colors: colorsOverride,
}: Props) {
  const themeColors = useThemeColors();
  const colors = colorsOverride ?? themeColors;

  const content = scroll ? (
    <ScrollView
      style={commonStyles.screen}
      contentContainerStyle={[commonStyles.content, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // iOS-only prop (silently ignored elsewhere) — lets the ScrollView
      // itself keep the focused input above the keyboard without a manual
      // height/offset calculation.
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[commonStyles.screen, commonStyles.content, style]}>
      {children}
    </View>
  );

  // Android's default windowSoftInputMode already resizes the activity when
  // the keyboard opens, so wrapping it here too risks double-shrinking the
  // content; only iOS (which does nothing by default) needs this. Every
  // screen already reported keyboard-covering a field was on physical
  // iPhone, never Android.
  const body =
    scroll && Platform.OS === 'ios' ? (
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {content}
      </KeyboardAvoidingView>
    ) : (
      content
    );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={edges}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});
