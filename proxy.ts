import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/i18n/dict";

/** เลือกภาษา: ที่เคยเลือกไว้ (cookie) → ภาษาเครื่องเป็นอังกฤษ → ไทย */
function pickLang(req: NextRequest): Lang {
  const saved = req.cookies.get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const first = req.headers.get("accept-language")?.split(",")[0]?.trim();
  return first?.toLowerCase().startsWith("en") ? "en" : DEFAULT_LANG;
}

/** หน้าเว็บที่ไม่มีภาษานำหน้า (รวมลิงก์บัตรเก่า /ticket/...) → /th/... หรือ /en/... */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if (isLang(first)) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLang(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // ไม่ยุ่งกับแอดมิน, API, ไฟล์ของ Next และไฟล์ที่มีนามสกุล (รูป, wasm, โมเดล ฯลฯ)
  matcher: ["/((?!_next|api|admin|healthz|.*\\..*).*)"],
};
