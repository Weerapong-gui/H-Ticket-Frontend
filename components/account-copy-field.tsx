"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { Check, Copy } from "lucide-react";

const COPY_FEEDBACK_MS = 2000;

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  // fallback สำหรับเบราว์เซอร์ที่ไม่มี clipboard API (เช่นเปิดผ่าน http)
  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "true");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/** แสดงเลขบัญชีตัวใหญ่ + ปุ่มคัดลอก (คัดลอกเฉพาะตัวเลข ไม่มีขีด/เว้นวรรค) */
export function AccountCopyField({ accountNumber }: { accountNumber: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await copyText(accountNumber.replace(/\D/g, ""));
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }

  return (
    <div className="account-copy">
      <span className="account-copy-number">{accountNumber}</span>
      <button
        type="button"
        onClick={handleCopy}
        className={
          copied ? "account-copy-button copied" : "account-copy-button"
        }
        aria-label={t.payment.copyAria}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        <span>{copied ? t.payment.copied : t.payment.copy}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? t.payment.copiedSr : ""}
      </span>
    </div>
  );
}
