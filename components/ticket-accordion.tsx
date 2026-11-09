"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Ticket, Users } from "lucide-react";
import { money, packages, canOrderPackage } from "@/lib/booking";
import { usePackage, useSales } from "./booking-provider";
import { useT } from "@/lib/i18n/client";

/** โปรเฉพาะในเว็บ 1/2/5 คน · selectable = ให้เลือกโปร (หน้าจองบัตร) */
export function TicketAccordion({
  selectable = false,
}: {
  selectable?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const groupName = useId();
  const reduced = useReducedMotion();
  const { sales } = useSales();
  const { size, setSize } = usePackage();
  const t = useT();
  return (
    <div className="ticket-accordion">
      <h3>
        <button
          type="button"
          className="ticket-accordion-header"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <span className="ticket-category">
            <Ticket size={22} />
            {t.pkg.category}
            <span className="web-only-badge">{t.pkg.webOnly}</span>
          </span>
          <ChevronDown
            size={18}
            className={
              open ? "accordion-chevron expanded" : "accordion-chevron"
            }
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            className="ticket-accordion-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <div
              role={selectable ? "radiogroup" : undefined}
              aria-label={selectable ? t.pkg.choose : undefined}
            >
              {packages.map((p) => {
                const available = !sales || canOrderPackage(sales, p.size);
                const body = (
                  <>
                    <div className="early-bird-name">
                      <strong>
                        {p.size > 1 && <Users size={15} aria-hidden="true" />}
                        {t.pkg.name(p.size)}
                      </strong>
                      {!available && (
                        <span className="ticket-available">
                          {t.pkg.notEnough}
                        </span>
                      )}
                    </div>
                    <div className="early-bird-price">
                      <strong>{money(p.price)}</strong>
                      <span>
                        {p.size === 1 ? t.pkg.perPerson : t.pkg.tickets(p.size)}
                      </span>
                    </div>
                  </>
                );
                return selectable ? (
                  <label
                    key={p.size}
                    className={`early-bird-row package-option${size === p.size ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={p.size}
                      checked={size === p.size}
                      disabled={!available}
                      onChange={() => setSize(p.size)}
                    />
                    {body}
                  </label>
                ) : (
                  <div key={p.size} className="early-bird-row">
                    {body}
                  </div>
                );
              })}
            </div>
            <p className="ticket-quantity-note">{t.pkg.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
