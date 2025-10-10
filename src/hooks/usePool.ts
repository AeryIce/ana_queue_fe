// src/hooks/usePool.ts
import useSWR from 'swr';
import { fetchPool } from '@/lib/queueApi';

export function usePool() {
  const { data, error, isLoading, mutate } = useSWR('pool', fetchPool, {
    refreshInterval: 3000, // auto update ringan
    revalidateOnFocus: false,
  });
  return {
    pool: data?.pool ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
