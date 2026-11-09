"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RefreshCw } from "lucide-react";
import { api, ApiError, IssuedTicket } from "@/lib/api";
import { validStudentId } from "@/lib/booking";
import { ErrorNotice } from "./error-notice";
import { EventFacts } from "./event-facts";
import { TicketQr } from "./ticket-qr";
import { TicketArt } from "./ticket-art";
import { useHref, useT } from "@/lib/i18n/client";
export function TicketLookup({
  studentId = "",
  justIssued = false,
}: {
  studentId?: string;
  justIssued?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const href = useHref();
  const [query, setQuery] = useState(studentId);
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [loading, setLoading] = useState(!!studentId);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      setTicket(null);
    });
    if (!validStudentId(studentId)) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return;
        setError(new Error(t.common.studentIdDigits));
        setLoading(false);
      });
      return () => controller.abort();
    }
    api
      .ticket(studentId, controller.signal)
      .then((t) => {
        if (!controller.signal.aborted) setTicket(t);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof ApiError && e.data.code === "not_found"
              ? new Error(t.lookup.notFound)
              : e,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [studentId, revision, t]);
  return (
    <main className="booking-main ticket-lookup">
      <div className="page-heading">
        <h1>{t.lookup.title}</h1>
        <p>{t.lookup.lead}</p>
      </div>
      <form
        className="lookup-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validStudentId(query)) {
            setError(new Error(t.common.studentIdDigits));
            return;
          }
          if (query.trim() === studentId) setRevision((r) => r + 1);
          else router.push(href(`/ticket/${query.trim()}`));
        }}
      >
        <label>
          {t.common.studentId}
          <input
            required
            inputMode="numeric"
            autoComplete="off"
            pattern="\s*[0-9]{10}\s*"
            maxLength={20}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.tenDigits}
          />
        </label>
        <button type="submit" className="button" disabled={loading}>
          <Search size={17} />
          {t.lookup.search}
        </button>
      </form>
      <p className="privacy-note">{t.lookup.privacy}</p>
      {loading && <p role="status">{t.lookup.searching}</p>}
      <ErrorNotice error={error} />
      {ticket && !loading && (
        <section className="issued-ticket" aria-label={t.lookup.aria}>
          {justIssued && (
            <p className="success-banner" role="status">
              {t.lookup.success}
            </p>
          )}
          <TicketArt blank priority />
          <TicketQr studentId={ticket.student_id} />
          <h2>{ticket.name}</h2>
          <p>
            {t.common.studentId} {ticket.student_id}
          </p>
          <div
            className={
              ticket.picked_up ? "pickup-status picked" : "pickup-status"
            }
          >
            {ticket.picked_up ? t.lookup.pickedUp : t.lookup.waiting}
          </div>
          {ticket.group && ticket.group.length > 1 && (
            <div className="group-tickets">
              <p>{t.lookup.group(ticket.group.length)}</p>
              <ul>
                {ticket.group.map((g, i) => (
                  <li key={i} className={g.name === ticket.name ? "self" : ""}>
                    <span>{g.name}</span>
                    <strong>
                      {g.picked_up
                        ? t.lookup.memberPicked
                        : t.lookup.memberWaiting}
                    </strong>
                  </li>
                ))}
              </ul>
              <p>{t.lookup.groupNote}</p>
            </div>
          )}
          <p className="ticket-instructions">{t.lookup.instructions}</p>
          <dl className="issued-event">
            <EventFacts />
          </dl>
          <button
            className="text-link"
            onClick={() => setRevision((r) => r + 1)}
          >
            <RefreshCw size={15} />
            {t.lookup.refresh}
          </button>
        </section>
      )}
      <Link className="text-link" href={href("/booking")}>
        {t.lookup.back}
      </Link>
    </main>
  );
}
