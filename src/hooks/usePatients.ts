import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPatient,
  getPatientById,
  listMyPatients,
  updatePatient,
  type AnimalRequestInput,
  type MyPatientsFilters,
} from '../services/patientService';
import { queryKeys } from '../query/queryKeys';

/** This veterinarian's own patient registry (`GET /api/animais/me`) — registered by them, previously consulted, or same-clinic if they have one; no prior-consultation requirement, no clinic requirement. */
export function useMyPatients(filters?: MyPatientsFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.patients.mine(filters),
    queryFn: () => listMyPatients(filters),
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
