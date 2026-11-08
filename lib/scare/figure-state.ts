/** ร่างชุดดำใน hero: step 0–5 ยืนใกล้ขึ้นเรื่อย ๆ, 6 = หายไปยืนข้างหลังคนดู */
export const FIGURE_GONE = 6;
/** ออกไปไม่ถึงนี้ (จอดับ/แวบไปแอปอื่น) ไม่นับว่ากลับมา */
export const RETURN_MIN_AWAY_MS = 20_000;

export type FigureState = {
  step: number;
  /** ขยับค้างไว้ รอให้ hero อยู่บนจอก่อนค่อยขยับให้เห็น */
  pending: number;
  /** แฟลชครั้งถัดไปต้องเป็นรูปกระจก */
  mirrorArmed: boolean;
  lastSeenAt: number | null;
};

export const initialFigure: FigureState = {
  step: 0,
  pending: 0,
  mirrorArmed: false,
  lastSeenAt: null,
};

export function registerReturn(s: FigureState, now: number): FigureState {
  if (s.lastSeenAt === null || now - s.lastSeenAt < RETURN_MIN_AWAY_MS)
    return s;
  if (s.step + s.pending >= FIGURE_GONE) return s;
  return { ...s, pending: s.pending + 1 };
}

export function markSeen(s: FigureState, now: number): FigureState {
  return { ...s, lastSeenAt: now };
}

export function revealPending(s: FigureState): FigureState {
  if (s.pending <= 0) return s;
  const step = s.step + 1;
  return {
    ...s,
    step,
    pending: s.pending - 1,
    mirrorArmed: s.mirrorArmed || step >= FIGURE_GONE,
  };
}

export function consumeMirror(s: FigureState): FigureState {
  return { ...initialFigure, lastSeenAt: s.lastSeenAt };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

export function parseFigure(raw: string | null): FigureState {
  if (!raw) return initialFigure;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return initialFigure;
    const o = v as Record<string, unknown>;
    if (
      !isInt(o.step, 0, FIGURE_GONE) ||
      !isInt(o.pending, 0, FIGURE_GONE - o.step) ||
      typeof o.mirrorArmed !== "boolean" ||
      !(o.lastSeenAt === null || typeof o.lastSeenAt === "number")
    )
      return initialFigure;
    return {
      step: o.step,
      pending: o.pending,
      mirrorArmed: o.mirrorArmed,
      lastSeenAt: o.lastSeenAt as number | null,
    };
  } catch {
    return initialFigure;
  }
}

export function serializeFigure(s: FigureState): string {
  return JSON.stringify(s);
}
