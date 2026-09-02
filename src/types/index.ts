export type UserRole = 'tutor' | 'veterinario';

export type ThemeMode = 'light' | 'dark';

export type AppointmentStatus =
  | 'solicitada'
  | 'confirmada'
  | 'realizada'
  | 'cancelada';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  cpf: string;
  role: UserRole;
  crmv?: string;
  specialty?: string;
  autoLogin?: boolean;
  createdAt: string;
  responsavelId?: number;
  veterinarioId?: number;
  /** DS_LOGIN retornado pela API (sessão interna). */
  login?: string;
}

export interface Animal {
  id: string;
  tutorId: string;
  name: string;
  species: string;
  breed?: string;
  sex: 'macho' | 'femea' | 'nao_especificado';
  neutered: boolean;
  weight?: number;
  birthDate?: string;
  age?: number;
  size?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  animalId: string;
  tutorId: string;
  veterinarianId?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  emergency?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: string;
  appointmentId: string;
  veterinarianId: string;
  animalId: string;
  score: number;
  clinicalNotes: string;
  wellbeingNotes: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  fromUserId: string;
  toUserId: string;
  appointmentId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ThemePreferences {
  mode: ThemeMode;
  pushEnabled: boolean;
  emailEnabled: boolean;
}
