"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { thaiTime } from "@/lib/booking";
import { useAdminData } from "@/components/use-admin-data";
import { ErrorNotice } from "@/components/error-notice";
import { SlipDialog } from "@/components/admin-dialogs";
const reasons = {
  invalid_slip: "อ่านสลิปไม่ได้",
  duplicate_slip: "สลิปถูกใช้ซ้ำ",
  already_has_ticket: "รหัสนักศึกษามีบัตรแล้ว",
};
export default function Rejected() {
  const { data, loading, error, refresh } = useAdminData(api.rejected);
  const [slip, setSlip] = useState<string | null>(null);
  return (
    <>
      <div className="admin-section-heading">
        <h2>รายการที่ถูกปฏิเสธ</h2>
        <button
          className="text-link"
          disabled={loading}
          onClick={() => void refresh()}
        >
          อัปเดตข้อมูล →
        </button>
      </div>
      <p>
        ใช้ตรวจสอบเมื่อผู้ซื้อแจ้งว่าโอนเงินแล้วแต่ระบบไม่ออกบัตร ·
        เวลาประเทศไทย
      </p>
      <ErrorNotice error={error} />
      {loading && <p role="status">กำลังโหลดรายการ…</p>}
      <div className="order-list">
        {data?.map((item) => (
          <article className="order-card" key={item.id}>
            <div className="order-card-head">
              <div>
                <h3>{item.name}</h3>
                <p>
                  รหัส {item.student_id} · โทร {item.phone}
                </p>
                <p>{thaiTime(item.created_at)}</p>
              </div>
              <span className="order-status">
                {reasons[item.reason] ?? item.reason}
              </span>
            </div>
            <button className="button outline" onClick={() => setSlip(item.id)}>
              ดูรูปที่แนบ
            </button>
          </article>
        ))}
        {data?.length === 0 && !loading && <p>ยังไม่มีรายการที่ถูกปฏิเสธ</p>}
      </div>
      {slip && <SlipDialog id={slip} rejected onClose={() => setSlip(null)} />}
    </>
  );
}
