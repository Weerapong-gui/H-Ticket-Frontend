"use client";
import { EventFacts } from "./event-facts";
import { Ticket } from "lucide-react";
import { eventConfig } from "@/lib/event-config";
import { money, TICKET_PRICE } from "@/lib/booking";
export function Summary({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="summary">
      <div className="summary-top">
        <Ticket size={22} />
        <span>THE HAUNTED HOUSE</span>
      </div>
      <h2>สรุปการจอง</h2>
      <dl>
        <EventFacts />
        <div>
          <dt>บัตร</dt>
          <dd>{eventConfig.ticket.name}</dd>
        </div>
        <div>
          <dt>จำนวน</dt>
          <dd>1 ใบ</dd>
        </div>
      </dl>
      <div className="total">
        <span>ยอดโอน</span>
        <strong>{money(TICKET_PRICE)}</strong>
      </div>
      {children}
    </aside>
  );
}
export function Progress({ step }: { step: number }) {
  return (
    <div className="progress" aria-label={`ขั้นตอน ${step} จาก 3`}>
      {["บัตรและวิธีโอน", "ข้อมูลและสลิป", "รับเลขบัตร"].map((label, i) => (
        <div className={step >= i + 1 ? "active" : ""} key={label}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {label}
        </div>
      ))}
    </div>
  );
}
