import type { Animal, Appointment, UserRole } from '../types';
import type { AnimalDto } from '../services/patientService';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Consultas: undefined;
  Pacientes: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  NovoAnimal: undefined;
  AtualizarAnimal: { animalId: string };
  AcompanhamentoAnimal: { animalId: string };
  NovaConsulta: { animalId?: string };
  ConsultaDetalhe: { consultaId: number };
  CriarConsulta: { preselectedAnimal?: AnimalDto } | undefined;
  NovoPaciente: undefined;
  PacienteDetalhe: { patientId: number };
  EditarPaciente: { patientId: number };
  Prescricoes: { consultaId: number };
  NovaPrescricao: { consultaId: number };
  PrescricaoDetalhe: { prescricaoId: number; consultaId: number };
  EditarPrescricao: { prescricaoId: number; consultaId: number };
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

/**
 * `initializing` — SecureStore/backend revalidation on app start hasn't
 *   resolved yet; navigation must not render Auth or App yet.
 * `authenticated` — a credential pair was accepted by Spring on this session.
 * `unauthenticated` — no credential stored, or it was confirmed invalid/forbidden.
 * `unreachable` — a stored credential exists but the backend couldn't be
 *   reached to confirm it (Render cold start, network drop, 5xx). The
 *   credential is kept — this is deliberately not the same as "logged out".
 */
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'unreachable';

export interface AuthContextValue {
  status: AuthStatus;
  /** The authenticated veterinarian's login identifier, or null when signed out. */
  username: string | null;
  /**
   * @deprecated Compatibility shim for screens still built against the old
   * (deleted) Node-backend User model — Animais/Agenda/Avaliações/Feedback
   * and friends. Spring exposes no profile endpoint yet, so this is a
   * minimal synthetic object (id/name mirror the login username; everything
   * else is blank) rather than real backend profile data. Do not extend it —
   * migrate those screens to their own Spring-backed data instead.
   */
  user: import('../types').User | null;
  /** @deprecated always 'veterinario' once authenticated — kept only so old screens' role branches keep compiling. */
  role: UserRole | null;
  /** @deprecated alias for `status === 'initializing'`. */
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  /** Re-runs credential verification against the backend (e.g. to leave the `unreachable` state). */
  refreshUser: () => Promise<void>;
}