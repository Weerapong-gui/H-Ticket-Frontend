import { eventConfig } from "./event-config";
import type { SalesStatus } from "./api";
export const TICKET_PRICE = eventConfig.ticket.price;
export const tickets = { earlybird: eventConfig.ticket } as const;
export const money = (value: number) => `${value.toLocaleString("en-US")} THB`;
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
export function numberRanges(numbers: number[]) {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges: string[] = [];
  const label = (n: number) => String(n).padStart(3, "0");
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i];
    let last = first;
    while (sorted[i + 1] === last + 1) last = sorted[++i];
    ranges.push(
      first === last ? label(first) : `${label(first)}–${label(last)}`,
    );
  }
  return ranges.join(", ");
}
export const thaiTime = (date: string) =>
  new Date(date).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
