"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Ticket } from "lucide-react";
import { money, tickets, TICKET_PRICE, canOrder } from "@/lib/booking";
import { useSales } from "./booking-provider";
export function TicketAccordion() {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const reduced = useReducedMotion();
  const { sales } = useSales();
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
            {tickets.earlybird.category}
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
            <div className="early-bird-row">
              <div className="early-bird-name">
                <strong>{tickets.earlybird.name}</strong>
                <span className="ticket-available">
                  <i aria-hidden="true" />
                  {sales && canOrder(sales)
                    ? `เหลือ ${sales.remaining} / ${sales.total} ใบ`
                    : "บัตรล่วงหน้า"}
                </span>
              </div>
              <div className="early-bird-price">
                <strong>{money(TICKET_PRICE)}</strong>
                <span>ต่อคน</span>
              </div>
            </div>
            <p className="ticket-quantity-note">
              1 รหัสนักศึกษา = 1 ใบ · เลขบัตรบนเว็บตรงกับบัตรจริงและลำดับคิว
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
