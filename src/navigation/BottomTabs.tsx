import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabParamList } from '../interfaces/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ConsultasScreen } from '../screens/ConsultasScreen';
import { PatientsScreen } from '../screens/PatientsScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import { fontSize } from '../styles/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_SIZE = 24;

/**
 * The old "Agenda"/"Animais" tabs (Node-backend Appointment/Animal screens)
 * have been removed from the primary tab bar — that backend no longer
 * exists, so they were guaranteed-broken entry points on the app's main
 * happy path. Their screens still exist in src/screens/ and still compile;
 * they're just no longer linked from here. "Consultas" and "Pacientes" are
 * the real, Spring-backed replacements.
 *
 * No manual tab-bar height/padding override here on purpose: `@react-navigation/bottom-tabs`
 * v7's own `BottomTabBar` already reads `useSafeAreaInsets()` internally
 * (confirmed in its source) and sizes/pads itself for the home
 * indicator/gesture bar automatically — overriding `height` by hand would
 * risk double-padding or clipping on some of the target devices instead of
 * fixing anything.
 */
export function BottomTabs() {
  const colors = useThemeColors();

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
