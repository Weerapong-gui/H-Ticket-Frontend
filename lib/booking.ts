import { eventConfig } from "./event-config";
import type { SalesStatus } from "./api";
export const packages = eventConfig.ticket.packages;
export type TicketPackage = (typeof packages)[number];
export type PackageSize = TicketPackage["size"];
/** ราคาบัตรเดี่ยว (1 คน) */
export const TICKET_PRICE = packages[0].price;
export const packageFor = (size: number): TicketPackage =>
  packages.find((p) => p.size === size) ?? packages[0];
export const money = (value: number) => `${value.toLocaleString("en-US")} THB`;
/** ราคาเฉลี่ยต่อคน ปัดลงทศนิยม 1 ตำแหน่ง เช่น 67/2 = 33.5 */
export const perPerson = (p: TicketPackage) =>
  `${(Math.floor((p.price / p.size) * 10) / 10).toLocaleString("en-US")} THB`;
/** โปรนี้ซื้อได้ไหม: ต้องเปิดขายและบัตรเหลือพอทั้งกลุ่ม */
export const canOrderPackage = (sales: SalesStatus | null, size: number) =>
  canOrder(sales) && sales!.remaining >= size;
/** ตรวจรหัสนักศึกษาซ้ำในกลุ่ม คืน index ของช่องที่ซ้ำกับช่องก่อนหน้า */
export function duplicateIndexes(ids: string[]) {
  const seen = new Set<string>();
  const dup = new Set<number>();
  ids.forEach((id, i) => {
    const v = id.trim();
    if (!v) return;
    if (seen.has(v)) dup.add(i);
    seen.add(v);
  });
  return dup;
}
export const validStudentId = (value: string) => /^\d{10}$/.test(value.trim());
export const validPhone = (value: string) => /^0\d{9}$/.test(value.trim());
export const MAX_SLIP_BYTES = 5 * 1024 * 1024;
export function validateSlip(
  file: Pick<File, "type" | "size"> | null,
): string | null {
  if (!file) return "กรุณาแนบรูปสลิปการโอนเงิน";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "รองรับรูปสลิป JPG, PNG หรือ WebP เท่านั้น";
  if (file.size === 0 || file.size > MAX_SLIP_BYTES)
    return "รูปสลิปต้องมีขนาดไม่เกิน 5 MB และไม่ใช่ไฟล์ว่าง";
  return null;
}
export function salesMessage(sales: SalesStatus | null) {
  if (!sales) return "กำลังตรวจสอบสถานะการขาย";
  if (sales.closed_forever) return "ปิดขายผ่านเว็บแล้ว ซื้อได้ที่หน้างาน";
  if (sales.remaining === 0) return "บัตรหมดแล้ว";
  if (!sales.open) return "ยังไม่เปิดขาย / ปิดขายชั่วคราว";
  return "เปิดจองบัตรล่วงหน้า";
}
export const canOrder = (sales: SalesStatus | null) =>
  !!sales && sales.open && !sales.closed_forever && sales.remaining > 0;
export const thaiTime = (date: string) =>
  new Date(date).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
