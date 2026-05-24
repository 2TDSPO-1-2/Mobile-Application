import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabParamList } from '../interfaces/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { AnimalsScreen } from '../screens/AnimalsScreen';
import { useThemeColors } from '../hooks/useThemeColors';
import { fontSize } from '../styles/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

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
        name="Agenda"
        component={AgendaScreen}
        options={{ tabBarLabel: 'Agenda' }}
      />
      <Tab.Screen
        name="Animais"
        component={AnimalsScreen}
        options={{ tabBarLabel: 'Animais' }}
      />
    </Tab.Navigator>
  );
}
