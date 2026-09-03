import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPatient,
  getPatientById,
  listClinicPatients,
  listPatients,
  updatePatient,
  type AnimalRequestInput,
  type ClinicPatientFilters,
} from '../services/patientService';
import { queryKeys } from '../query/queryKeys';

/** "Já atendidos" — patients this veterinarian has previously consulted. */
export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: listPatients,
  });
}

/** "Da clínica" — every active patient in the veterinarian's own clinic, no prior consultation required. */
export function useClinicPatients(filters?: ClinicPatientFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.patients.clinic(filters),
    queryFn: () => listClinicPatients(filters),
    enabled: options?.enabled ?? true,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => getPatientById(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AnimalRequestInput) => createPatient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}

export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AnimalRequestInput) => updatePatient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
