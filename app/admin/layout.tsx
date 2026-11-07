import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
export const metadata: Metadata = {
  title: "Staff | The Haunted House",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
