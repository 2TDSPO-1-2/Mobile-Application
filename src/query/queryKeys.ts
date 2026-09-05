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
    clinic: (filters?: { nome?: string; especieId?: number; racaId?: number }) =>
      [...queryKeys.patients.all, 'clinic', filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.patients.all, 'detail', id] as const,
  },
  especies: {
    all: ['especies'] as const,
    list: () => [...queryKeys.especies.all, 'list'] as const,
  },
  racas: {
    all: ['racas'] as const,
    byEspecie: (especieId: number) => [...queryKeys.racas.all, 'by-especie', especieId] as const,
  },
  diagnosticos: {
    all: ['diagnosticos'] as const,
    byConsulta: (consultaId: string | number) =>
      [...queryKeys.diagnosticos.all, 'by-consulta', consultaId] as const,
  },
  veterinarios: {
    all: ['veterinarios'] as const,
    detail: (id: string | number) => [...queryKeys.veterinarios.all, 'detail', id] as const,
  },
  prescricoes: {
    all: ['prescricoes'] as const,
    byConsulta: (consultaId: string | number) =>
      [...queryKeys.prescricoes.all, 'by-consulta', consultaId] as const,
    detail: (id: string | number) => [...queryKeys.prescricoes.all, 'detail', id] as const,
  },
};
