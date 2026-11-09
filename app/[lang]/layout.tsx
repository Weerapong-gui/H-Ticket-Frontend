import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTS, LANGS, isLang } from "@/lib/i18n/dict";
import { HtmlLang } from "@/components/i18n-bits";
import { SiteChrome } from "@/components/site-chrome";
import { LangProvider } from "@/lib/i18n/client";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = DICTS[lang];
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { th: "/th", en: "/en" } },
  };
}

/** หน้าที่คนซื้อเห็นทั้งหมดอยู่ใต้ /th หรือ /en (แอดมินอยู่นอกนี้ เป็นไทยอย่างเดียว) */
export default async function LangLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <LangProvider lang={lang}>
      <HtmlLang lang={lang} />
      <SiteChrome>{children}</SiteChrome>
    </LangProvider>
  );
}
