"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TicketAccordion } from "@/components/ticket-accordion";
import { PaymentInfo } from "@/components/payment-info";
import { SalesNotice } from "@/components/sales-notice";
import { usePackage, usePurchaseSales } from "@/components/booking-provider";
import { TicketArt } from "@/components/ticket-art";
import { Progress, Summary } from "@/components/summary";
import { canOrderPackage } from "@/lib/booking";
import { useHref, useT } from "@/lib/i18n/client";
export default function BookingPage() {
  const { sales } = usePurchaseSales();
  const { size } = usePackage();
  const t = useT();
  const href = useHref();
  return (
    <main className="booking-main">
      <Progress step={1} />
      <div className="page-heading">
        <h1>{t.booking.title}</h1>
        <p>{t.booking.lead}</p>
      </div>
      <div className="booking-grid">
        <div className="booking-controls">
          <SalesNotice />
          <section className="booking-step">
            <h2>{t.pkg.choose}</h2>
            <TicketArt className="booking-ticket-art" />
            <TicketAccordion selectable />
          </section>
          <PaymentInfo />
          <Link className="text-link" href={href("/ticket")}>
            {t.booking.bought}
          </Link>
        </div>
        <Summary>
          {canOrderPackage(sales, size) ? (
            <Link className="button" href={href("/checkout")}>
              {t.booking.next} <ArrowRight size={17} />
            </Link>
          ) : (
            <button type="button" className="button" disabled>
              {t.booking.cannotBuy}
            </button>
          )}
        </Summary>
      </div>
    </main>
  );
}
