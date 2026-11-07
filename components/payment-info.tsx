import { eventConfig } from "@/lib/event-config";
import { money, TICKET_PRICE } from "@/lib/booking";
import { AccountCopyField } from "@/components/account-copy-field";

/** ข้อมูลโอนเงิน มาจาก lib/event-config.ts (backend ไม่ได้ส่งข้อมูลนี้มา) */
export function PaymentInfo() {
  const p = eventConfig.payment;
  const ready = !!(p.accountNumber || p.promptPayQr);
  return (
    <section
      className="fixed-event-panel payment-info"
      aria-label="วิธีโอนเงิน"
    >
      <p className="eyebrow">HOW TO PAY</p>
      <h2>โอนเงิน {money(TICKET_PRICE)} แล้วแนบสลิป</h2>
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
