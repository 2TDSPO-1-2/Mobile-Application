import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { BackendUnavailableScreen } from '../screens/BackendUnavailableScreen';
import { MandatoryPasswordChangeScreen } from '../screens/MandatoryPasswordChangeScreen';
import type { RootStackParamList } from '../interfaces/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status } = useAuth();
  const colors = useThemeColors();

  if (status === 'initializing') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // A stored credential exists but couldn't be confirmed against the
  // backend — never fall through to the login screen here, that would ask
  // for a password that may well still be correct.
  if (status === 'unreachable') {
    return <BackendUnavailableScreen />;
  }

  return (
    <NavigationContainer key={status}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : status === 'password-change-required' ? (
          <Stack.Screen name="PasswordChange" component={MandatoryPasswordChangeScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
