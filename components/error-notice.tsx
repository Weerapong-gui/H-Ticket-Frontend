"use client";
import Link from "next/link";
import { ApiError, errorMessage } from "@/lib/api";
export function ErrorNotice({
  error,
  studentId,
}: {
  error: unknown;
  studentId?: string;
}) {
  if (!error) return null;
  const data = error instanceof ApiError ? error.data : null;
  return (
    <div className="error-notice" role="alert">
      <p>{errorMessage(error)}</p>
      {data?.contact && (
        <p>
          ติดต่อทีมงาน:{" "}
          {typeof data.contact === "string"
            ? data.contact
            : Object.entries(data.contact)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" · ")}
        </p>
      )}
      {data?.code === "already_has_ticket" && (
        <>
          <p>
            เลขบัตรเดิม: <strong>{data.ticket_label}</strong>
          </p>
          <Link
            className="text-link"
            href={
              studentId
                ? `/ticket/${encodeURIComponent(studentId.trim())}`
                : "/ticket"
            }
          >
            ดูบัตรของฉัน →
          </Link>
        </>
      )}
      {(data?.code === "network" || data?.code === "invalid_response") && (
        <Link className="text-link" href="/ticket">
          ค้นบัตรด้วยรหัสนักศึกษา →
        </Link>
      )}
    </div>
  );
}
