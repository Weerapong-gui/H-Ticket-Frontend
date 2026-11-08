"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { numberRanges, salesMessage } from "@/lib/booking";
import { useAdminData } from "@/components/use-admin-data";
import { ErrorNotice } from "@/components/error-notice";
import { ActionDialog } from "@/components/admin-dialogs";
export default function Dashboard() {
  const { data, loading, error, refresh } = useAdminData(api.stats);
  const [actionError, setActionError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  return (
    <>
      <div className="admin-section-heading">
        <h2>ภาพรวมการขาย</h2>
        <button
          className="text-link"
          disabled={loading || pending}
          onClick={() => void refresh()}
        >
          อัปเดตข้อมูล →
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
              <p>ปิด Pre-sale ถาวรแล้ว ไม่สามารถเปิดใหม่ได้</p>
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
                  ปิด Pre-sale ถาวร
                </button>
              </div>
            )}
          </section>
          <section className="admin-panel">
            <h2>เลขบัตรกระดาษที่ยังขายได้</h2>
            <p>สำหรับทีมขายหน้างาน · อัปเดตข้อมูลก่อนใช้เลขบัตร</p>
            <p className="free-numbers">
              {numberRanges(data.free_numbers) || "ไม่มีเลขว่าง"}
            </p>
          </section>
        </>
      )}
      {closeDialog && (
        <ActionDialog
          title="ปิด Pre-sale ถาวร"
          description="การกระทำนี้ย้อนกลับไม่ได้ หลังปิดแล้วผู้ซื้อจะต้องซื้อที่หน้างาน"
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
