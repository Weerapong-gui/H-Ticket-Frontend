"use client";
import { useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScare } from "./scare-provider";

/** หน้าประตู: ขึ้นครั้งแรกที่เข้าเว็บ การแตะปุ่มทำให้เบราว์เซอร์ยอมเล่นเสียง */
export function EntryGate() {
  const { entered, enter, reducedMotion } = useScare();
  const titleId = useId();
  return (
    <AnimatePresence>
      {entered === false && (
        <motion.div
          className="entry-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8 }}
        >
          <p className="entry-gate-title" id={titleId}>
            THE HAUNTED HOUSE
          </p>
          <p className="entry-gate-line">
            บ้านหลังนี้มีเสียง ใส่หูฟังจะดีที่สุด
          </p>
          <button
            type="button"
            className="button"
            autoFocus
            onClick={() => enter(true)}
          >
            เข้าบ้าน (มีเสียง)
          </button>
          <button
            type="button"
            className="text-link entry-gate-quiet"
            onClick={() => enter(false)}
          >
            เข้าแบบไม่มีเสียง
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
