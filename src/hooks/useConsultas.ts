import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createConsulta,
  deleteConsulta,
  getConsulta,
  listConsultas,
  startConsulta,
  updateConsulta,
  type ConsultaDto,
  type CreateConsultaInput,
  type UpdateConsultaInput,
} from '../services/consultaService';
import { queryKeys } from '../query/queryKeys';

/** List — proves screen -> hook -> TanStack Query -> service -> apiClient -> Spring Boot end-to-end. */
export function useConsultas() {
  return useQuery({
    queryKey: queryKeys.consultas.list(),
    queryFn: listConsultas,
  });
}

/**
 * Detail. Seeds from whatever row is already in the list cache — the
 * screen never flashes empty on navigation from the list, and if the
 * unconfirmed by-id GET turns out unsupported, the seeded row still renders
 * (see the confidence note on getConsulta in consultaService.ts).
 */
export function useConsulta(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.consultas.detail(id),
    queryFn: () => getConsulta(id),
    initialData: () =>
      queryClient
        .getQueryData<ConsultaDto[]>(queryKeys.consultas.list())
        ?.find((consulta) => consulta.id === id),
  });
}

export function useCreateConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConsultaInput) => createConsulta(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
    },
  });
}

/**
 * Deliberately unused by any screen in this phase — the mutation is real and
 * ready, but no UI exposes it, because no field name in `UpdateConsultaInput`
 * is confirmed against a live Spring response, and a Spring @PutMapping is
 * commonly full-replace: sending a guessed partial body at a real
 * consultation risks silently nulling fields this app can't even see.
 * Wire this up once the PUT contract is confirmed.
 */
export function useUpdateConsulta(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateConsultaInput) => updateConsulta(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
    },
  });
}

export function useDeleteConsulta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteConsulta(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
      queryClient.removeQueries({ queryKey: queryKeys.consultas.detail(id) });
    },
  });
}

/** AG -> EP. The resulting status is read back via invalidation + refetch, never assigned locally. */
export function useStartConsulta(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startConsulta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
    },
  });
}
