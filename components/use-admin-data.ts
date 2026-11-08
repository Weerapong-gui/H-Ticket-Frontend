"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAdminData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const revision = useRef(0);
  // โหลดซ้ำโดยเก็บข้อมูลเดิมไว้บนจอ (ไม่ล้างเป็นว่าง) รายการจะได้ไม่กะพริบและหน้าไม่เด้ง
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
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
  /** แก้ข้อมูลบนจอตรง ๆ (เช่นแทนแถวเดียวหลังรับบัตร) โดยไม่ต้องโหลดใหม่ */
  const update = useCallback((fn: (current: T | null) => T | null) => {
    setData(fn);
  }, []);
  return { data, loading, error, refresh, update };
}
