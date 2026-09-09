import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

export interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
}

/**
 * Single-select chip row — the same visual pattern NewConsultaScreen already
 * used inline for `modalidade`, extracted so species/breed/sex/castration
 * pickers elsewhere don't each reinvent it.
 */
export function ChipGroup({ label, options, value, onChange, disabled, emptyMessage, error }: Props) {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  // Tracked manually (rather than read back from the ScrollView) so the
  // wheel handler below can compute the next offset synchronously — mouse
  // wheel events fire faster than onScroll round-trips would keep up with.
  const scrollXRef = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
  };

  // Chips scroll horizontally, which touch/trackpad swipe already handles
  // natively. A plain mouse wheel, however, only ever generates a *vertical*
  // delta — react-native-web's ScrollView doesn't remap that to horizontal
  // motion the way a native app might, so on desktop the row looked
  // scrollable (chips visibly ran off-screen) but a mouse wheel did nothing.
  // Redirecting vertical wheel delta into horizontal scroll here is web-only
  // and additive: it never touches touch/native behavior, and a trackpad's
  // own horizontal delta (deltaX) is left alone since the browser already
  // scrolls this element correctly for that gesture.
  const handleWheel = (event: { deltaX: number; deltaY: number; preventDefault: () => void }) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollXRef.current = Math.max(0, scrollXRef.current + event.deltaY);
    scrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
  };
  const webOnlyProps = Platform.OS === 'web' ? { onWheel: handleWheel } : null;

  return (
    <View style={styles.wrap}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>

      {options.length === 0 && emptyMessage ? (
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{emptyMessage}</Text>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          {...(webOnlyProps as object)}
        >
          <View style={styles.row}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  disabled={disabled}
                  onPress={() => onChange(option.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      opacity: disabled ? 0.56 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#FFF' : colors.text, fontSize: fontSize.sm }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
      {error ? <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
