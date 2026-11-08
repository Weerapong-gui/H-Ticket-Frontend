import type { Order } from "./api";

/** QR บนหน้าบัตรเก็บแค่รหัสนักศึกษา 10 หลัก อย่างอื่นถือว่าไม่ใช่บัตร */
export function parseScan(raw: string): string | null {
  const text = raw.trim();
  return /^\d{10}$/.test(text) ? text : null;
}

export type PickupResult =
  | { kind: "ready"; order: Order }
  | { kind: "picked"; order: Order }
  | { kind: "cancelled"; order: Order }
  | { kind: "not_found" };

const stamp = (o: Order) => Date.parse(o.cancelled_at ?? o.created_at) || 0;

/** ใช้เฉพาะรายการที่รหัสตรงเป๊ะ (API ค้นแบบบางส่วน) และให้รายการที่ยังใช้งานได้มาก่อน */
export function resolvePickup(
  studentId: string,
  orders: Order[],
): PickupResult {
  const mine = orders.filter((o) => o.student_id === studentId);
  const active = mine.find((o) => o.status === "active");
  if (active)
    return {
      kind: active.picked_up_at === null ? "ready" : "picked",
      order: active,
    };
  const cancelled = mine
    .filter((o) => o.status === "cancelled")
    .sort((a, b) => stamp(b) - stamp(a))[0];
  return cancelled
    ? { kind: "cancelled", order: cancelled }
    : { kind: "not_found" };
}

export type PickupApi = {
  orders(q: string): Promise<Order[]>;
  pickup(id: string, picked_up: boolean): Promise<Order>;
};

export async function lookupPickup(
  studentId: string,
  deps: PickupApi,
): Promise<PickupResult> {
  return resolvePickup(studentId, await deps.orders(studentId));
}

export type ConfirmResult =
  { kind: "done"; order: Order } | Exclude<PickupResult, { kind: "ready" }>;

/**
 * วันงานมีหลายเครื่องสแกนพร้อมกัน: ดึงสถานะล่าสุดก่อนบันทึกทุกครั้ง
 * ถ้าอีกเครื่องแจกไปแล้ว (หรือบัตรถูกยกเลิกระหว่างนั้น) จะไม่บันทึกซ้ำ
 */
export async function confirmPickup(
  studentId: string,
  deps: PickupApi,
  /**
   * ลองใหม่หลังการยืนยันครั้งก่อนล้มเหลว: id ของบัตรที่พยายามบันทึก
   * ถ้าบัตรใบนั้นถูกบันทึกแล้ว แปลว่าครั้งก่อนสำเร็จจริงแต่คำตอบหาย → นับเป็นแจกสำเร็จ ไม่ใช่การ์ดส้ม
   */
  retryOf: string | null = null,
): Promise<ConfirmResult> {
  const latest = await lookupPickup(studentId, deps);
  if (latest.kind === "picked" && latest.order.id === retryOf)
    return { kind: "done", order: latest.order };
  if (latest.kind !== "ready") return latest;
  const order = await deps.pickup(latest.order.id, true);
  return { kind: "done", order };
}

/** QR เดิมที่ยังค้างหน้ากล้องไม่ถูกอ่านซ้ำภายในช่วงนี้ */
export const SAME_SCAN_COOLDOWN_MS = 3_000;
export type LastScan = { text: string; at: number } | null;

export function acceptScan(text: string, now: number, last: LastScan): boolean {
  return !(last && last.text === text && now - last.at < SAME_SCAN_COOLDOWN_MS);
}

/** แทนแถวเดียวในรายการด้วยข้อมูลที่ API ส่งกลับ (หลังรับบัตร/ยกเลิก) โดยไม่ต้องโหลดทั้งรายการใหม่ */
export function replaceById<T extends { id: string }>(
  list: T[] | null,
  item: T,
): T[] | null {
  if (!list) return list;
  return list.map((row) => (row.id === item.id ? item : row));
}
