"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, errorMessage, SalesStatus } from "@/lib/api";
import { packages, type PackageSize } from "@/lib/booking";
const Context = createContext<{
  sales: SalesStatus | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({ sales: null, loading: true, error: "", refresh: async () => {} });
export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<SalesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setSales(null);
    setError("");
    try {
      const next = await api.sales();
      if (current === revision.current) setSales(next);
    } catch (e) {
      if (current === revision.current) setError(errorMessage(e));
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++revision.current;
    api
      .sales(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted && current === revision.current)
          setSales(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted && current === revision.current)
          setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted && current === revision.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, []);
  return (
    <Context.Provider value={{ sales, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useSales = () => useContext(Context);
/** Recheck stock on entering either purchasing step; the backend also enforces it on submit. */
export function usePurchaseSales() {
  const state = useSales();
  const { refresh } = state;
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
    };
  }, [refresh]);
  return state;
}

const PACK_KEY = "haunted-package";
const PackageContext = createContext<{
  size: PackageSize;
  setSize: (size: PackageSize) => void;
}>({ size: 1, setSize: () => {} });
/** โปรที่เลือกไว้ ใช้ร่วมกันระหว่างหน้าจองและหน้าแนบสลิป (จำไว้ใน sessionStorage) */
export function PackageProvider({ children }: { children: React.ReactNode }) {
  const [size, setSizeState] = useState<PackageSize>(1);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(PACK_KEY);
    } catch {}
    const found = packages.find((p) => String(p.size) === saved);
    if (found) queueMicrotask(() => setSizeState(found.size));
  }, []);
  const setSize = useCallback((next: PackageSize) => {
    setSizeState(next);
    try {
      sessionStorage.setItem(PACK_KEY, String(next));
    } catch {}
  }, []);
  return (
    <PackageContext.Provider value={{ size, setSize }}>
      {children}
    </PackageContext.Provider>
  );
}
export const usePackage = () => useContext(PackageContext);
