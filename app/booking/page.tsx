"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TicketAccordion } from "@/components/ticket-accordion";
import { EventFacts } from "@/components/event-facts";
import { PaymentInfo } from "@/components/payment-info";
import { SalesNotice } from "@/components/sales-notice";
import { usePurchaseSales } from "@/components/booking-provider";
import { Progress, Summary } from "@/components/summary";
import { canOrder } from "@/lib/booking";
export default function BookingPage() {
  const { sales } = usePurchaseSales();
  return (
    <main className="booking-main">
      <Progress step={1} />
      <div className="page-heading">
        <p className="eyebrow">ONE-DAY EVENT / PRE-SALE</p>
        <h1>
          Reserve your <em>nightmare.</em>
        </h1>
        <p>โอนเงิน แนบสลิป แล้วรับเลขบัตรทันที · 1 รหัสนักศึกษา = 1 ใบ</p>
      </div>
      <div className="booking-grid">
        <div className="booking-controls">
          <SalesNotice />
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
          <PaymentInfo />
          <Link className="text-link" href="/ticket">
            ซื้อแล้ว? ค้นบัตรของคุณ →
          </Link>
        </div>
        <Summary>
          {canOrder(sales) ? (
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
