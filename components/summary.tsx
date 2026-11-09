"use client";
import { EventFacts } from "./event-facts";
import { money, packageFor } from "@/lib/booking";
import { usePackage } from "./booking-provider";
import { useT } from "@/lib/i18n/client";
export function Summary({ children }: { children?: React.ReactNode }) {
  const pack = packageFor(usePackage().size);
  const t = useT();
  return (
    <aside className="summary">
      <h2>{t.summary.title}</h2>
      <dl>
        <EventFacts />
        <div>
          <dt>{t.summary.promo}</dt>
          <dd>
            {t.pkg.name(pack.size)} {t.summary.webOnly}
          </dd>
        </div>
        <div>
          <dt>{t.summary.qty}</dt>
          <dd>{t.pkg.tickets(pack.size)}</dd>
        </div>
      </dl>
      <div className="total">
        <span>{t.summary.total}</span>
        <strong>{money(pack.price)}</strong>
      </div>
      {children}
    </aside>
  );
}
export function Progress({ step }: { step: number }) {
  const t = useT();
  return (
    <div className="progress" aria-label={t.steps.aria(step)}>
      {t.steps.labels.map((label, i) => (
        <div className={step >= i + 1 ? "active" : ""} key={label}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {label}
        </div>
      ))}
    </div>
  );
}
