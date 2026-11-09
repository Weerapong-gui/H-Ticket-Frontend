"use client";
import { useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScare } from "./scare-provider";
import { useT } from "@/lib/i18n/client";

/**
 * หน้าประตู: ขึ้นครั้งแรกที่เข้าเว็บ การแตะปุ่มทำให้เบราว์เซอร์ยอมเล่นเสียง
 * render ตั้งแต่ฝั่ง server (entered === null) เพื่อให้คนที่มาครั้งแรกเห็นประตูก่อนเนื้อหา
 * คนที่เคยเข้าแล้วถูกซ่อนด้วย CSS จาก ENTRY_GATE_SCRIPT (lib/scare/storage.ts) ก่อน paint จึงไม่เห็นจอดำแวบ
 */

export function EntryGate() {
  const { entered, enter, reducedMotion } = useScare();
  const titleId = useId();
  const t = useT();
  return (
    <AnimatePresence>
      {entered !== true && (
        <motion.div
          className="entry-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={false}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: reducedMotion ? 0 : 0.8 }}
        >
          <p className="entry-gate-title" id={titleId}>
            THE HAUNTED HOUSE
          </p>
          <p className="entry-gate-line">{t.gate.line}</p>
          <button
            type="button"
            className="button"
            autoFocus
            onClick={() => enter(true)}
          >
            {t.gate.enter}
          </button>
          <button
            type="button"
            className="text-link entry-gate-quiet"
            onClick={() => enter(false)}
          >
            {t.gate.quiet}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
