"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ArrowUpRight,
  Ghost,
  Globe,
  ChevronUp,
  Check,
} from "lucide-react";
import { LANGS, LANG_COOKIE, LANG_NAMES, swapLang } from "@/lib/i18n/dict";
import { useHasLang, useHref, useLang, useT } from "@/lib/i18n/client";
function Instagram({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
    </svg>
  );
}
function Facebook({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5c-1-.2-2-.3-3-.3-3 0-5 2-5 5V9H7v4h3v9z" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href={useHref()("/")} className="brand">
      <Ghost size={27} />
      <span>
        THE HAUNTED<span>HOUSE</span>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const href = useHref();
  return (
    <header className="header">
      <Brand />
      <nav className={open ? "nav open" : "nav"} aria-label={t.common.menu}>
        {[
          [t.common.home, "/"],
          [t.common.remaining, "/#attraction"],
          [t.common.tickets, "/#tickets"],
          [t.common.findTicket, "/ticket"],
        ].map(([label, url]) => (
          <Link onClick={() => setOpen(false)} key={label} href={href(url)}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="button header-cta" href={href("/booking")}>
        {t.common.book} <ArrowUpRight size={15} />
      </Link>
      <button
        className="menu-toggle"
        aria-label={open ? t.common.closeMenu : t.common.openMenu}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
const SOCIAL = {
  instagram: "https://www.instagram.com/su.mfu/",
  facebook: "https://www.facebook.com/mfu.su/",
};

/** จำภาษาที่เลือกไว้ 1 ปี (proxy ใช้ตอนเปิดลิงก์ที่ไม่มี /th /en) */
function rememberLang(to: string) {
  document.cookie = `${LANG_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`;
}

/** ปุ่มเลือกภาษาท้ายเว็บ: สลับแล้วอยู่หน้าเดิม และจำไว้ใน cookie ให้ครั้งหน้า */
function LanguageSwitcher() {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const hasLang = useHasLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && box.current?.contains(e.target as Node))
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  // หน้าแอดมินไม่มีภาษาอังกฤษ
  if (!hasLang) return null;
  const choose = (to: (typeof LANGS)[number]) => {
    setOpen(false);
    rememberLang(to);
    if (to !== lang)
      router.push(
        swapLang(window.location.pathname, to) +
          window.location.search +
          window.location.hash,
      );
  };
  return (
    <div className="lang-switch" ref={box}>
      {open && (
        <ul className="lang-menu" role="menu" aria-label={t.common.language}>
          {LANGS.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === lang}
                className={l === lang ? "active" : undefined}
                lang={l}
                onClick={() => choose(l)}
              >
                {LANG_NAMES[l]}
                {l === lang && <Check size={15} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="lang-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.common.language}: ${LANG_NAMES[lang]}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Globe size={17} aria-hidden="true" />
        {LANG_NAMES[lang]}
        <ChevronUp
          size={15}
          aria-hidden="true"
          className={open ? undefined : "lang-chevron-closed"}
        />
      </button>
    </div>
  );
}

export function Footer() {
  const t = useT();
  const href = useHref();
  return (
    <footer>
      <div className="footer-top">
        <Brand />
        <p className="footer-organizer">
          องค์การบริหาร องค์การนักศึกษา
          <br />
          มหาวิทยาลัยแม่ฟ้าหลวง X HLLC
        </p>
      </div>
      <div className="footer-bottom">
        <span className="app-version">
          v{process.env.NEXT_PUBLIC_APP_VERSION} · {t.common.updated}{" "}
          {process.env.NEXT_PUBLIC_BUILD_TIME}
        </span>
        <div>
          <LanguageSwitcher />
          <Link href={href("/#attraction")}>{t.common.remaining}</Link>
          <Link href={href("/ticket")}>{t.common.findTicket}</Link>
          <Link href="/admin/login">{t.common.staff}</Link>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.common.socialIg}
          >
            <Instagram size={17} />
          </a>
          <a
            href={SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.common.socialFb}
          >
            <Facebook size={17} />
          </a>
        </div>
      </div>
    </footer>
  );
}
