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
          ["เกี่ยวกับงาน", "/#attraction"],
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
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <Brand />
        <p className="contact-demo">
          ติดต่อผู้จัดงาน
          <br />
          รอประกาศช่องทางติดต่อ
        </p>
      </div>
      <div className="footer-bottom">
        <span>© The Haunted House · บัตรล่วงหน้า</span>
        <div>
          <Link href="/#attraction">เกี่ยวกับงาน</Link>
          <Link href="/ticket">ค้นบัตร</Link>
          <Link href="/admin/login">ทีมงาน</Link>
          <span
            role="img"
            aria-label="Instagram — ยังไม่ประกาศบัญชี"
            title="Instagram · ยังไม่ประกาศบัญชี"
          >
            <Instagram size={17} />
          </span>
          <span
            role="img"
            aria-label="Facebook — ยังไม่ประกาศบัญชี"
            title="Facebook · ยังไม่ประกาศบัญชี"
          >
            <Facebook size={17} />
          </span>
        </div>
      </div>
    </footer>
  );
}
