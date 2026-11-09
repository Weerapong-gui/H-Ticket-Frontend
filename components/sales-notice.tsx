"use client";
import { useSales } from "./booking-provider";
import { canOrder, salesMessage } from "@/lib/booking";
export function SalesNotice() {
  const { sales, loading, error, refresh } = useSales();
  return (
    <div className="sales-notice" role="status" aria-live="polite">
      {loading ? (
        <p>กำลังตรวจสอบสถานะการขาย…</p>
      ) : error ? (
        <>
          <p>{error}</p>
          <button
            type="button"
            className="text-link"
            onClick={() => void refresh()}
          >
            ลองตรวจสอบอีกครั้ง →
          </button>
        </>
      ) : (
        <>
          <strong>{salesMessage(sales)}</strong>
          {canOrder(sales) && <p>หนึ่งรหัสนักศึกษาซื้อได้หนึ่งใบ</p>}
        </>
      )}
    </div>
  );
}
