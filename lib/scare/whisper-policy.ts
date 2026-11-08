/** เว้นอย่างน้อยเท่านี้ระหว่างเสียงกระซิบ กันเลื่อนจอรัวแล้วดังติดกัน */
export const WHISPER_COOLDOWN_MS = 15_000;
/** โอกาสดังต่อการแตะ/เลื่อนหนึ่งครั้ง (หลังพ้นช่วงพัก) */
export const WHISPER_CHANCE = 0.3;

export function shouldWhisper(
  now: number,
  lastAt: number | null,
  rand: number,
): boolean {
  if (lastAt !== null && now - lastAt < WHISPER_COOLDOWN_MS) return false;
  return rand < WHISPER_CHANCE;
}

/**
 * scroll ยิงหลายสิบครั้งต่อวินาที ถ้าสุ่มทุกครั้งเสียงจะดังแทบแน่นอนทุก 15 วินาที
 * gate นี้คืน true เฉพาะ event แรกของการเลื่อนแต่ละครั้ง (เว้นนิ่ง ≥ idleMs = ครั้งใหม่)
 */
export function createScrollGate(idleMs: number): (now: number) => boolean {
  let last: number | null = null;
  return (now) => {
    const fresh = last === null || now - last >= idleMs;
    last = now;
    return fresh;
  };
}
