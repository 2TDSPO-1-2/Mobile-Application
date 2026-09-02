/**
 * Centralized query-key factory. Grouping keys this way (rather than
 * scattering ['consultas'] / ['consultas', id] string arrays across feature
 * hooks) is what makes queryClient.invalidateQueries(...) predictable once
 * CRUD mutations land in the next phase.
 */
export const queryKeys = {
  consultas: {
    all: ['consultas'] as const,
    list: () => [...queryKeys.consultas.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.consultas.all, 'detail', id] as const,
    clinicalSupport: (id: string | number) =>
      [...queryKeys.consultas.all, 'clinical-support', id] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: () => [...queryKeys.patients.all, 'list'] as const,
  },
  diagnosticos: {
    all: ['diagnosticos'] as const,
    byConsulta: (consultaId: string | number) =>
      [...queryKeys.diagnosticos.all, 'by-consulta', consultaId] as const,
  },
  prescricoes: {
    all: ['prescricoes'] as const,
    byConsulta: (consultaId: string | number) =>
      [...queryKeys.prescricoes.all, 'by-consulta', consultaId] as const,
    detail: (id: string | number) => [...queryKeys.prescricoes.all, 'detail', id] as const,
  },
};
