"use client";
import { EventFacts } from "./event-facts";
import { money, packageFor } from "@/lib/booking";
import { usePackage } from "./booking-provider";
export function Summary({ children }: { children?: React.ReactNode }) {
  const pack = packageFor(usePackage().size);
  return (
    <aside className="summary">
      <h2>สรุปการจอง</h2>
      <dl>
        <EventFacts />
        <div>
          <dt>โปร</dt>
          <dd>{pack.name} (เมื่อสั่งซื้อผ่านเว็บเท่านั้น)</dd>
        </div>
        <div>
          <dt>จำนวน</dt>
          <dd>{pack.size} ใบ</dd>
        </div>
      </dl>
      <div className="total">
        <span>ยอดโอน</span>
        <strong>{money(pack.price)}</strong>
      </div>
      {children}
    </aside>
  );
}
export function Progress({ step }: { step: number }) {
  return (
    <div className="progress" aria-label={`ขั้นตอน ${step} จาก 3`}>
      {["บัตรและวิธีโอน", "ข้อมูลและสลิป", "ยืนยันการจอง"].map((label, i) => (
        <div className={step >= i + 1 ? "active" : ""} key={label}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {label}
        </div>
      ))}
    </div>
  );
}
