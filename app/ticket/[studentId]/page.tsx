import type { Metadata } from "next";
import { TicketLookup } from "@/components/ticket-lookup";
export const metadata: Metadata = {
  title: "บัตรของคุณ | The Haunted House",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function TicketPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <TicketLookup key={studentId} studentId={studentId} />;
}
