"use client";
import { useDemoBooking } from "./demo-booking-provider";
import { demoTotal } from "@/lib/demo-booking";
import { EventFacts } from "./event-facts";
import { Ticket, ShieldCheck } from "lucide-react";
import { eventConfig } from "@/lib/event-config";
import { money, TICKET_PRICE } from "@/lib/booking";
export function Summary({ children }: { children?: React.ReactNode }) {
  const { quantity } = useDemoBooking();
  return (
    <aside className="summary">
      <div className="summary-top">
        <Ticket size={22} />
        <span>YOUR NIGHT AT THE HOUSE</span>
      </div>
      <h2>Booking summary</h2>
      <dl>
        <EventFacts />
        <div>
          <dt>บัตร</dt>
          <dd>{eventConfig.ticket.name}</dd>
        </div>
        <div>
          <dt>จำนวน</dt>
          <dd>{quantity} ใบ</dd>
        </div>
        <div>
          <dt>ราคาต่อใบ</dt>
          <dd>{money(TICKET_PRICE)}</dd>
        </div>
      </dl>
      <div className="total">
        <span>รวม</span>
        <strong aria-live="polite">{money(demoTotal(quantity))}</strong>
      </div>
      <p className="summary-note">
        {quantity} ใบ × {money(TICKET_PRICE)} = {money(demoTotal(quantity))}
        <br />
        เดโมเท่านั้น ไม่มีการเรียกเก็บเงิน
      </p>
      {children}
      <p className="demo-note">
        <ShieldCheck size={16} /> DEMO / NOT VALID FOR ENTRY
      </p>
    </aside>
  );
}
export function Progress({ step }: { step: number }) {
  return (
    <div className="progress" aria-label={`ขั้นตอน ${step} จาก 3`}>
      {["เลือกจำนวน", "ข้อมูลและตรวจสอบ", "ยืนยันเดโม"].map((label, i) => (
        <div className={step >= i + 1 ? "active" : ""} key={label}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {label}
        </div>
      ))}
    </div>
  );
}
