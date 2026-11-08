"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  consumeMirror as consumeMirrorState,
  initialFigure,
  markSeen,
  parseFigure,
  registerReturn,
  revealPending,
  serializeFigure,
  type FigureState,
} from "@/lib/scare/figure-state";
import { shouldWhisper } from "@/lib/scare/whisper-policy";
import { browserStore, KEYS, readKey, writeKey } from "@/lib/scare/storage";
import { WhisperEngine } from "./whisper-engine";

type Scare = {
  /** null = ยังไม่รู้ (ก่อน mount) */
  entered: boolean | null;
  muted: boolean;
  enter(withSound: boolean): void;
  toggleMute(): void;
  figure: FigureState;
  heroVisible(): void;
  consumeMirror(): void;
  reducedMotion: boolean;
};

const Context = createContext<Scare | null>(null);

export function useScare(): Scare {
  const value = useContext(Context);
  if (!value) throw new Error("useScare must be used inside ScareProvider");
  return value;
}

export function ScareProvider({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState<boolean | null>(null);
  const [muted, setMuted] = useState(false);
  const [figure, setFigure] = useState<FigureState>(initialFigure);
  const [reducedMotion, setReducedMotion] = useState(false);

  const engine = useRef<WhisperEngine | null>(null);
  const figureRef = useRef<FigureState>(initialFigure);
  const loaded = useRef(false);
  const live = useRef({
    entered: false,
    muted: false,
    lastAt: null as number | null,
  });

  const getEngine = () => (engine.current ??= new WhisperEngine());

  /** เปลี่ยน figure แล้วบันทึกทันที (ไม่รอ effect เพื่อไม่ให้ค่าเริ่มต้นทับของที่เก็บไว้) */
  const updateFigure = useCallback((fn: (f: FigureState) => FigureState) => {
    if (!loaded.current) return;
    const next = fn(figureRef.current);
    if (next === figureRef.current) return;
    figureRef.current = next;
    writeKey(browserStore(), KEYS.figure, serializeFigure(next));
    setFigure(next);
  }, []);

  const whisperMaybe = useCallback(() => {
    const s = live.current;
    const e = engine.current;
    if (!s.entered || s.muted || !e?.unlocked) return;
    const now = Date.now();
    if (!shouldWhisper(now, s.lastAt, Math.random())) return;
    s.lastAt = now;
    e.play();
  }, []);

  // อ่านค่าที่เก็บไว้หลัง mount เท่านั้น (ตอน render ฝั่ง server ไม่มี localStorage)
  useEffect(() => {
    const store = browserStore();
    const wasEntered = readKey(store, KEYS.entered) === "1";
    const wasMuted = readKey(store, KEYS.muted) === "1";
    const fig = registerReturn(
      parseFigure(readKey(store, KEYS.figure)),
      Date.now(),
    );
    figureRef.current = fig;
    loaded.current = true;
    writeKey(store, KEYS.figure, serializeFigure(fig));
    live.current.entered = wasEntered;
    live.current.muted = wasMuted;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    queueMicrotask(() => {
      setEntered(wasEntered);
      setMuted(wasMuted);
      setFigure(fig);
      setReducedMotion(reduced);
    });
  }, []);

  // นับ "การกลับมา": ออกจากแท็บ/หน้า → จำเวลา, กลับมา → registerReturn
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden")
        updateFigure((f) => markSeen(f, Date.now()));
      else updateFigure((f) => registerReturn(f, Date.now()));
    };
    const onPageHide = () => updateFigure((f) => markSeen(f, Date.now()));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // ออกจากหน้าแรก (เช่นไป /booking) ก็นับเป็นการจากไปเหมือนกัน
      onPageHide();
    };
  }, [updateFigure]);

  // ทริกเกอร์เสียงกระซิบจากการแตะ/เลื่อน
  useEffect(() => {
    const onPointer = () => {
      const s = live.current;
      if (!s.entered || s.muted) return;
      const e = getEngine();
      if (e.unlocked) whisperMaybe();
      else void e.unlock({ overrideSilent: true }).then(whisperMaybe);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", whisperMaybe, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", whisperMaybe);
    };
  }, [whisperMaybe]);

  useEffect(() => () => engine.current?.dispose(), []);

  const enter = useCallback((withSound: boolean) => {
    const store = browserStore();
    writeKey(store, KEYS.entered, "1");
    writeKey(store, KEYS.muted, withSound ? "0" : "1");
    live.current.entered = true;
    live.current.muted = !withSound;
    if (withSound) {
      const e = getEngine();
      e.setMuted(false);
      live.current.lastAt = Date.now();
      void e.unlock({ overrideSilent: true }).then(() => e.play());
    }
    setMuted(!withSound);
    setEntered(true);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !live.current.muted;
    live.current.muted = next;
    writeKey(browserStore(), KEYS.muted, next ? "1" : "0");
    const e = getEngine();
    e.setMuted(next);
    if (!next) void e.unlock({ overrideSilent: true });
    setMuted(next);
  }, []);

  const heroVisible = useCallback(
    () => updateFigure(revealPending),
    [updateFigure],
  );
  const consumeMirror = useCallback(
    () => updateFigure(consumeMirrorState),
    [updateFigure],
  );

  const value = useMemo(
    () => ({
      entered,
      muted,
      enter,
      toggleMute,
      figure,
      heroVisible,
      consumeMirror,
      reducedMotion,
    }),
    [
      entered,
      muted,
      enter,
      toggleMute,
      figure,
      heroVisible,
      consumeMirror,
      reducedMotion,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
