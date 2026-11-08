export type KV = Pick<Storage, "getItem" | "setItem">;

export const KEYS = {
  entered: "hh-entered",
  muted: "hh-muted",
  figure: "hh-figure",
} as const;

/** localStorage อาจถูก block (private mode ฯลฯ) — ห้าม throw ออกไป */
export function readKey(store: KV | null, key: string): string | null {
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeKey(store: KV | null, key: string, value: string): void {
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch {
    // เก็บไม่ได้ก็ใช้ค่าในหน่วยความจำต่อไป
  }
}

export function browserStore(): KV | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
