"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TicketAccordion } from "@/components/ticket-accordion";
import { EventFacts } from "@/components/event-facts";
import { PaymentInfo } from "@/components/payment-info";
import { SalesNotice } from "@/components/sales-notice";
import { usePackage, usePurchaseSales } from "@/components/booking-provider";
import { TicketArt } from "@/components/ticket-art";
import { Progress, Summary } from "@/components/summary";
import { canOrderPackage } from "@/lib/booking";
export default function BookingPage() {
  const { sales } = usePurchaseSales();
  const { size } = usePackage();
  return (
    <main className="booking-main">
      <Progress step={1} />
      <div className="page-heading">
        <p className="eyebrow">บัตรล่วงหน้า</p>
        <h1>
          จอง<em>บัตร</em>
        </h1>
        <p>
          เลือกโปร โอนเงิน แนบสลิป แล้วรับบัตรที่หน้างานด้วยรหัสนักศึกษา · 1
          รหัสนักศึกษา = 1 ใบ
        </p>
      </div>
      <div className="booking-grid">
        <div className="booking-controls">
          <SalesNotice />
          <section className="fixed-event-panel" aria-label="รายละเอียดงาน">
            <p className="eyebrow">รายละเอียดงาน</p>
            <dl>
              <EventFacts />
            </dl>
          </section>
          <section className="booking-step">
            <h2>เลือกโปร</h2>
            <TicketArt className="booking-ticket-art" />
            <TicketAccordion selectable />
          </section>
          <PaymentInfo />
          <Link className="text-link" href="/ticket">
            ซื้อแล้ว? ค้นบัตรของคุณ →
          </Link>
        </div>
        <Summary>
          {canOrderPackage(sales, size) ? (
            <Link className="button" href="/checkout">
              โอนแล้ว ไปแนบสลิป <ArrowRight size={17} />
            </Link>
          ) : (
            <button type="button" className="button" disabled>
              ยังซื้อบัตรไม่ได้
            </button>
          )}
        </Summary>
      </div>
    </main>
  );
}
