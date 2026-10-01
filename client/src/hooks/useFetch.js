import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data fetching hook
 * @param {Function} fetchFn - async function that returns data
 * @param {Array} deps - dependency array for refetch
 * @param {boolean} immediate - fetch on mount
 */
export function useFetch(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  }, deps);

  return { data, loading, error, execute, setData };
}
