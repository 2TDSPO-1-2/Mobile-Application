import type {
  Animal,
  Appointment,
  AppNotification,
  Evaluation,
  Feedback,
  User,
  UserRole,
} from '../types';

export interface ApiUserDto {
  id: number;
  role: UserRole;
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

export interface ApiAnimalDto {
  id: number;
  name: string;
  speciesId: number;
  speciesName: string;
  breedId: number | null;
  breedName: string | null;
  sex: Animal['sex'];
  neutered: boolean;
  active: boolean;
  responsavelIds: number[];
}

export interface ApiAppointmentDto {
  id: number;
  animalId: number;
  animalName?: string;
  veterinarianId: number;
  veterinarianName?: string;
  clinicaId: number | null;
  dateTime: string;
  modality: 'PRESENCIAL' | 'REMOTA';
  status: Appointment['status'] | 'em_progresso';
  reason: string;
  notes: string | null;
}

export interface ApiEvaluationDto {
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

export interface ApiFeedbackDto {
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

export interface ApiNotificationDto {
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

export interface ApiSearchResult {
  type: 'responsavel' | 'veterinario' | 'animal' | 'clinica';
  id: number;
  title: string;
  subtitle: string;
}

export function mapApiUserToUser(
  api: ApiUserDto,
  extras?: { autoLogin?: boolean; password?: string }
): User {
  return {
    id: String(api.id),
    name: api.name,
    email: api.email ?? '',
    phone: api.phone ?? '',
    cpf: api.cpf ?? (api.role === 'tutor' ? api.login : ''),
    role: api.role,
    crmv: api.crmv ?? undefined,
    specialty: api.specialty ?? undefined,
    autoLogin: extras?.autoLogin,
    password: extras?.password,
    createdAt: new Date().toISOString(),
    responsavelId: api.responsavelId ?? undefined,
    veterinarioId: api.veterinarioId ?? undefined,
    login: api.login,
  };
}

export function mapApiAnimalToAnimal(
  dto: ApiAnimalDto,
  tutorId: string
): Animal {
  const now = new Date().toISOString();

  return {
    id: String(dto.id),
    tutorId,
    name: dto.name,
    species: dto.speciesName,
    breed: dto.breedName ?? undefined,
    sex: dto.sex,
    neutered: dto.neutered,
    createdAt: now,
    updatedAt: now,
  };
}

function splitDateTime(iso: string): { date: string; time: string } {
  const dateObject = new Date(iso);

  if (Number.isNaN(dateObject.getTime())) {
    return {
      date: iso.slice(0, 10),
      time: '09:00',
    };
  }

  const date = dateObject.toISOString().slice(0, 10);
  const time = `${String(dateObject.getHours()).padStart(2, '0')}:${String(
    dateObject.getMinutes()
  ).padStart(2, '0')}`;

  return { date, time };
}

export function mapApiAppointmentToAppointment(
  dto: ApiAppointmentDto,
  tutorId = ''
): Appointment {
  const { date, time } = splitDateTime(dto.dateTime);
  const now = new Date().toISOString();

  const status =
    dto.status === 'em_progresso'
      ? 'confirmada'
      : (dto.status as Appointment['status']);

  return {
    id: String(dto.id),
    animalId: String(dto.animalId),
    tutorId,
    veterinarianId: String(dto.veterinarianId),
    date,
    time,
    status,
    notes: dto.notes ?? dto.reason,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapApiEvaluationToEvaluation(dto: ApiEvaluationDto): Evaluation {
  return {
    id: String(dto.id),
    appointmentId: dto.appointmentId ? String(dto.appointmentId) : '',
    veterinarianId: dto.veterinarianId ? String(dto.veterinarianId) : '',
    animalId: String(dto.animalId),
    score: dto.score ?? 0,
    clinicalNotes: dto.clinicalNotes ?? '',
    wellbeingNotes: dto.wellbeingNotes ?? '',
    createdAt: dto.evaluatedAt,
  };
}

export function mapApiFeedbackToFeedback(
  dto: ApiFeedbackDto,
  currentUserId: string
): Feedback {
  return {
    id: String(dto.id),
    fromUserId: currentUserId,
    toUserId:
      dto.veterinarianId != null
        ? String(dto.veterinarianId)
        : dto.responsavelId != null
          ? String(dto.responsavelId)
          : currentUserId,
    appointmentId: dto.appointmentId ? String(dto.appointmentId) : undefined,
    rating: dto.rating,
    comment: dto.comment ?? '',
    createdAt: dto.createdAt,
  };
}

export function mapApiNotificationToAppNotification(
  dto: ApiNotificationDto,
  userId: string
): AppNotification {
  return {
    id: String(dto.id),
    userId,
    title: dto.type,
    message: dto.message,
    read: dto.status === 'LIDO',
    createdAt: dto.sentAt,
  };
}