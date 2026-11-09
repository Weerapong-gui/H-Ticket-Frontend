"use client";
import { eventConfig } from "@/lib/event-config";
import { money, packageFor } from "@/lib/booking";
import { AccountCopyField } from "@/components/account-copy-field";
import { usePackage } from "@/components/booking-provider";

/** ข้อมูลโอนเงิน มาจาก lib/event-config.ts (backend ไม่ได้ส่งข้อมูลนี้มา) */
export function PaymentInfo() {
  const p = eventConfig.payment;
  const pack = packageFor(usePackage().size);
  const ready = !!(p.accountNumber || p.promptPayQr);
  return (
    <section
      className="fixed-event-panel payment-info"
      aria-label="วิธีโอนเงิน"
    >
      <p className="eyebrow">วิธีชำระเงิน</p>
      <h2>โอนเงิน {money(pack.price)} แล้วแนบสลิป</h2>
      {pack.size > 1 && (
        <p>โปร {pack.name} · โอนครั้งเดียวยอดรวมทั้งกลุ่ม แล้วแนบสลิปเดียว</p>
      )}
      {ready ? (
        <dl>
          {p.bankName && (
            <div>
              <dt>ธนาคาร</dt>
              <dd>{p.bankName}</dd>
            </div>
          )}
          {p.accountName && (
            <div>
              <dt>ชื่อบัญชี</dt>
              <dd>{p.accountName}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p>ผู้จัดงานยังไม่ประกาศบัญชีรับโอน</p>
      )}
      {p.accountNumber && <AccountCopyField accountNumber={p.accountNumber} />}
      {p.promptPayQr && (
        // eslint-disable-next-line @next/next/no-img-element -- static QR from config
        <img
          className="promptpay-qr"
          src={p.promptPayQr}
          alt="QR พร้อมเพย์สำหรับโอนเงิน"
        />
      )}
      <p className="selection-hint">
        ใช้รูปสลิปเต็มใบจากแอปธนาคาร ห้ามครอป ต้องเห็น QR บนสลิป
      </p>
    </section>
  );
}
