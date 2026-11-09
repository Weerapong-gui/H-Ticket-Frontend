"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowUpRight, Ghost } from "lucide-react";
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
    <Link href="/" className="brand">
      <Ghost size={27} />
      <span>
        THE HAUNTED<span>HOUSE</span>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <Brand />
      <nav className={open ? "nav open" : "nav"} aria-label="เมนูหลัก">
        {[
          ["หน้าแรก", "/"],
          ["บัตรคงเหลือ", "/#attraction"],
          ["บัตร", "/#tickets"],
          ["ค้นบัตร", "/ticket"],
        ].map(([label, url]) => (
          <Link onClick={() => setOpen(false)} key={label} href={url}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="button header-cta" href="/booking">
        จองบัตร <ArrowUpRight size={15} />
      </Link>
      <button
        className="menu-toggle"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
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

export function Footer() {
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
          v{process.env.NEXT_PUBLIC_APP_VERSION} · อัปเดต{" "}
          {process.env.NEXT_PUBLIC_BUILD_TIME}
        </span>
        <div>
          <Link href="/#attraction">บัตรคงเหลือ</Link>
          <Link href="/ticket">ค้นบัตร</Link>
          <Link href="/admin/login">ทีมงาน</Link>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram องค์การนักศึกษา มฟล."
          >
            <Instagram size={17} />
          </a>
          <a
            href={SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook องค์การนักศึกษา มฟล."
          >
            <Facebook size={17} />
          </a>
        </div>
      </div>
    </footer>
  );
}
