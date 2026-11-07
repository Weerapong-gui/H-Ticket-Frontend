"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TicketAccordion } from "@/components/ticket-accordion";
import { EventFacts } from "@/components/event-facts";
import { Progress, Summary } from "@/components/summary";
export default function BookingPage() {
  return (
    <main className="booking-main">
      <Progress step={1} />
      <div className="page-heading">
        <p className="eyebrow">ONE-DAY EVENT / DEMO BOOKING</p>
        <h1>
          Reserve your <em>nightmare.</em>
        </h1>
        <p>เลือกจำนวน 1–10 ใบ แล้วกรอกข้อมูลแยกทุกคน · 1 รหัสนักศึกษา = 1 ใบ</p>
      </div>
      <div className="booking-grid">
        <div className="booking-controls">
          <section className="fixed-event-panel" aria-label="Event information">
            <p className="eyebrow">THE NIGHT TO REMEMBER</p>
            <dl>
              <EventFacts />
            </dl>
          </section>
          <section className="booking-step">
            <h2>บัตรล่วงหน้า</h2>
            <TicketAccordion />
          </section>
          <Link className="text-link" href="/ticket">
            ค้นบัตรที่ออกโดยระบบจริง →
          </Link>
        </div>
        <Summary>
          <Link className="button" href="/checkout">
            กรอกข้อมูลนักศึกษา <ArrowRight size={17} />
          </Link>
        </Summary>
      </div>
    </main>
  );
}
