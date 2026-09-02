import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabParamList } from '../interfaces/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ConsultasScreen } from '../screens/ConsultasScreen';
import { PatientsScreen } from '../screens/PatientsScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import { fontSize } from '../styles/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="Consultas"
        component={ConsultasScreen}
        options={{ tabBarLabel: 'Consultas' }}
      />
      <Tab.Screen
        name="Pacientes"
        component={PatientsScreen}
        options={{ tabBarLabel: 'Pacientes' }}
      />
    </Tab.Navigator>
  );
}
