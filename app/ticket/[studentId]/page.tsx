import type { Metadata } from "next";
import { TicketLookup } from "@/components/ticket-lookup";
export const metadata: Metadata = {
  title: "บัตรของคุณ | The Haunted House",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { studentId } = await params;
  const { new: justIssued } = await searchParams;
  return (
    <TicketLookup
      key={studentId}
      studentId={decodeURIComponent(studentId)}
      justIssued={justIssued === "1"}
    />
  );
}
