import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Cuenta } from '../types';

export function useCuenta() {
  return useQuery({
    queryKey: ['cuenta'],
    queryFn: () => api<Cuenta>('/cuenta/me'),
    refetchInterval: (q) => (q.state.data?.suscripcion?.estadoPago === 'al_dia' ? false : 30_000),
  });
}

/** Mutación sobre /cuenta/* que devuelve la cuenta actualizada. */
export function useAccionCuenta(onOk?: (c: Cuenta) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method = 'POST', body }: { path: string; method?: string; body?: unknown }) =>
      api<Cuenta>(`/cuenta/${path}`, { method, body }),
    onSuccess: (cuenta) => {
      qc.setQueryData(['cuenta'], cuenta);
      onOk?.(cuenta);
    },
  });
}
