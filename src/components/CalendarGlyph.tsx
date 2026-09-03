import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Dependency-free icon glyphs for DateField/TimeField, built the same way as
 * HomeHeader's NotificationIcon/UserIcon — plain colored Views instead of an
 * icon font/SVG library, so they tint correctly via the `color` prop (an
 * emoji glyph like 📅 ignores text color on most platforms).
 */
export function CalendarGlyph({ color }: { color: string }) {
  return (
    <View style={styles.calendarWrap}>
      <View style={[styles.calendarBody, { borderColor: color }]}>
        <View style={[styles.calendarBar, { backgroundColor: color }]} />
      </View>
      <View style={[styles.calendarLeg, { backgroundColor: color }]} />
      <View style={[styles.calendarLeg, styles.calendarLegRight, { backgroundColor: color }]} />
    </View>
  );
}

export function ClockGlyph({ color }: { color: string }) {
  return (
    <View style={[styles.clockWrap, { borderColor: color }]}>
      <View style={[styles.clockHandMinute, { backgroundColor: color }]} />
      <View style={[styles.clockHandHour, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  calendarWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'flex-end' },
  calendarBody: {
    width: 16,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  calendarBar: { height: 4, width: '100%' },
  calendarLeg: {
    position: 'absolute',
    top: 0,
    left: 3,
    width: 2,
    height: 4,
    borderRadius: 1,
  },
  calendarLegRight: { left: undefined, right: 3 },
  clockWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHandHour: { position: 'absolute', width: 1.5, height: 4, borderRadius: 1, top: 3 },
  clockHandMinute: { position: 'absolute', width: 4, height: 1.5, borderRadius: 1, left: 7, top: 7 },
});
