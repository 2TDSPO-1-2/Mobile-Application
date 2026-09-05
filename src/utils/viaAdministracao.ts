import type { ViaAdministracao } from '../services/prescricaoService';
import { t } from '../i18n/store';

export const VIA_ADMINISTRACAO_OPTIONS: ViaAdministracao[] = [
  'ORAL',
  'INJETAVEL',
  'TOPICO',
  'OCULAR',
  'OTOLOGICO',
  'OUTRO',
];

export function viaAdministracaoLabel(value?: string | null): string {
  if (!value) return t('viaAdministracao.notInformed');
  if (!VIA_ADMINISTRACAO_OPTIONS.includes(value as ViaAdministracao)) return value;
  return t(`viaAdministracao.${value as ViaAdministracao}`);
}
