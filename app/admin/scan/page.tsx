"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { thaiTime } from "@/lib/booking";
import {
  acceptScan,
  confirmPickup,
  lookupPickup,
  parseScan,
  type ConfirmResult,
  type LastScan,
  type PickupResult,
} from "@/lib/pickup";
import { ErrorNotice } from "@/components/error-notice";
import { QrScanner } from "@/components/qr-scanner";

type CardResult = PickupResult | Exclude<ConfirmResult, { kind: "done" }>;
type View =
  | { step: "scanning" }
  | { step: "looking"; id: string }
  | { step: "card"; id: string; result: CardResult }
  | { step: "confirming"; id: string; result: CardResult }
  | { step: "done"; label: string };

const DONE_MS = 1_500;
/** ขั้นที่ล้มเหลว เก็บเป็นข้อมูล แล้วปุ่ม "ลองใหม่" เรียกซ้ำตอนกด */
type Retry =
  | { kind: "lookup"; id: string }
  | { kind: "confirm"; id: string; result: CardResult };

export default function ScanPage() {
  const [view, setView] = useState<View>({ step: "scanning" });
  const [error, setError] = useState<{
    error: unknown;
    retry: Retry;
  } | null>(null);
  const [manual, setManual] = useState(false);
  const [typed, setTyped] = useState("");
  const lastScan = useRef<LastScan>(null);
  const doneTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (doneTimer.current !== null) window.clearTimeout(doneTimer.current);
    },
    [],
  );

  /** ยกเลิกตัวจับเวลาของป้าย "แจกบัตรแล้ว" — ไม่ให้มาลบการ์ดของคนถัดไปที่เริ่มค้นแล้ว */
  const clearDone = () => {
    if (doneTimer.current !== null) window.clearTimeout(doneTimer.current);
    doneTimer.current = null;
  };

  const backToScanning = useCallback(() => {
    clearDone();
    // นับช่วงกันอ่านซ้ำจากตอนกลับมาสแกน ไม่ใช่ตอนสแกน: QR เดิมอาจยังค้างหน้ากล้องหลังกดยืนยัน
    if (lastScan.current)
      lastScan.current = { ...lastScan.current, at: Date.now() };
    setError(null);
    setView({ step: "scanning" });
  }, []);

  const lookup = useCallback((id: string) => {
    clearDone();
    setError(null);
    setView({ step: "looking", id });
    lookupPickup(id, api)
      .then((result) => setView({ step: "card", id, result }))
      .catch((e: unknown) =>
        setError({ error: e, retry: { kind: "lookup", id } }),
      );
  }, []);

  const start = useCallback(
    (raw: string) => {
      const id = parseScan(raw);
      if (!id) {
        clearDone();
        setError(null);
        setView({ step: "card", id: raw, result: { kind: "not_found" } });
        return;
      }
      lookup(id);
    },
    [lookup],
  );

  const onScan = useCallback(
    (text: string) => {
      const now = Date.now();
      if (!acceptScan(text, now, lastScan.current)) return;
      lastScan.current = { text, at: now };
      start(text);
    },
    [start],
  );

  const confirm = useCallback(
    (id: string, result: CardResult, retryOf: string | null = null) => {
      clearDone();
      setError(null);
      setView({ step: "confirming", id, result });
      confirmPickup(id, api, retryOf)
        .then((r) => {
          if (r.kind !== "done") {
            setView({ step: "card", id, result: r });
            return;
          }
          setTyped("");
          setView({ step: "done", label: r.order.ticket_label });
          doneTimer.current = window.setTimeout(backToScanning, DONE_MS);
        })
        .catch((e: unknown) => {
          setView({ step: "card", id, result });
          setError({ error: e, retry: { kind: "confirm", id, result } });
        });
    },
    [backToScanning],
  );

  const result =
    view.step === "card" || view.step === "confirming" ? view.result : null;
  const busy =
    (view.step === "looking" && !error) || view.step === "confirming";

  return (
    <>
      <div className="admin-section-heading">
        <h2>สแกนแจกบัตร</h2>
        <button
          type="button"
          className="text-link"
          onClick={() => setManual((m) => !m)}
        >
          {manual ? "กลับไปใช้กล้อง" : "พิมพ์ค้นหาแทน"}
        </button>
      </div>

      {manual ? (
        <form
          className="admin-filters scan-manual"
          onSubmit={(e) => {
            e.preventDefault();
            start(typed);
          }}
        >
          <label>
            รหัสนักศึกษา
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={10}
              placeholder="ตัวเลข 10 หลัก"
            />
          </label>
          <button className="button" disabled={busy}>
            ค้นหา
          </button>
        </form>
      ) : (
        // ซ่อนกล้อง (แต่ไม่ปิด) ระหว่างแสดงผล การ์ดจะได้อยู่บนจอโดยไม่ต้องเลื่อน
        <div
          className={view.step === "scanning" ? undefined : "scan-collapsed"}
        >
          <QrScanner paused={view.step !== "scanning"} onScan={onScan} />
        </div>
      )}

      <div aria-live="polite">
        {view.step === "looking" && !error && (
          <p role="status">กำลังค้นหาบัตร…</p>
        )}
        {view.step === "done" && (
          <p className="scan-done" role="status">
            แจกบัตร {view.label} แล้ว
          </p>
        )}
      </div>

      {result && (
        <section
          className={`scan-card scan-card-${result.kind}`}
          aria-label="ผลการสแกน"
        >
          {result.kind === "ready" && (
            <>
              <p className="scan-card-tag">ยังไม่รับบัตร</p>
              <strong className="scan-card-number">
                {result.order.ticket_label}
              </strong>
              <h3>{result.order.name}</h3>
              <p>รหัส {result.order.student_id}</p>
              <button
                type="button"
                className="button scan-confirm"
                disabled={busy}
                onClick={() => view.step === "card" && confirm(view.id, result)}
              >
                {view.step === "confirming"
                  ? "กำลังบันทึก…"
                  : `ยืนยันแจกบัตร ${result.order.ticket_label}`}
              </button>
            </>
          )}
          {result.kind === "picked" && (
            <>
              <p className="scan-card-tag">
                รับบัตรไปแล้ว{" "}
                {result.order.picked_up_at
                  ? thaiTime(result.order.picked_up_at)
                  : ""}
              </p>
              <strong className="scan-card-number">
                {result.order.ticket_label}
              </strong>
              <h3>{result.order.name}</h3>
            </>
          )}
          {result.kind === "cancelled" && (
            <>
              <p className="scan-card-tag">บัตรถูกยกเลิก</p>
              <p>เหตุผล: {result.order.cancel_reason ?? "-"}</p>
              <h3>{result.order.name}</h3>
            </>
          )}
          {result.kind === "not_found" && (
            <p className="scan-card-tag">ไม่พบบัตรของ QR นี้</p>
          )}
          <button
            type="button"
            className="button outline scan-again"
            disabled={view.step === "confirming"}
            onClick={backToScanning}
          >
            ไม่ใช่คนนี้ / สแกนใหม่
          </button>
        </section>
      )}

      {error && (
        <div className="scan-error">
          <ErrorNotice error={error.error} />
          <button
            type="button"
            className="button"
            onClick={() =>
              error.retry.kind === "lookup"
                ? lookup(error.retry.id)
                : confirm(
                    error.retry.id,
                    error.retry.result,
                    // ครั้งก่อนอาจบันทึกสำเร็จแต่คำตอบหาย ให้ confirmPickup รู้ว่าเป็นบัตรใบไหน
                    error.retry.result.kind === "ready"
                      ? error.retry.result.order.id
                      : null,
                  )
            }
          >
            ลองใหม่
          </button>
          {!result && (
            <button
              type="button"
              className="button outline"
              onClick={backToScanning}
            >
              สแกนใหม่
            </button>
          )}
        </div>
      )}
    </>
  );
}
