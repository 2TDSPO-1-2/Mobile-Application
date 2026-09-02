import { useQuery } from '@tanstack/react-query';
import { listPatients } from '../services/patientService';
import { queryKeys } from '../query/queryKeys';

export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: listPatients,
  });
}
