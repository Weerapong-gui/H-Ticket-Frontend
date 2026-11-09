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

/**
 * ตำแหน่งวาดรูปผีจริง (พิกัดภาพผลลัพธ์): ย่อให้พอดีกรอบไม่ยืด ชิดล่าง
 * ผีมุมจอ (ครึ่งหน้า รอยตัดอยู่ด้านซ้ายของไฟล์): ให้ฝั่งรอยตัดเลยขอบภาพออกไป 5%
 * ไม่งั้นรอยตัดจะลอยอยู่กลางภาพ
 */
export function spriteRect(
  sw: number,
  sh: number,
  box: Box,
  variant: string,
  outW: number,
): Box {
  const k = Math.min(box.w / sw, box.h / sh);
  const w = sw * k;
  const h = sh * k;
  const y = box.y + box.h - h;
  if (variant === "edge") {
    const right = box.x + box.w / 2 > outW / 2;
    return { x: right ? outW - w * 0.95 : -w * 0.05, y, w, h };
  }
  return { x: box.x + (box.w - w) / 2, y, w, h };
}
