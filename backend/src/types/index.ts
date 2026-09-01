export type ApiUserRole = 'tutor' | 'veterinario';

export type ApiAppointmentStatus =
  | 'solicitada'
  | 'em_progresso'
  | 'confirmada'
  | 'realizada'
  | 'cancelada';

export interface ApiUser {
  id: number;
  role: ApiUserRole;
  name: string;
  email: string | null;
  phone: string | null;
  login: string;
  responsavelId: number | null;
  veterinarioId: number | null;
  crmv?: string | null;
  cpf?: string | null;
  specialty?: string | null;
}

export interface LoginRequest {
  role: ApiUserRole;
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  role: ApiUserRole;
  name: string;
  email?: string;
  phone?: string;
  password: string;
  cpf: string;
  crmv?: string;
}

export interface AnimalDto {
  id: number;
  name: string;
  speciesId: number;
  speciesName: string;
  breedId: number | null;
  breedName: string | null;
  sex: 'macho' | 'femea' | 'nao_especificado';
  neutered: boolean;
  active: boolean;
  responsavelIds: number[];
}

export interface CreateAnimalRequest {
  name: string;
  speciesId?: number;
  speciesName?: string;
  breedId?: number;
  breedName?: string;
  sex?: 'macho' | 'femea' | 'nao_especificado';
  neutered?: boolean;
  responsavelId: number;
  clinicaId?: number;
}

export interface UpdateAnimalRequest {
  name?: string;
  speciesId?: number;
  breedId?: number | null;
  sex?: 'macho' | 'femea' | 'nao_especificado';
  neutered?: boolean;
  active?: boolean;
}

export interface AppointmentDto {
  id: number;
  animalId: number;
  animalName?: string;
  veterinarianId: number;
  veterinarianName?: string;
  clinicaId: number | null;
  dateTime: string;
  modality: 'PRESENCIAL' | 'REMOTA';
  status: ApiAppointmentStatus;
  reason: string;
  notes: string | null;
}

export interface CreateAppointmentRequest {
  animalId: number;
  veterinarianId?: number;
  clinicaId?: number;
  dateTime: string;
  modality?: 'PRESENCIAL' | 'REMOTA';
  reason: string;
  symptoms?: string;
  notes?: string;
  weightKg?: number;
}

export interface UpdateAppointmentStatusRequest {
  status: ApiAppointmentStatus;
  veterinarianId?: number;
}

export interface EvaluationDto {
  id: number;
  animalId: number;
  animalName?: string;
  responsavelId: number | null;
  veterinarianId: number | null;
  appointmentId: number | null;
  evaluatedAt: string;
  score: number | null;
  clinicalNotes: string | null;
  wellbeingNotes: string | null;
}

export interface CreateEvaluationRequest {
  animalId: number;
  responsavelId?: number;
  veterinarianId: number;
  appointmentId?: number;
  score?: number;
  clinicalNotes: string;
  wellbeingNotes: string;
  weightKg?: number;
  age?: number;
}

export interface FeedbackDto {
  id: number;
  veterinarianId: number | null;
  responsavelId: number | null;
  animalId: number | null;
  clinicaId: number | null;
  appointmentId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  veterinarianId?: number;
  responsavelId?: number;
  animalId?: number;
  clinicaId?: number;
  appointmentId?: number;
  rating: number;
  comment?: string;
}

export interface NotificationDto {
  id: number;
  type: string;
  message: string;
  status: 'ENVIADO' | 'LIDO' | 'IGNORADO';
  channel: string;
  animalId: number;
  responsavelId: number | null;
  clinicaId: number | null;
  sentAt: string;
  readAt: string | null;
}

export interface SearchResult {
  type: 'responsavel' | 'veterinario' | 'animal' | 'clinica';
  id: number;
  title: string;
  subtitle: string;
}
