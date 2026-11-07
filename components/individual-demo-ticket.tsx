"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import {
  demoQrPayload,
  DemoTicket,
  maskPhone,
  maskStudentId,
} from "@/lib/demo-booking";
export function IndividualDemoTicket({
  ticket,
  index,
}: {
  ticket: DemoTicket;
  index: number;
}) {
  const [qr, setQr] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(demoQrPayload(ticket.id), {
      width: 240,
      margin: 2,
      color: { dark: "#171010", light: "#f2e9dd" },
    })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [ticket.id]);
  return (
    <article
      className="individual-ticket"
      aria-labelledby={`issued-student-${index}`}
    >
      <div className="individual-ticket-info">
        <p className="eyebrow">EARLY BIRD / DEMO TICKET {index + 1}</p>
        <h2 id={`issued-student-${index}`}>{ticket.fullName}</h2>
        <dl>
          <div>
            <dt>รหัสนักศึกษา</dt>
            <dd>{maskStudentId(ticket.studentId)}</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์</dt>
            <dd>{maskPhone(ticket.phone)}</dd>
          </div>
          <div>
            <dt>Ticket ID</dt>
            <dd className="reference">{ticket.id}</dd>
          </div>
          <div>
            <dt>จำนวน</dt>
            <dd>1 ใบ</dd>
          </div>
        </dl>
      </div>
      <div className="qr-panel">
        {qr ? (
          <Image
            src={qr}
            alt={`QR เดโมสำหรับบัตรใบที่ ${index + 1} ไม่ใช่บัตรเข้างาน`}
            width={190}
            height={190}
            unoptimized
          />
        ) : (
          <p>{failed ? "สร้าง QR เดโมไม่สำเร็จ" : "กำลังสร้าง QR เดโม…"}</p>
        )}
        <strong>DEMO</strong>
        <span>NOT VALID FOR ENTRY</span>
        <p>
          QR มีเฉพาะ Ticket ID แบบสุ่ม
          <br />
          ไม่มีรหัสนักศึกษาหรือเบอร์โทร
        </p>
      </div>
    </article>
  );
}
