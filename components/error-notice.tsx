"use client";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { errorText } from "@/lib/i18n/errors";
import { useHref, useLang, useT } from "@/lib/i18n/client";
export function ErrorNotice({
  error,
  studentId,
}: {
  error: unknown;
  studentId?: string;
}) {
  const lang = useLang();
  const t = useT();
  const href = useHref();
  if (!error) return null;
  const data = error instanceof ApiError ? error.data : null;
  return (
    <div className="error-notice" role="alert">
      <p>{errorText(error, lang)}</p>
      {data?.contact && (
        <p>
          {t.errors.contact}{" "}
          {typeof data.contact === "string"
            ? data.contact
            : Object.entries(data.contact)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" · ")}
        </p>
      )}
      {data?.code === "already_has_ticket" && (
        <Link
          className="text-link"
          href={
            data.student_id || studentId
              ? href(
                  `/ticket/${encodeURIComponent((data.student_id || studentId)!.trim())}`,
                )
              : href("/ticket")
          }
        >
          {t.errors.myTicket}
        </Link>
      )}
      {(data?.code === "network" || data?.code === "invalid_response") && (
        <Link className="text-link" href={href("/ticket")}>
          {t.errors.findById}
        </Link>
      )}
    </div>
  );
}
