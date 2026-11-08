"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { api, Order } from "@/lib/api";
import { thaiTime } from "@/lib/booking";
import { replaceById } from "@/lib/pickup";
import { useAdminData } from "@/components/use-admin-data";
import { ErrorNotice } from "@/components/error-notice";
import { ActionDialog, SlipDialog } from "@/components/admin-dialogs";
export default function Orders() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({ query: "", status: "" });
  const loader = useCallback(
    () => api.orders(filters.query, filters.status),
    [filters],
  );
  const { data, loading, error, refresh, update } = useAdminData(loader);
  const [slip, setSlip] = useState<string | null>(null);
  const [cancel, setCancel] = useState<Order | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const guard = useRef(false);
  return (
    <>
      <div className="admin-section-heading">
        <h2>รายชื่อผู้ซื้อ</h2>
        <button
          className="text-link"
          disabled={loading || !!busy}
          onClick={() => void refresh()}
        >
          อัปเดตข้อมูล
        </button>
      </div>
      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ query, status });
        }}
      >
        <label>
          ค้นชื่อ รหัส เบอร์ หรือเลขบัตร
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="รหัสนักศึกษา หรือ 012"
          />
        </label>
        <label>
          สถานะ
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">ทั้งหมด</option>
            <option value="active">ใช้งานได้</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>
        </label>
        <button className="button" disabled={loading || !!busy}>
          ค้นหา
        </button>
      </form>
      <p className="privacy-note">
        วันงานแจกบัตรที่หน้า <Link href="/admin/scan">สแกนแจกบัตร</Link>{" "}
        จะเร็วกว่า
      </p>
      <ErrorNotice error={error} />
      <ErrorNotice error={actionError} />
      {loading && !data && <p role="status">กำลังโหลดรายการ…</p>}
      <div className="order-list">
        {data?.map((order) => (
          <article
            key={order.id}
            className={`order-card ${order.status === "cancelled" ? "cancelled" : ""}`}
          >
            <div className="order-card-head">
              <strong className="order-number">{order.ticket_label}</strong>
              <div>
                <h3>{order.name}</h3>
                <p>
                  รหัส {order.student_id} · โทร {order.phone}
                </p>
                <p>{thaiTime(order.created_at)}</p>
              </div>
              <span className="order-status">
                {order.status === "cancelled"
                  ? "ยกเลิกแล้ว"
                  : order.picked_up_at
                    ? "รับบัตรแล้ว"
                    : "ยังไม่รับบัตร"}
              </span>
            </div>
            {order.cancel_reason && <p>เหตุผลยกเลิก: {order.cancel_reason}</p>}
            <div className="action-buttons">
              <button
                className="button outline"
                onClick={() => setSlip(order.id)}
              >
                ดูสลิป
              </button>
              {order.status === "active" && (
                <>
                  <button
                    className="button pickup-button"
                    disabled={!!busy || loading || !!error}
                    onClick={async () => {
                      if (guard.current) return;
                      guard.current = true;
                      setBusy(order.id);
                      setActionError(null);
                      try {
                        const updated = await api.pickup(
                          order.id,
                          !order.picked_up_at,
                        );
                        update((list) => replaceById(list, updated));
                      } catch (e) {
                        setActionError(e);
                        await refresh();
                      } finally {
                        guard.current = false;
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === order.id
                      ? "กำลังอัปเดต…"
                      : order.picked_up_at
                        ? "ยกเลิกการติ๊กรับบัตร"
                        : "รับบัตรแล้ว"}
                  </button>
                  <button
                    className="text-link danger-link"
                    disabled={!!busy || loading || !!error}
                    onClick={() => setCancel(order)}
                  >
                    ยกเลิกบัตร
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {data?.length === 0 && !loading && <p>ไม่พบรายการที่ตรงกับการค้นหา</p>}
      </div>
      {slip && <SlipDialog id={slip} onClose={() => setSlip(null)} />}
      {cancel && (
        <ActionDialog
          title={`ยกเลิกบัตร ${cancel.ticket_label}`}
          description={`ยืนยันยกเลิกบัตรของ ${cancel.name} เลขบัตรนี้จะกลับไปว่างและไม่สามารถใช้บัตรเดิมแลกบัตรได้`}
          fieldLabel="เหตุผลการยกเลิก (จำเป็น)"
          onCancel={() => setCancel(null)}
          onConfirm={async (reason) => {
            const updated = await api.cancel(cancel.id, reason);
            update((list) => replaceById(list, updated));
          }}
        />
      )}
    </>
  );
}
