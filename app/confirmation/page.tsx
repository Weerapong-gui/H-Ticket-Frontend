"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Progress } from "@/components/summary";
import { EventFacts } from "@/components/event-facts";
import { IndividualDemoTicket } from "@/components/individual-demo-ticket";
import { useDemoBooking } from "@/components/demo-booking-provider";
import { demoTotal } from "@/lib/demo-booking";
import { money } from "@/lib/booking";
export default function Confirmation() {
  const { completed: booking, startNewBooking, clearDemo } = useDemoBooking();
  const router = useRouter();
  if (!booking)
    return (
      <main className="empty-page">
        <h1>ยังไม่มีการจองเดโม</h1>
        <p>
          เลือกจำนวนบัตรและกรอกข้อมูลนักศึกษาแยกแต่ละใบ
          ข้อมูลจะถูกล้างเมื่อรีเฟรชหรือปิดหน้าเว็บ
        </p>
        <Link className="button" href="/booking">
          เริ่มจองเดโม <ArrowRight size={17} />
        </Link>
      </main>
    );
  return (
    <main className="booking-main confirmation">
      <Progress step={3} />
      <div className="confirmation-icon">
        <Check size={29} />
      </div>
      <p className="eyebrow">INDIVIDUAL DEMO TICKETS CREATED</p>
      <h1>
        The house <em>knows your names.</em>
      </h1>
      <p>
        แต่ละรหัสได้รับบัตรเดโมแยกกัน ไม่มีการชำระเงินหรือออกบัตรเข้างานจริง
      </p>
      <section className="multi-booking-summary" aria-label="สรุปการจอง">
        <dl>
          <EventFacts />
          <div>
            <dt>เลขอ้างอิงการจอง</dt>
            <dd className="reference">{booking.reference}</dd>
          </div>
          <div>
            <dt>จำนวนบัตร</dt>
            <dd>
              {booking.quantity} ใบ / {booking.quantity} รหัสนักศึกษา
            </dd>
          </div>
          <div>
            <dt>ยอดรวมเดโม</dt>
            <dd>{money(demoTotal(booking.quantity))}</dd>
          </div>
        </dl>
      </section>
      <div className="individual-tickets">
        {booking.tickets.map((ticket, index) => (
          <IndividualDemoTicket key={ticket.id} ticket={ticket} index={index} />
        ))}
      </div>
      <p className="confirmation-retention">
        รหัสที่ยืนยันแล้วจะจองเดโมซ้ำในแท็บนี้ไม่ได้
        ข้อมูลไม่ถูกบันทึกถาวรและจะล้างเมื่อปิดหรือรีเฟรชหน้าเว็บ
      </p>
      <div className="confirmation-actions">
        <Link className="button" href="/">
          กลับหน้าแรก <ArrowRight size={17} />
        </Link>
        <button
          className="button outline"
          onClick={() => {
            startNewBooking();
            router.push("/booking");
          }}
        >
          เริ่มการจองเดโมใหม่
        </button>
        <button
          className="text-link"
          onClick={() => {
            clearDemo();
            router.replace("/booking");
          }}
        >
          ล้างข้อมูลเดโมทั้งหมด
        </button>
      </div>
    </main>
  );
}
