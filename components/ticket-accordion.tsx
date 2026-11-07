"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Ticket, Minus, Plus } from "lucide-react";
import { money, tickets, TICKET_PRICE } from "@/lib/booking";
import { useDemoBooking } from "./demo-booking-provider";
export function TicketAccordion() {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const reduced = useReducedMotion();
  const { quantity, setQuantity } = useDemoBooking();
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
                  เดโมการจองบัตร
                </span>
              </div>
              <div className="early-bird-price">
                <strong>{money(TICKET_PRICE)}</strong>
                <span>ต่อคน</span>
              </div>
              <div className="quantity" role="group" aria-label="จำนวนบัตร">
                <button
                  type="button"
                  aria-label="ลดจำนวนบัตร"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={16} />
                </button>
                <output aria-label="จำนวนบัตร" aria-live="polite">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="เพิ่มจำนวนบัตร"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <p className="ticket-quantity-note">
              เลือกได้ 1–10 ใบ · แต่ละใบต้องใช้รหัสนักศึกษาที่ไม่ซ้ำกัน ·
              เดโมเท่านั้น
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
