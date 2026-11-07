"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Summary, Progress } from "@/components/summary";
import { StudentFields } from "@/components/student-fields";
import { TicketAccordion } from "@/components/ticket-accordion";
import { useDemoBooking } from "@/components/demo-booking-provider";
import { maskPhone, maskStudentId, validateStudents } from "@/lib/demo-booking";
export default function Checkout() {
  const router = useRouter();
  const pathname = usePathname();
  const { students, updateStudent, complete, usedIds, revision } =
    useDemoBooking();
  const [submitted, setSubmitted] = useState(false);
  const [reviewedRevision, setReviewedRevision] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const guard = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validateStudents(students, usedIds);
  const reviewing = reviewedRevision === revision;
  useEffect(() => {
    if (pathname !== "/checkout") return;
    let active = true;
    guard.current = false;
    queueMicrotask(() => {
      if (active) {
        setPending(false);
        setReviewedRevision(null);
      }
    });
    return () => {
      active = false;
    };
  }, [pathname]);
  function focusFirstError() {
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
        ?.focus(),
    );
  }
  return (
    <main className="booking-main">
      <Progress step={2} />
      <div className="page-heading">
        <p className="eyebrow">ONE STUDENT ID = ONE TICKET</p>
        <h1>
          {reviewing ? (
            <>
              ตรวจสอบ<em>การจอง</em>
            </>
          ) : (
            <>
              Who’s <em>coming inside?</em>
            </>
          )}
        </h1>
        <p>กรอกข้อมูลนักศึกษาแยกทุกใบ แต่ละรหัสใช้ได้เพียง 1 ใบในงานนี้</p>
      </div>
      <div className="demo-scope-note">
        <ShieldCheck size={18} />
        <p>
          โหมดเดโม:
          ตรวจรหัสซ้ำในรายการและการจองเดโมที่ยืนยันแล้วในแท็บนี้เท่านั้น
          ยังไม่ได้ตรวจการจองจริงจากเซิร์ฟเวอร์
        </p>
      </div>
      <form
        ref={formRef}
        className="booking-grid student-checkout"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (guard.current) return;
          setSubmitted(true);
          setSubmitError("");
          if (errors.some((error) => Object.keys(error).length)) {
            setReviewedRevision(null);
            focusFirstError();
            return;
          }
          if (!reviewing) {
            setReviewedRevision(revision);
            return;
          }
          guard.current = true;
          setPending(true);
          try {
            complete();
            router.push("/confirmation");
          } catch {
            guard.current = false;
            setPending(false);
            setReviewedRevision(null);
            setSubmitError(
              "มีข้อมูลไม่ถูกต้องหรือรหัสที่จองแล้ว กรุณาตรวจสอบข้อมูลนักศึกษาทุกคน",
            );
            focusFirstError();
          }
        }}
      >
        <div className="booking-controls">
          <div className="checkout-quantity">
            <TicketAccordion />
          </div>
          {reviewing ? (
            <section
              className="student-review"
              aria-label="ตรวจสอบข้อมูลนักศึกษาทุกคน"
            >
              <div className="student-review-heading">
                <Check size={22} />
                <h2>ตรวจสอบผู้เข้าร่วม {students.length} คน</h2>
              </div>
              {students.map((student, index) => (
                <div key={index} className="student-review-person">
                  <h3>นักศึกษาคนที่ {index + 1} / บัตร 1 ใบ</h3>
                  <dl>
                    <div>
                      <dt>ชื่อ-นามสกุล</dt>
                      <dd>{student.fullName.trim()}</dd>
                    </div>
                    <div>
                      <dt>รหัสนักศึกษา</dt>
                      <dd>{maskStudentId(student.studentId)}</dd>
                    </div>
                    <div>
                      <dt>เบอร์โทรศัพท์</dt>
                      <dd>{maskPhone(student.phone)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
              <p>แต่ละคนจะได้รับ Ticket ID และ QR เดโมคนละรายการ</p>
              <button
                type="button"
                className="text-link"
                disabled={pending}
                onClick={() => setReviewedRevision(null)}
              >
                ← กลับไปแก้ไขข้อมูล
              </button>
            </section>
          ) : (
            <div className="student-entries">
              {students.map((student, index) => (
                <StudentFields
                  key={index}
                  index={index}
                  student={student}
                  errors={errors[index]}
                  submitted={submitted}
                  onChange={(patch) => updateStudent(index, patch)}
                />
              ))}
            </div>
          )}
          <div className="student-privacy">
            <ShieldCheck size={18} />
            <p>
              ข้อมูลส่วนตัวอยู่เฉพาะในแท็บนี้ ย้อนกลับมาแก้ไขได้
              ข้อมูลจะถูกล้างเมื่อรีเฟรชหรือปิดหน้าเว็บ
              การยืนยันเดโมไม่ใช่การชำระเงินและใช้เข้างานไม่ได้
            </p>
          </div>
          <Link className="text-link" href="/booking">
            ← กลับไปเลือกจำนวนบัตร
          </Link>
        </div>
        <Summary>
          {submitError && (
            <p role="alert" className="field-error">
              {submitError}
            </p>
          )}
          <button type="submit" className="button" disabled={pending}>
            {pending
              ? "กำลังสร้างบัตรเดโม…"
              : reviewing
                ? "Confirm Demo Booking"
                : "ตรวจรหัสและทบทวนการจอง"}
            <ArrowRight size={16} />
          </button>
          <p className="selection-hint">
            1 รหัสนักศึกษา = 1 ใบ · DEMO / NOT VALID FOR ENTRY
          </p>
        </Summary>
      </form>
    </main>
  );
}
