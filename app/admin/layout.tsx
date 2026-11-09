import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { SiteChrome } from "@/components/site-chrome";
export const metadata: Metadata = {
  title: "ทีมงาน | The Haunted House",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteChrome>
      <AdminShell>{children}</AdminShell>
    </SiteChrome>
  );
}
