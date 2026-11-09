import type { Box } from "./mask";

/** ขนาดภาพที่ใช้หาตัวคน/วางผี (เล็กพอให้เร็ว) — ภาพจริง 1080×1440 สัดส่วนเดียวกัน */
export const ANALYSIS_W = 270;
export const ANALYSIS_H = 360;
export const OUT_W = 1080;
export const OUT_H = 1440;

/** จุดที่สว่างที่สุดของผี = ฉากหลังตรงนั้น + 130 (ผสม screen ที่ความเข้ม ~0.5 แล้วเห็นนิด ๆ) */
const LIFT = 130;

/** คืนตัวคูณความสว่างของผี (0–1) ให้จุดที่สว่างที่สุดของผี ≈ ค่าเฉลี่ยฉากหลัง + 130 */
export function matchBrightness(ghostPeak: number, bgMean: number): number {
  if (ghostPeak <= 0) return 0;
  return Math.min(1, (bgMean + LIFT) / ghostPeak);
}

/** กลับกรอบซ้ายขวาภายในภาพกว้าง width */
export function flipBox(box: Box, width: number): Box {
  return { ...box, x: width - box.x - box.w };
}
