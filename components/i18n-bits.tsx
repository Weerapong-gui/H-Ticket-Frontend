"use client";
import { useEffect } from "react";
import type { Lang } from "@/lib/i18n/dict";
import { useT } from "@/lib/i18n/client";

/** <html lang> ตามภาษาของหน้า (root layout อยู่นอก [lang] จึงตั้งที่นี่) */
export function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "th";
    };
  }, [lang]);
  return null;
}

export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      {useT().common.skip}
    </a>
  );
}

export function LoadingMain() {
  return <main className="booking-main">{useT().common.loading}</main>;
}
