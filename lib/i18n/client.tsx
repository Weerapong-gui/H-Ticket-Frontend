"use client";
import { createContext, useContext } from "react";
import { DEFAULT_LANG, DICTS, type Lang } from "./dict";

/**
 * ภาษาของหน้า ส่งลงมาจาก app/[lang]/layout (รู้ตั้งแต่ฝั่ง server ไม่ต้องอ่าน URL)
 * นอก /[lang] (หน้าแอดมิน) ไม่มี provider → ไทย
 */
const LangContext = createContext<Lang | null>(null);

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext) ?? DEFAULT_LANG;
}

/** อยู่ใต้ /th หรือ /en ไหม (หน้าแอดมินไม่มีปุ่มเลือกภาษา) */
export function useHasLang(): boolean {
  return useContext(LangContext) !== null;
}

export function useT() {
  return DICTS[useLang()];
}

/** ใส่ภาษานำหน้า path ภายในเว็บ: href("/booking") → "/en/booking" */
export function useHref() {
  const lang = useLang();
  return (path: string) => `/${lang}${path === "/" ? "" : path}`;
}
