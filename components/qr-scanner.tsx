"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const SCAN_EVERY_MS = 150;
const MAX_SIDE = 640;

function cameraError(e: unknown): string {
  if (e instanceof DOMException && e.name === "NotAllowedError")
    return 'ไม่ได้รับสิทธิ์ใช้กล้อง อนุญาตกล้องในการตั้งค่าเบราว์เซอร์ หรือใช้ "พิมพ์ค้นหาแทน"';
  return 'เปิดกล้องไม่ได้ ลองใช้ "พิมพ์ค้นหาแทน"';
}

/** กล้องหลัง + ถอด QR ด้วย jsQR (iOS Safari ไม่มี BarcodeDetector) */
export function QrScanner({
  paused,
  onScan,
}: {
  paused: boolean;
  onScan(text: string): void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  // เก็บค่าล่าสุดไว้ใน ref เพื่อไม่ต้องปิด-เปิดกล้องใหม่ทุกครั้งที่ props เปลี่ยน
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    pausedRef.current = paused;
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const v = video.current;
      if (stopped) return;
      if (v && ctx && !pausedRef.current && v.readyState >= 2 && v.videoWidth) {
        const scale = Math.min(
          1,
          MAX_SIDE / Math.max(v.videoWidth, v.videoHeight),
        );
        const w = Math.round(v.videoWidth * scale);
        const h = Math.round(v.videoHeight * scale);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(v, 0, 0, w, h);
        const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data && !pausedRef.current) onScanRef.current(code.data);
      }
      timer = window.setTimeout(tick, SCAN_EVERY_MS);
    };

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setError("กล้องใช้ได้เฉพาะเว็บที่เปิดผ่าน HTTPS"));
    } else {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        .then((s) => {
          if (stopped) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          const v = video.current;
          if (v) {
            v.srcObject = s;
            void v.play().catch(() => {});
          }
          tick();
        })
        .catch((e: unknown) => {
          if (!stopped) setError(cameraError(e));
        });
    }
    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="qr-scanner">
      {error ? (
        <p className="qr-scanner-error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <video ref={video} playsInline muted autoPlay />
          <div className="qr-scanner-aim" aria-hidden="true" />
          <p className="qr-scanner-tip">ส่อง QR บนหน้าบัตร</p>
        </>
      )}
    </div>
  );
}
