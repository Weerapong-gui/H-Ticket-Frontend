"use client";
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminToken, getAdminToken, subscribeAdminToken } from "@/lib/api";

const LOGIN = "/admin/login";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  // token อยู่ใน sessionStorage ฝั่ง server ไม่รู้ (null) — ฝั่ง client อ่านตรง ๆ และอัปเดตเมื่อ login/ออกจากระบบ/โดน 401
  const signedIn = useSyncExternalStore(
    subscribeAdminToken,
    () => !!getAdminToken(),
    () => null,
  );

  useEffect(() => {
    if (path !== LOGIN && signedIn === false) router.replace(LOGIN);
  }, [path, signedIn, router]);

  if (path === LOGIN) return children;
  // ยังไม่รู้ (ระหว่าง hydrate) หรือกำลังพาไปหน้า login: ไม่แสดงอะไร แทนข้อความ "กำลังตรวจสอบสิทธิ์…"
  if (!signedIn) return <main className="admin-main" />;
  return (
    <main className="admin-main">
      <div className="admin-heading">
        <h1>ระบบทีมงาน · บ้านผีสิง</h1>
        <button className="text-link" onClick={clearAdminToken}>
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
