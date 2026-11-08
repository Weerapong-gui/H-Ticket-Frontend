"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Loaded<T> = {
  /** ผลนี้มาจาก loader ตัวไหน — ถ้า loader เปลี่ยน (เช่นค้นคำใหม่) ผลเก่าถือว่าใช้ไม่ได้ */
  from: () => Promise<T>;
  data: T | null;
  error: unknown;
};

/**
 * โหลดข้อมูลหน้า admin
 * - loader เปลี่ยน → ล้างข้อมูลแล้วโหลดใหม่
 * - refresh() → โหลดใหม่โดยเก็บข้อมูลเดิมไว้บนจอ (ไม่กะพริบ)
 * - update() → แก้ข้อมูลบนจอตรง ๆ เช่นแทนแถวเดียวหลังรับบัตร
 */
export function useAdminData<T>(loader: () => Promise<T>) {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const revision = useRef(0);

  const run = useCallback(async (from: () => Promise<T>) => {
    const current = ++revision.current;
    try {
      const data = await from();
      if (current === revision.current) setLoaded({ from, data, error: null });
    } catch (error) {
      if (current === revision.current)
        setLoaded((prev) => ({
          from,
          data: prev?.from === from ? prev.data : null,
          error,
        }));
    }
  }, []);

  useEffect(() => {
    void run(loader);
  }, [loader, run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await run(loader);
    } finally {
      setRefreshing(false);
    }
  }, [loader, run]);

  const update = useCallback((fn: (current: T | null) => T | null) => {
    setLoaded((prev) => prev && { ...prev, data: fn(prev.data) });
  }, []);

  const fresh = loaded && loaded.from === loader ? loaded : null;
  return {
    data: fresh ? fresh.data : null,
    error: fresh ? fresh.error : null,
    loading: !fresh || refreshing,
    refresh,
    update,
  };
}
