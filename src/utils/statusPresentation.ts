import type { AppointmentStatus } from '../types';
import type { ConsultaStatus } from '../services/consultaService';
import { t } from '../i18n/store';

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

// Appointment is the legacy (deleted-backend) domain — its labels aren't in
// the translation dictionary since that flow isn't reachable from the app's
// current navigation; kept in Portuguese as-is rather than adding unused keys.
const APPOINTMENT_STATUS: Record<AppointmentStatus, StatusPresentation> = {
  solicitada: { label: 'Solicitada', tone: 'warning' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  realizada: { label: 'Realizada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export function appointmentStatusPresentation(status: AppointmentStatus): StatusPresentation {
  return APPOINTMENT_STATUS[status];
}

const CONSULTA_STATUS_TONE: Record<ConsultaStatus, StatusTone> = {
  AG: 'neutral',
  EP: 'info',
  AP: 'warning',
  FI: 'success',
  CA: 'danger',
};

/**
 * Reads the CURRENT language at call time (not reactive on its own) — every
 * caller renders from a component that also calls `useTranslation()` (even
 * indirectly, via its own screen), so it already re-renders when the
 * language changes, which re-evaluates this alongside it.
 */
export function consultaStatusPresentation(status: ConsultaStatus): StatusPresentation {
  return { label: t(`consultaStatus.${status}`), tone: CONSULTA_STATUS_TONE[status] };
}
