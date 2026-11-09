/** พิกัดเป็นพิกเซลของรูปที่ทำ mask */
export type Box = { x: number; y: number; w: number; h: number };

export type MaskStats = {
  /** กรอบรอบตัวคน (พิกเซลที่มั่นใจ ≥ threshold) */
  person: Box;
  /** กรอบหัว: บน 22% ของตัวคน กว้างเท่าตัวคนที่ระดับหัว — ผีห้ามทับ */
  head: Box;
  /** สัดส่วนพิกเซลที่เป็นคน 0–1 */
  coverage: number;
  /** ความกว้างฉากหลังซ้าย/ขวาของตัวคน วัดที่ระดับหัว (บน 25% ของตัว)
   *  เพราะเซลฟี่ไหล่มักเต็มจอด้านล่าง แต่ข้างหัวยังมีที่ว่างให้ผีโผล่ */
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
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] < threshold) continue;
      count++;
      if (y < minY) minY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const coverage = count / (w * h);
  if (coverage < 0.02) return null;
  const person = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  let zoneL = w;
  let zoneR = -1;
  const zoneEnd = person.y + Math.max(1, Math.round(person.h * 0.25));
  for (let y = person.y; y < zoneEnd; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x] >= threshold) {
        if (x < zoneL) zoneL = x;
        if (x > zoneR) zoneR = x;
      }
  return {
    person,
    // หัวกว้างเท่าช่วงที่เป็นคนที่ระดับหัว (เซลฟี่ไหล่กว้างกว่าหัวมาก)
    head: {
      x: zoneL,
      y: person.y,
      w: zoneR - zoneL + 1,
      h: Math.round(person.h * 0.22),
    },
    coverage,
    freeLeft: zoneL,
    freeRight: w - (zoneR + 1),
  };
}
