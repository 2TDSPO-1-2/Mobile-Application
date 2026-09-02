import type { Severidade } from '../services/consultaService';

const LABELS: Record<Severidade, string> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  GRAVE: 'Grave',
};

/** Renders a confirmed Severidade code as its Portuguese label; falls back to the raw value for anything unrecognized (e.g. AI-suggested text that isn't one of the three confirmed codes). */
export function severidadeLabel(value?: string | null): string {
  if (!value) return 'Não informada';
  return LABELS[value as Severidade] ?? value;
}
