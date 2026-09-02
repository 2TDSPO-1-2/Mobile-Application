import type { AppointmentStatus } from '../types';
import type { ConsultaStatus } from '../services/consultaService';

/**
 * Single vocabulary the reusable <StatusBadge> renders from, shared by both
 * the old Appointment domain and the real Consulta domain — keeping the
 * presentation component itself domain-agnostic instead of forking it.
 */
export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

const APPOINTMENT_STATUS: Record<AppointmentStatus, StatusPresentation> = {
  solicitada: { label: 'Solicitada', tone: 'warning' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  realizada: { label: 'Realizada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export function appointmentStatusPresentation(status: AppointmentStatus): StatusPresentation {
  return APPOINTMENT_STATUS[status];
}

const CONSULTA_STATUS: Record<ConsultaStatus, StatusPresentation> = {
  AG: { label: 'Agendada', tone: 'neutral' },
  EP: { label: 'Em Progresso', tone: 'info' },
  AP: { label: 'Aguardando Parecer', tone: 'warning' },
  FI: { label: 'Finalizada', tone: 'success' },
  CA: { label: 'Cancelada', tone: 'danger' },
};

export function consultaStatusPresentation(status: ConsultaStatus): StatusPresentation {
  return CONSULTA_STATUS[status];
}
