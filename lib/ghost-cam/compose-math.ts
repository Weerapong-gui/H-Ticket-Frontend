import type { Box } from "./mask";

/** ขนาดภาพที่ใช้หาตัวคน/วางผี (เล็กพอให้เร็ว) — ภาพจริง 1080×1440 สัดส่วนเดียวกัน */
export const ANALYSIS_W = 270;
export const ANALYSIS_H = 360;
export const OUT_W = 1080;
export const OUT_H = 1440;

/** ผีต้องสว่างกว่าฉากหลังแค่นิดเดียว · รูปมืดสนิทยังให้เห็นจาง ๆ */
const LIFT = 1.35;
const MIN_PEAK = 28;

/** คืนตัวคูณความสว่างของผี (0–1) ให้จุดที่สว่างที่สุดของผี ≈ ค่าเฉลี่ยฉากหลัง × 1.35 */
export function matchBrightness(ghostPeak: number, bgMean: number): number {
  if (ghostPeak <= 0) return 0;
  return Math.min(1, Math.max(bgMean * LIFT, MIN_PEAK) / ghostPeak);
}

/** กลับกรอบซ้ายขวาภายในภาพกว้าง width */
export function flipBox(box: Box, width: number): Box {
  return { ...box, x: width - box.x - box.w };
}
