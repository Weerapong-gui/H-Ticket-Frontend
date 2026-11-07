"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAdminData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const next = await loader();
      if (current === revision.current) setData(next);
    } catch (e) {
      if (current === revision.current) setError(e);
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    let active = true;
    const current = ++revision.current;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setData(null);
        setError(null);
      }
    });
    loader()
      .then((next) => {
        if (active && current === revision.current) setData(next);
      })
      .catch((e) => {
        if (active && current === revision.current) setError(e);
      })
      .finally(() => {
        if (active && current === revision.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader]);
  return { data, loading, error, refresh };
}
