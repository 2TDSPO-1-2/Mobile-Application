import type { Animal, Appointment, UserRole } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Agenda: undefined;
  Animais: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  NovoAnimal: undefined;
  AtualizarAnimal: { animalId: string };
  AcompanhamentoAnimal: { animalId: string };
  NovaConsulta: { animalId?: string };
  Avaliacoes: undefined;
  NovaAvaliacao: { appointmentId: string };
  Feedback: { appointmentId?: string; targetUserId?: string };
  Perfil: undefined;
  Pesquisa: { initialQuery?: string; initialType?: SearchFilterType } | undefined;
  Configuracoes: undefined;
  Notificacoes: undefined;
};

export type SearchFilterType = 'todos' | 'animal' | 'veterinario' | 'clinica' | 'responsavel';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export interface AnimalFormData {
  name: string;
  species: string;
  breed?: string;
  sex: Animal['sex'];
  neutered: boolean;
  weight?: string;
  birthDate?: string;
  age?: string;
  size?: string;
  notes?: string;
}

export interface AppointmentFormData {
  animalId: string;
  date: string;
  time: string;
  notes: string;
}

export interface UserContextValue {
  user: import('../types').User | null;
  role: UserRole | null;
  loading: boolean;
  login: (
    identifier: string,
    password: string,
    role: UserRole,
    autoLogin?: boolean
  ) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  cpf: string;
  isVeterinarian: boolean;
  crmv?: string;
  autoLogin?: boolean;
}