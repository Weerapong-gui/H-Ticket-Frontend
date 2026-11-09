/** พิกัดเป็นพิกเซลของรูปที่ทำ mask */
export type Box = { x: number; y: number; w: number; h: number };

export type MaskStats = {
  /** กรอบรอบตัวคน (พิกเซลที่มั่นใจ ≥ threshold) */
  person: Box;
  /** กรอบหัว: บน 22% ของตัวคน กว้างครึ่งตัว ตรงกลางแถวบนสุด — ผีห้ามทับ */
  head: Box;
  /** สัดส่วนพิกเซลที่เป็นคน 0–1 */
  coverage: number;
  /** ความกว้างฉากหลังซ้าย/ขวาของตัวคน */
  freeLeft: number;
  freeRight: number;
};

/** สรุป mask ของคน · null ถ้าแทบไม่เจอคน (< 2% ของภาพ) */
export function maskStats(
  mask: Float32Array,
  w: number,
  h: number,
  threshold = 0.5,
): MaskStats | null {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  let topL = w;
  let topR = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] < threshold) continue;
      count++;
      if (y < minY) {
        minY = y;
        topL = x;
        topR = x;
      } else if (y === minY) {
        topL = Math.min(topL, x);
        topR = Math.max(topR, x);
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const coverage = count / (w * h);
  if (coverage < 0.02) return null;
  const person = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  const headW = person.w * 0.5;
  const cx = (topL + topR) / 2;
  const hx = Math.min(
    Math.max(cx - headW / 2, person.x),
    person.x + person.w - headW,
  );
  return {
    person,
    head: { x: hx, y: person.y, w: headW, h: Math.round(person.h * 0.22) },
    coverage,
    freeLeft: person.x,
    freeRight: w - (person.x + person.w),
  };
}
