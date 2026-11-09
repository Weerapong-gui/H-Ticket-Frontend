"use client";
import { useSales } from "./booking-provider";
import { canOrder, salesState } from "@/lib/booking";
import { useLang, useT } from "@/lib/i18n/client";
export function SalesNotice() {
  const { sales, loading, error, refresh } = useSales();
  const t = useT();
  const lang = useLang();
  return (
    <div className="sales-notice" role="status" aria-live="polite">
      {loading ? (
        <p>{t.sales.checking}…</p>
      ) : error ? (
        <>
          <p>{lang === "th" ? error : t.sales.error}</p>
          <button
            type="button"
            className="text-link"
            onClick={() => void refresh()}
          >
            {t.sales.retry}
          </button>
        </>
      ) : (
        <>
          <strong>{t.sales[salesState(sales)]}</strong>
          {canOrder(sales) && <p>{t.sales.onePerId}</p>}
        </>
      )}
    </div>
  );
}
