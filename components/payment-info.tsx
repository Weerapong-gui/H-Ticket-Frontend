"use client";
import { eventConfig } from "@/lib/event-config";
import { money, packageFor } from "@/lib/booking";
import { AccountCopyField } from "@/components/account-copy-field";
import { usePackage } from "@/components/booking-provider";
import { useT } from "@/lib/i18n/client";

/** ข้อมูลโอนเงิน มาจาก lib/event-config.ts (backend ไม่ได้ส่งข้อมูลนี้มา) */
export function PaymentInfo() {
  const p = eventConfig.payment;
  const pack = packageFor(usePackage().size);
  const ready = !!(p.accountNumber || p.promptPayQr);
  const t = useT();
  return (
    <section className="payment-info" aria-label={t.payment.aria}>
      <h2>
        {t.payment.pay} <span className="num">{money(pack.price)}</span>{" "}
        {t.payment.thenSlip}
      </h2>
      {pack.size > 1 && <p>{t.payment.group}</p>}
      {ready ? (
        <dl>
          {p.bankName && (
            <div>
              <dt>{t.payment.bank}</dt>
              <dd>{p.bankName}</dd>
            </div>
          )}
          {p.accountName && (
            <div>
              <dt>{t.payment.accountName}</dt>
              <dd>{p.accountName}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p>{t.payment.notAnnounced}</p>
      )}
      {p.accountNumber && <AccountCopyField accountNumber={p.accountNumber} />}
      {p.promptPayQr && (
        // eslint-disable-next-line @next/next/no-img-element -- static QR from config
        <img
          className="promptpay-qr"
          src={p.promptPayQr}
          alt={t.payment.qrAlt}
        />
      )}
      <p className="selection-hint">{t.payment.slipHint}</p>
    </section>
  );
}
