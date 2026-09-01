import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../interfaces/navigation';
import { BottomTabs } from './BottomTabs';
import { NewAnimalScreen } from '../screens/NewAnimalScreen';
import { EditAnimalScreen } from '../screens/EditAnimalScreen';
import { AnimalFollowUpScreen } from '../screens/AnimalFollowUpScreen';
import { NewAppointmentScreen } from '../screens/NewAppointmentScreen';
import { EvaluationsScreen } from '../screens/EvaluationsScreen';
import { NewEvaluationScreen } from '../screens/NewEvaluationScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { useThemeColors } from '../hooks/useThemeColors';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  const colors = useThemeColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="NovoAnimal" component={NewAnimalScreen} />
      <Stack.Screen name="AtualizarAnimal" component={EditAnimalScreen} />
      <Stack.Screen name="AcompanhamentoAnimal" component={AnimalFollowUpScreen} />
      <Stack.Screen name="NovaConsulta" component={NewAppointmentScreen} />
      <Stack.Screen name="Avaliacoes" component={EvaluationsScreen} />
      <Stack.Screen name="NovaAvaliacao" component={NewEvaluationScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Perfil" component={ProfileScreen} />
      <Stack.Screen name="Pesquisa" component={SearchScreen} />
      <Stack.Screen name="Configuracoes" component={SettingsScreen} />
      <Stack.Screen name="Notificacoes" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
