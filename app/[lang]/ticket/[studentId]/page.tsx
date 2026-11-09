import type { Metadata } from "next";
import { DICTS, isLang } from "@/lib/i18n/dict";
import { TicketLookup } from "@/components/ticket-lookup";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: DICTS[isLang(lang) ? lang : "th"].meta.yourTicket,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
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
