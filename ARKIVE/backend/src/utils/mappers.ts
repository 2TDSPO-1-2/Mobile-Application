import type { ApiAppointmentStatus } from '../types';

const STATUS_TO_DB: Record<ApiAppointmentStatus, string> = {
  solicitada: 'AG',
  em_progresso: 'EP',
  confirmada: 'AP',
  realizada: 'FI',
  cancelada: 'CA',
};

const STATUS_FROM_DB: Record<string, ApiAppointmentStatus> = {
  AG: 'solicitada',
  EP: 'em_progresso',
  AP: 'confirmada',
  FI: 'realizada',
  CA: 'cancelada',
};

export function mapStatusToDb(status: ApiAppointmentStatus): string {
  const mapped = STATUS_TO_DB[status];
  if (!mapped) throw new Error(`Status inválido: ${status}`);
  return mapped;
}

export function mapStatusFromDb(status: string): ApiAppointmentStatus {
  return STATUS_FROM_DB[status] ?? 'solicitada';
}

export type ApiSex = 'macho' | 'femea' | 'nao_especificado';

export function mapSexToDb(sex?: ApiSex): string | null {
  if (!sex || sex === 'nao_especificado') return null;
  return sex === 'macho' ? 'M' : 'F';
}

export function mapSexFromDb(sex: string | null): ApiSex {
  if (sex === 'M') return 'macho';
  if (sex === 'F') return 'femea';
  return 'nao_especificado';
}

export function mapNeuteredToDb(neutered: boolean): 'S' | 'N' {
  return neutered ? 'S' : 'N';
}

export function mapNeuteredFromDb(value: string): boolean {
  return value === 'S';
}

export function mapUserRoleFromDb(tpUsuario: string): 'tutor' | 'veterinario' {
  return tpUsuario === 'VETERINARIO' ? 'veterinario' : 'tutor';
}

export function mapUserRoleToDb(role: 'tutor' | 'veterinario'): string {
  return role === 'veterinario' ? 'VETERINARIO' : 'RESPONSAVEL';
}
