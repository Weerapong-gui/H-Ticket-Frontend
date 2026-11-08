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
