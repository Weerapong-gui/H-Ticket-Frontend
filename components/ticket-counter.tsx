"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { api, type SalesStatus } from "@/lib/api";
import { canOrder, salesMessage } from "@/lib/booking";

const POLL_MS = 30_000;
/** เหลือน้อยกว่านี้ (สัดส่วนของทั้งหมด) ขึ้น "ใกล้หมดแล้ว" */
const LOW_RATIO = 0.1;

/** ตัวนับบัตรคงเหลือบนหน้าแรก: นับขึ้นเมื่อเลื่อนมาเห็น ดึงใหม่ทุก 30 วินาที ลดลงเมื่อมีคนจองแล้วกระพริบแดง */
export function TicketCounter() {
  const [sales, setSales] = useState<SalesStatus | null>(null);
  const [shown, setShown] = useState(0);
  const reduced = useReducedMotion();
  const number = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { once: true, amount: 0.4 });
  const last = useRef<number | null>(null);

  useEffect(() => {
    let controller: AbortController | null = null;
    const load = () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      api
        .sales(controller.signal)
        .then(setSales)
        // พลาดรอบนี้ไม่เป็นไร รอบถัดไปลองใหม่ ตัวเลขเดิมยังแสดงอยู่
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
      controller?.abort();
    };
  }, []);

  const remaining = sales?.remaining ?? 0;
  useEffect(() => {
    if (!sales || reduced || !inView) return;
    const first = last.current === null;
    const from = last.current ?? 0;
    last.current = remaining;
    if (from === remaining) return;
    if (!first && remaining < from && number.current)
      animate(
        number.current,
        {
          color: ["#ff4b3a", "#e8ded2", "#ff4b3a", "#e8ded2"],
          textShadow: [
            "0 0 28px #ff2a1acc",
            "0 0 0px #0000",
            "0 0 22px #ff2a1a99",
            "0 0 0px #0000",
          ],
        },
        { duration: 0.9 },
      );
    const counting = animate(from, remaining, {
      duration: first ? 1.2 : 0.6,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => counting.stop();
  }, [sales, remaining, reduced, inView]);

  return <div ref={box}>{body()}</div>;

  function body() {
    if (!sales) return <div className="ticket-counter pending" aria-hidden />;
    if (!canOrder(sales))
      return (
        <div className="ticket-counter closed" role="status">
          <p className="ticket-counter-label">
            <span className="live-dot" /> {salesMessage(sales)}
          </p>
        </div>
      );

    const ratio = sales.total ? remaining / sales.total : 0;
    const low = ratio < LOW_RATIO;
    return (
      <div className={low ? "ticket-counter low" : "ticket-counter"}>
        <p className="ticket-counter-label">
          <span className="live-dot" /> บัตรล่วงหน้าคงเหลือ
          {low && <span className="ticket-counter-warn">ใกล้หมดแล้ว</span>}
        </p>
        <p className="ticket-counter-value">
          <span className="sr-only">
            เหลือ {remaining} จาก {sales.total} ใบ
          </span>
          <strong ref={number} aria-hidden="true">
            {reduced ? remaining : shown}
          </strong>
          <span aria-hidden="true">/ {sales.total} ใบ</span>
        </p>
        <div className="ticket-counter-bar" aria-hidden="true">
          <motion.span
            initial={{ scaleX: reduced ? ratio : 0 }}
            animate={{ scaleX: inView || reduced ? ratio : 0 }}
            transition={{ duration: reduced ? 0 : 1.2, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }
}
