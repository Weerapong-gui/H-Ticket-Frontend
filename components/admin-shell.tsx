"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminToken, getAdminToken } from "@/lib/api";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (path === "/admin/login") return;
    queueMicrotask(() => {
      const token = getAdminToken();
      setAllowed(!!token);
      if (!token) router.replace("/admin/login");
    });
  }, [path, router]);
  if (path === "/admin/login") return children;
  if (!allowed)
    return <main className="booking-main">กำลังตรวจสอบสิทธิ์…</main>;
  return (
    <main className="admin-main">
      <div className="admin-heading">
        <h1>ระบบทีมงาน · บ้านผีสิง</h1>
        <button
          className="text-link"
          onClick={() => {
            clearAdminToken();
            setAllowed(false);
            router.replace("/admin/login");
          }}
        >
          ออกจากระบบ
        </button>
      </div>
      <nav className="admin-nav" aria-label="เมนูแอดมิน">
        {[
          ["/admin", "ภาพรวม"],
          ["/admin/scan", "สแกนแจกบัตร"],
          ["/admin/orders", "รายชื่อผู้ซื้อ"],
          ["/admin/rejected", "รายการที่ถูกปฏิเสธ"],
        ].map(([url, label]) => (
          <Link
            key={url}
            href={url}
            aria-current={path === url ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
