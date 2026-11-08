"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw } from "lucide-react";
import { api, ApiError, IssuedTicket } from "@/lib/api";
import { validStudentId } from "@/lib/booking";
import { ErrorNotice } from "./error-notice";
import { EventFacts } from "./event-facts";
export function TicketLookup({
  studentId = "",
  justIssued = false,
}: {
  studentId?: string;
  justIssued?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(studentId);
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [loading, setLoading] = useState(!!studentId);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      setTicket(null);
    });
    if (!validStudentId(studentId)) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return;
        setError(new Error("รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก"));
        setLoading(false);
      });
      return () => controller.abort();
    }
    api
      .ticket(studentId, controller.signal)
      .then((t) => {
        if (!controller.signal.aborted) setTicket(t);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof ApiError && e.data.code === "not_found"
              ? new Error("ไม่พบบัตรของรหัสนี้")
              : e,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [studentId, revision]);
  return (
    <main className="booking-main ticket-lookup">
      <div className="page-heading">
        <p className="eyebrow">ค้นบัตร</p>
        <h1>
          ค้นหา<em>บัตรของคุณ</em>
        </h1>
        <p>กรอกรหัสนักศึกษาเพื่อดูเลขบัตรและสถานะการรับบัตรกระดาษ</p>
      </div>
      <form
        className="lookup-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validStudentId(query)) {
            setError(new Error("รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก"));
            return;
          }
          if (query.trim() === studentId) setRevision((r) => r + 1);
          else router.push(`/ticket/${query.trim()}`);
        }}
      >
        <label>
          รหัสนักศึกษา
          <input
            required
            inputMode="numeric"
            autoComplete="off"
            pattern="\s*[0-9]{10}\s*"
            maxLength={20}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ตัวเลข 10 หลัก"
          />
        </label>
        <button type="submit" className="button" disabled={loading}>
          <Search size={17} />
          ค้นบัตร
        </button>
      </form>
      <p className="privacy-note">
        ผู้ที่ทราบรหัสนักศึกษาสามารถดูชื่อและเลขบัตรได้
        โปรดเก็บลิงก์บัตรไว้กับตัว
      </p>
      {loading && <p role="status">กำลังค้นหาบัตร…</p>}
      <ErrorNotice error={error} />
      {ticket && !loading && (
        <section className="issued-ticket" aria-label="บัตรจากระบบ">
          {justIssued && (
            <p className="success-banner" role="status">
              ออกบัตรสำเร็จ! บันทึกหน้านี้ไว้ (บุ๊กมาร์กหรือแคปหน้าจอ)
              ใช้แลกบัตรจริงหน้างาน
            </p>
          )}
          <p className="eyebrow">THE HAUNTED HOUSE · บัตรล่วงหน้า</p>
          <p>เลขบัตร / ลำดับคิว</p>
          <strong className="ticket-number">{ticket.ticket_label}</strong>
          <h2>{ticket.name}</h2>
          <p>รหัสนักศึกษา {ticket.student_id}</p>
          <div
            className={
              ticket.picked_up ? "pickup-status picked" : "pickup-status"
            }
          >
            {ticket.picked_up ? "รับบัตรกระดาษแล้ว" : "ยังไม่รับบัตรกระดาษ"}
          </div>
          <p className="ticket-instructions">
            แสดงหน้าจอนี้กับทีมงานเพื่อแลกบัตรกระดาษ
            เลขบัตรนี้ตรงกับบัตรจริงและลำดับคิวของคุณ
          </p>
          <dl className="issued-event">
            <EventFacts />
          </dl>
          <button
            className="text-link"
            onClick={() => setRevision((r) => r + 1)}
          >
            <RefreshCw size={15} />
            อัปเดตสถานะบัตร
          </button>
        </section>
      )}
      <Link className="text-link" href="/booking">
        ← กลับหน้าซื้อบัตร
      </Link>
    </main>
  );
}
