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

/**
 * inline script บนหน้าแรก รันก่อน paint: ถ้าเคยผ่านหน้าประตูแล้ว ติด data-hh-entered ที่ <html>
 * ให้ CSS ซ่อนหน้าประตู (ก่อน React อ่าน localStorage เสร็จ) คนที่เคยเข้าแล้วจะไม่เห็นจอดำแวบ
 */
export const ENTRY_GATE_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(KEYS.entered)})==="1")document.documentElement.setAttribute("data-hh-entered","")}catch(e){}`;
