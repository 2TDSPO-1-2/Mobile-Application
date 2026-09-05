import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabParamList } from '../interfaces/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ConsultasScreen } from '../screens/ConsultasScreen';
import { PatientsScreen } from '../screens/PatientsScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import { fontSize, spacing } from '../styles/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_SIZE = 24;

// `@react-navigation/bottom-tabs` v7's own default height, when no explicit
// `tabBarStyle.height` is set, is a fixed `TABBAR_HEIGHT_UIKIT = 49` (+ safe
// area inset) — a flat, label-less iOS convention from the library's
// source. That's too tight for an icon-above-label layout, and the gap is
// worst on web: Chrome's device emulation never reports a non-zero bottom
// safe-area inset (that's a real hardware/OS concept, not something
// DevTools simulates), so the 49px got zero cushion at all — confirmed as
// the exact clipping cause. Setting an explicit height here bypasses the
// library's formula entirely instead of fighting it.
const CONTENT_HEIGHT = 56;

/**
 * The old "Agenda"/"Animais" tabs (Node-backend Appointment/Animal screens)
 * have been removed from the primary tab bar — that backend no longer
 * exists, so they were guaranteed-broken entry points on the app's main
 * happy path. Their screens still exist in src/screens/ and still compile;
 * they're just no longer linked from here. "Consultas" and "Pacientes" are
 * the real, Spring-backed replacements.
 */
export function BottomTabs() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: CONTENT_HEIGHT + insets.bottom,
          paddingTop: spacing.xs,
          // The safe-area inset is real device space reserved entirely for
          // the home indicator/gesture bar clearance — it's added on top of
          // (not carved out of) the icon+label content area, so
          // CONTENT_HEIGHT itself stays constant across devices.
          paddingBottom: insets.bottom + spacing.xs,
        },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarAccessibilityLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Consultas"
        component={ConsultasScreen}
        options={{
          tabBarLabel: 'Consultas',
          tabBarAccessibilityLabel: 'Consultas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Pacientes"
        component={PatientsScreen}
        options={{
          tabBarLabel: 'Pacientes',
          tabBarAccessibilityLabel: 'Pacientes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'paw' : 'paw-outline'} size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
