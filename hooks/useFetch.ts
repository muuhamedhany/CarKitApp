import { useState, useCallback } from 'react';

export function useFetch<T, P extends any[]>(
  fetchFunction: (...args: P) => Promise<T>,
  initialState: T | null = null
) {
  const [data, setData] = useState<T | null>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction(...args);
        setData(result);
        return { data: result, error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return { data: null, error };
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction]
  );

  return { data, loading, error, execute, setData };
}
