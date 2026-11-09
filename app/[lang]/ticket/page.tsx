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
    title: DICTS[isLang(lang) ? lang : "th"].meta.ticketSearch,
    robots: { index: false, follow: false },
  };
}
export default function TicketSearch() {
  return <TicketLookup />;
}
