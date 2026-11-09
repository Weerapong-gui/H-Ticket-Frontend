"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Ticket, Users } from "lucide-react";
import { eventConfig } from "@/lib/event-config";
import { money, packages, canOrderPackage } from "@/lib/booking";
import { usePackage, useSales } from "./booking-provider";

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
            {eventConfig.ticket.category}
            <span className="web-only-badge">โปรเฉพาะในเว็บ</span>
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
              aria-label={selectable ? "เลือกโปร" : undefined}
            >
              {packages.map((p) => {
                const available = !sales || canOrderPackage(sales, p.size);
                const body = (
                  <>
                    <div className="early-bird-name">
                      <strong>
                        {p.size > 1 && <Users size={15} aria-hidden="true" />}
                        {p.name}
                      </strong>
                      {!available && (
                        <span className="ticket-available">บัตรเหลือไม่พอ</span>
                      )}
                    </div>
                    <div className="early-bird-price">
                      <strong>{money(p.price)}</strong>
                      <span>{p.size === 1 ? "ต่อคน" : `${p.size} ใบ`}</span>
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
            <p className="ticket-quantity-note">
              ราคานี้เฉพาะจองผ่านเว็บ มากันเป็นกลุ่มโอนครั้งเดียวได้ทุกคน
              วันงานรับบัตรด้วยรหัสนักศึกษา
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
