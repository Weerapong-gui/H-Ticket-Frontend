/** แฟลชไม่ถี่กว่า 1 ครั้ง/1.5 วินาที (WCAG 2.3.1 กำหนดไม่เกิน 3 ครั้ง/วินาที) */
export const SHOT_MIN_GAP_MS = 1_500;
export const GHOST_CHANCE = 0.5;

export function canShoot(now: number, lastShotAt: number | null): boolean {
  return lastShotAt === null || now - lastShotAt >= SHOT_MIN_GAP_MS;
}

export type ShotPlan =
  | { kind: "photo"; photoIndex: number; ghostSpot: number | null }
  | { kind: "mirror" };

export function planShot(
  shotCount: number,
  photoCount: number,
  spotCounts: number[],
  mirrorArmed: boolean,
  rand: () => number,
): ShotPlan {
  if (mirrorArmed) return { kind: "mirror" };
  const photoIndex = shotCount % photoCount;
  const ghostSpot =
    rand() < GHOST_CHANCE ? Math.floor(rand() * spotCounts[photoIndex]) : null;
  return { kind: "photo", photoIndex, ghostSpot };
}
