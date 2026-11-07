"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, Minus } from "lucide-react";
const questions = [
  [
    "How long does the experience last?",
    "Allow approximately 45–60 minutes for all three chapters, plus check-in time. วัน เวลา และรายละเอียดการเข้าชมจะยืนยันโดยผู้จัดงาน",
  ],
  [
    "Is there an age restriction?",
    "The experience is designed for ages 16 and above. Visitors under 18 should be accompanied by an adult.",
  ],
  [
    "Is the experience suitable for everyone?",
    "The story includes darkness, confined spaces, theatrical effects and sudden sounds. It may be unsuitable for guests sensitive to these effects. Contact us to discuss accessibility before planning a visit.",
  ],
  [
    "Can I change or cancel my booking?",
    "1 รหัสนักศึกษาซื้อได้ 1 ใบ เมื่อออกเลขบัตรแล้วแก้ไขเองไม่ได้ หากกรอกข้อมูลผิดหรือมีปัญหาเรื่องสลิป กรุณาติดต่อทีมงาน",
  ],
  [
    "Do I need to print my ticket?",
    "ไม่ต้องพิมพ์ เปิดหน้าบัตรของคุณ (ค้นด้วยรหัสนักศึกษา) แล้วแสดงกับทีมงานเพื่อแลกบัตรกระดาษเลขเดียวกัน เลขบัตรคือลำดับคิวเข้าบ้านผีสิง",
  ],
];
export function Faq() {
  const [active, setActive] = useState<number | null>(0);
  const reduced = useReducedMotion();
  return (
    <div className="faq-list">
      {questions.map(([q, a], i) => (
        <div className="faq-item" key={q}>
          <h3>
            <button
              aria-expanded={active === i}
              aria-controls={`answer-${i}`}
              onClick={() => setActive(active === i ? null : i)}
            >
              {q}
              {active === i ? <Minus size={18} /> : <Plus size={18} />}
            </button>
          </h3>
          <AnimatePresence initial={false}>
            {active === i && (
              <motion.div
                id={`answer-${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                <p>{a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
