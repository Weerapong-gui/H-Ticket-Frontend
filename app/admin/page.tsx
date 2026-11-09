"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { salesMessage } from "@/lib/booking";
import { useAdminData } from "@/components/use-admin-data";
import { ErrorNotice } from "@/components/error-notice";
import { ActionDialog } from "@/components/admin-dialogs";
export default function Dashboard() {
  const { data, loading, error, refresh, update } = useAdminData(api.stats);
  const [actionError, setActionError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  /** null = ยังไม่ได้แก้ ใช้ค่าจากระบบ */
  const [totalDraft, setTotalDraft] = useState<string | null>(null);
  const [totalError, setTotalError] = useState<unknown>(null);
  const [totalSaved, setTotalSaved] = useState(false);
  return (
    <>
      <div className="admin-section-heading">
        <h2>ภาพรวมการขาย</h2>
        <button
          className="text-link"
          disabled={loading || pending}
          onClick={() => void refresh()}
        >
          อัปเดตข้อมูล
        </button>
      </div>
      <ErrorNotice error={error} />
      <ErrorNotice error={actionError} />
      {loading && !data && <p role="status">กำลังโหลดข้อมูล…</p>}
      {data && (
        <>
          <div className="stats-grid">
            {[
              ["บัตรทั้งหมด", data.total],
              ["ขายแล้ว", data.sold],
              ["คงเหลือ", data.remaining],
              ["ยกเลิก", data.cancelled],
              ["รับบัตรแล้ว", data.picked_up],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section className="admin-panel">
            <h2>สถานะการขาย</h2>
            <p>{salesMessage(data)}</p>
            {data.closed_forever ? (
              <p>ปิดขายออนไลน์ถาวรแล้ว เปิดใหม่ไม่ได้</p>
            ) : (
              <div className="action-buttons">
                <button
                  className="button"
                  disabled={pending || loading || !!error}
                  onClick={async () => {
                    if (pending) return;
                    setPending(true);
                    setActionError(null);
                    try {
                      await api.setSales(!data.open);
                      await refresh();
                    } catch (e) {
                      setActionError(e);
                      await refresh();
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  {pending
                    ? "กำลังอัปเดต…"
                    : data.open
                      ? "ปิดขายชั่วคราว"
                      : "เปิดขาย"}
                </button>
                <button
                  className="button outline"
                  disabled={pending || loading || !!error}
                  onClick={() => setCloseDialog(true)}
                >
                  ปิดขายออนไลน์ถาวร
                </button>
              </div>
            )}
          </section>
          <section className="admin-panel">
            <h2>จำนวนบัตรทั้งหมด</h2>
            <p>
              แก้แล้วมีผลทันทีทั้งหน้าเว็บและการรับจอง ตั้งน้อยกว่าที่ขายไปแล้ว
              ({data.sold} ใบ) ไม่ได้
            </p>
            <form
              className="admin-filters total-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (pending) return;
                const total = Number(totalDraft ?? data.total);
                setTotalSaved(false);
                if (!Number.isInteger(total) || total < 1 || total > 999) {
                  setTotalError(new Error("จำนวนบัตรต้องเป็นตัวเลข 1–999"));
                  return;
                }
                if (total < data.sold) {
                  setTotalError(
                    new Error(
                      `ขายไปแล้ว ${data.sold} ใบ ตั้งจำนวนบัตรน้อยกว่านี้ไม่ได้`,
                    ),
                  );
                  return;
                }
                setPending(true);
                setTotalError(null);
                try {
                  const next = await api.setTotal(total);
                  update(() => next);
                  setTotalDraft(null);
                  setTotalSaved(true);
                } catch (err) {
                  setTotalError(err);
                  await refresh();
                } finally {
                  setPending(false);
                }
              }}
            >
              <label>
                บัตรทั้งหมด (ใบ)
                <input
                  inputMode="numeric"
                  value={totalDraft ?? String(data.total)}
                  onChange={(e) => {
                    setTotalSaved(false);
                    setTotalDraft(
                      e.target.value.replace(/\D/g, "").slice(0, 3),
                    );
                  }}
                />
              </label>
              <button
                className="button"
                disabled={
                  pending ||
                  loading ||
                  totalDraft === null ||
                  totalDraft === String(data.total)
                }
              >
                {pending ? "กำลังบันทึก…" : "บันทึกจำนวนบัตร"}
              </button>
            </form>
            <ErrorNotice error={totalError} />
            {totalSaved && (
              <p role="status">บันทึกแล้ว · คงเหลือ {data.remaining} ใบ</p>
            )}
          </section>
          <section className="admin-panel">
            <h2>บัตรกระดาษที่ต้องเก็บไว้</h2>
            <p>
              คนจองออนไลน์ที่ยังไม่มารับบัตร
              ต้องกันบัตรกระดาษไว้ให้อย่างน้อยเท่านี้ ก่อนขายหน้างาน ·
              กดอัปเดตข้อมูลก่อนใช้ทุกครั้ง
            </p>
            <p className="reserved-count">{data.sold - data.picked_up} ใบ</p>
          </section>
        </>
      )}
      {closeDialog && (
        <ActionDialog
          title="ปิดขายออนไลน์ถาวร"
          description="ปิดแล้วเปิดคืนไม่ได้ หลังจากนี้ต้องซื้อบัตรที่หน้างานเท่านั้น"
          fieldLabel="พิมพ์ ปิดถาวร เพื่อยืนยัน"
          expected="ปิดถาวร"
          onCancel={() => setCloseDialog(false)}
          onConfirm={async () => {
            try {
              await api.closeForever();
            } finally {
              await refresh();
            }
          }}
        />
      )}
    </>
  );
}
