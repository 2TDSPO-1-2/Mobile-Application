import type { ViaAdministracao } from '../services/prescricaoService';

export const VIA_ADMINISTRACAO_OPTIONS: ViaAdministracao[] = [
  'ORAL',
  'INJETAVEL',
  'TOPICO',
  'OCULAR',
  'OTOLOGICO',
  'OUTRO',
];

const LABELS: Record<ViaAdministracao, string> = {
  ORAL: 'Oral',
  INJETAVEL: 'Injetável',
  TOPICO: 'Tópico',
  OCULAR: 'Ocular',
  OTOLOGICO: 'Otológico',
  OUTRO: 'Outro',
};

export function viaAdministracaoLabel(value?: string | null): string {
  if (!value) return 'Não informada';
  return LABELS[value as ViaAdministracao] ?? value;
}
