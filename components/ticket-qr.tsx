"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR บนหน้าบัตร เก็บแค่รหัสนักศึกษา ให้ทีมงานสแกนที่ /admin/scan */
export function TicketQr({ studentId }: { studentId: string }) {
  const [src, setSrc] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(studentId, {
      margin: 2,
      width: 440,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setSrc({ id: studentId, url });
      })
      .catch(() => {
        // สร้าง QR ไม่ได้ ทีมงานยังพิมพ์ค้นหาด้วยรหัสได้
      });
    return () => {
      active = false;
    };
  }, [studentId]);
  const url = src?.id === studentId ? src.url : null;
  return (
    <figure className="ticket-qr">
      <div className="ticket-qr-box">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL ที่สร้างในเครื่อง
          <img src={url} alt="QR สำหรับรับบัตร" width={220} height={220} />
        )}
      </div>
      <figcaption>ยื่น QR นี้ให้ทีมงานสแกนตอนรับบัตร</figcaption>
    </figure>
  );
}
