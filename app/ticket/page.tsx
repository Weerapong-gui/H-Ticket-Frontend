import type { Metadata } from "next";
import { TicketLookup } from "@/components/ticket-lookup";
export const metadata: Metadata = {
  title: "ค้นบัตร | The Haunted House",
  robots: { index: false, follow: false },
};
export default function TicketSearch() {
  return <TicketLookup />;
}
