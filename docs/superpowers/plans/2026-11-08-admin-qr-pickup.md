# Admin QR Pickup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** หน้าบัตรของผู้ซื้อแสดง QR (รหัสนักศึกษา) และหน้าใหม่ `/admin/scan` ให้ทีมงานสแกนด้วยกล้องมือถือ เห็นชื่อ + เลขบัตร แล้วกดยืนยันแจกบัตร

**Architecture:** กติกาทั้งหมด (อ่าน QR, เลือกรายการที่ตรงรหัส, ตรวจสถานะล่าสุดก่อนบันทึก, กันสแกนซ้ำ) อยู่ใน `lib/pickup.ts` ซึ่งรับ API เป็น dependency จึงทดสอบด้วย node script แบบเดียวกับ `scripts/verify-api.cjs` ได้ ส่วนกล้องอยู่ในคอมโพเนนต์ `QrScanner` แยก และหน้า `/admin/scan` ต่อสองส่วนนี้เข้าด้วยกัน ไม่แก้ backend

**Tech Stack:** Next.js 16.4.5 App Router, React 19.3, TypeScript, `qrcode` (สร้าง QR), `jsqr` (ถอด QR จากเฟรมวิดีโอ — ทำงานบน iOS Safari ซึ่งไม่มี `BarcodeDetector`), `getUserMedia`

**Spec:** `docs/superpowers/specs/2026-11-08-admin-qr-pickup-design.md`

## Global Constraints

- ไม่แก้ backend/API — ใช้ `api.orders(q)` และ `api.pickup(id, true)` ใน `lib/api.ts` เท่านั้น
- ไม่ติ๊กรับบัตรอัตโนมัติตอนสแกน — ต้องกด "ยืนยันแจกบัตร" เสมอ
- ไม่แก้/ลบหน้า `/admin/orders` เดิม
- ใช้รายการที่ `student_id` ตรงกับ QR ทุกตัวอักษรเท่านั้น (`q` ของ API ค้นแบบบางส่วน)
- ตอนยืนยัน ต้องดึงสถานะล่าสุดก่อนบันทึก (มีหลายเครื่องสแกนพร้อมกัน)
- การ์ดผลแสดงแค่ชื่อ เลขบัตร รหัส — ไม่แสดงสลิป
- ต้องสแกนได้บน iOS Safari และ Android Chrome; กล้องใช้ได้เฉพาะ HTTPS/localhost
- ข้อความบนเว็บเป็นภาษาไทย; อ่าน `node_modules/next/dist/docs/` ก่อนใช้ API ของ Next (`AGENTS.md`)
- lint ห้าม `setState` ตรง ๆ ใน `useEffect` — ใช้ callback ของ promise/event หรือ `queueMicrotask` ตามแบบโค้ดเดิม

## Review Focus

1. **อีกเครื่องแจกไปแล้วระหว่างที่การ์ดเปิดอยู่** → กดยืนยันแล้วได้การ์ด "รับบัตรไปแล้ว" ไม่เรียก pickup — เทสต์ใน Task 1
2. **ผลค้นหาบางส่วนมีรหัสที่คล้ายกัน** (เช่น `68315011780`) → ใช้เฉพาะรหัสที่ตรงเป๊ะ — เทสต์ใน Task 1
3. **QR ที่ไม่ใช่บัตร** (URL, ข้อความอื่น, มีช่องว่าง/ขึ้นบรรทัด) → "ไม่พบบัตรของ QR นี้" โดยไม่เรียก API; ช่องว่างหัวท้ายตัดทิ้ง — เทสต์ใน Task 1
4. **QR เดิมยังค้างหน้ากล้องหลังยืนยัน** → ไม่ถูกอ่านซ้ำทันที (กัน 3 วินาทีสำหรับข้อความเดิม) — เทสต์ใน Task 1
5. **เน็ตหลุดตอนยืนยัน** → error ไม่ถูกกลืน ลองใหม่ได้ และการลองใหม่ตรวจสถานะล่าสุดก่อนเสมอ (ไม่บันทึกซ้ำถ้าครั้งแรกสำเร็จจริง) — เทสต์ใน Task 1

---

### Task 0: branch + commit เอกสาร

- [ ] **Step 1:** `git checkout -b feat/admin-qr-pickup` จาก `main`
- [ ] **Step 2:** `git add docs/superpowers && git commit -m "docs: admin QR pickup design and plan"`

---

### Task 1: กติกาการแจกบัตร (`lib/pickup.ts`) + เทสต์

**Files:**

- Create: `lib/pickup.ts`, `scripts/verify-pickup.cjs`
- Modify: `package.json` (script `"test:pickup": "node scripts/verify-pickup.cjs"`)

**Interfaces — Produces:**

```ts
import type { Order } from "./api"; // import type เท่านั้น (loader ของ script ไม่ resolve "./api")

export function parseScan(raw: string): string | null; // trim แล้วต้องเป็น /^\d{10}$/ ไม่งั้น null

export type PickupResult =
  | { kind: "ready"; order: Order } // active, picked_up_at === null
  | { kind: "picked"; order: Order } // active, picked_up_at !== null
  | { kind: "cancelled"; order: Order } // ไม่มี active, มี cancelled
  | { kind: "not_found" };
export function resolvePickup(studentId: string, orders: Order[]): PickupResult;

export type PickupApi = {
  orders(q: string): Promise<Order[]>;
  pickup(id: string, picked_up: boolean): Promise<Order>;
};
export function lookupPickup(
  studentId: string,
  deps: PickupApi,
): Promise<PickupResult>;
export type ConfirmResult =
  { kind: "done"; order: Order } | Exclude<PickupResult, { kind: "ready" }>;
export function confirmPickup(
  studentId: string,
  deps: PickupApi,
): Promise<ConfirmResult>;

export const SAME_SCAN_COOLDOWN_MS = 3_000;
export type LastScan = { text: string; at: number } | null;
export function acceptScan(text: string, now: number, last: LastScan): boolean;
```

Algorithm ที่ signature ไม่ได้บอก:

- `resolvePickup`: กรองเฉพาะ `o.student_id === studentId`; ถ้ามี active → ready/picked; ไม่งั้นถ้ามี cancelled → เลือกตัวที่ `cancelled_at ?? created_at` ล่าสุด → cancelled; ไม่งั้น not_found
- `lookupPickup` = `resolvePickup(id, await deps.orders(id))`
- `confirmPickup`: เรียก `lookupPickup` ใหม่ก่อน; ถ้าไม่ใช่ `ready` คืนผลนั้นโดย **ไม่เรียก** `pickup`; ถ้า ready → `deps.pickup(order.id, true)` → `{ kind: "done", order: <ที่ API คืน> }`; error จาก API ส่งต่อ (reject) ไม่จับ
- `acceptScan`: false ถ้า `last && last.text === text && now - last.at < SAME_SCAN_COOLDOWN_MS`

- [ ] **Step 1: เขียน `scripts/verify-pickup.cjs`** (loader แบบ `scripts/verify-scare.cjs`; fake `PickupApi` ที่จด call ไว้)

```js
const order = (o) => ({
  id: "a",
  ticket_no: 12,
  ticket_label: "012",
  status: "active",
  name: "สมชาย ใจดี",
  student_id: "6831501178",
  phone: "0812345678",
  created_at: "2026-11-08T03:00:00Z",
  cancelled_at: null,
  cancel_reason: null,
  picked_up_at: null,
  ...o,
});
const fake = (lists, pickupResult) => {
  const calls = [];
  let i = 0;
  return {
    calls,
    orders: async (q) => {
      calls.push(["orders", q]);
      return lists[Math.min(i++, lists.length - 1)];
    },
    pickup: async (id, v) => {
      calls.push(["pickup", id, v]);
      if (pickupResult instanceof Error) throw pickupResult;
      return pickupResult;
    },
  };
};

// parseScan — Review Focus 3
assert.equal(parseScan(" 6831501178\n"), "6831501178");
for (const bad of [
  "",
  "683150117",
  "68315011789",
  "https://x.test/ticket/6831501178",
  "abc",
  "6831 501178",
])
  assert.equal(parseScan(bad), null);

// resolvePickup — Review Focus 2
assert.equal(resolvePickup("6831501178", []).kind, "not_found");
assert.equal(
  resolvePickup("6831501178", [order({ student_id: "68315011780" })]).kind,
  "not_found",
);
assert.equal(resolvePickup("6831501178", [order({})]).kind, "ready");
assert.equal(
  resolvePickup("6831501178", [order({ picked_up_at: "2026-11-08T12:00:00Z" })])
    .kind,
  "picked",
);
const c1 = order({
  id: "c1",
  status: "cancelled",
  cancelled_at: "2026-11-08T01:00:00Z",
  cancel_reason: "เก่า",
});
const c2 = order({
  id: "c2",
  status: "cancelled",
  cancelled_at: "2026-11-08T02:00:00Z",
  cancel_reason: "สลิปปลอม",
});
assert.deepEqual(resolvePickup("6831501178", [c1, c2]), {
  kind: "cancelled",
  order: c2,
});
assert.deepEqual(
  resolvePickup("6831501178", [c2, order({ id: "new" })]).order.id,
  "new",
); // active ชนะ cancelled

// confirmPickup — Review Focus 1: อีกเครื่องแจกไปแล้ว → ไม่เรียก pickup
let f = fake([[order({ picked_up_at: "2026-11-08T12:00:00Z" })]], null);
assert.equal((await confirmPickup("6831501178", f)).kind, "picked");
assert.deepEqual(f.calls, [["orders", "6831501178"]]);
// ปกติ
const done = order({ picked_up_at: "2026-11-08T12:01:00Z" });
f = fake([[order({})]], done);
assert.deepEqual(await confirmPickup("6831501178", f), {
  kind: "done",
  order: done,
});
assert.deepEqual(f.calls, [
  ["orders", "6831501178"],
  ["pickup", "a", true],
]);
// Review Focus 5: pickup error ส่งต่อ; ลองใหม่หลังครั้งแรกสำเร็จจริง → เห็นว่ารับแล้ว ไม่บันทึกซ้ำ
f = fake([[order({})]], new Error("network"));
await assert.rejects(confirmPickup("6831501178", f), /network/);
f = fake([[done]], done);
assert.equal((await confirmPickup("6831501178", f)).kind, "picked");
assert.equal(f.calls.filter((c) => c[0] === "pickup").length, 0);

// acceptScan — Review Focus 4
assert.equal(acceptScan("6831501178", 0, null), true);
assert.equal(
  acceptScan("6831501178", 2_999, { text: "6831501178", at: 0 }),
  false,
);
assert.equal(
  acceptScan("6831501178", 3_000, { text: "6831501178", at: 0 }),
  true,
);
assert.equal(acceptScan("6700000000", 10, { text: "6831501178", at: 0 }), true);
console.log("Pickup logic checks passed.");
```

(ห่อทั้งหมดใน `(async () => { ... })().catch((e) => { console.error(e); process.exit(1); })`)

- [ ] **Step 2:** `npm run test:pickup` → FAIL (ENOENT `lib/pickup.ts`)
- [ ] **Step 3:** เขียน `lib/pickup.ts` ตาม Interfaces
- [ ] **Step 4:** `npm run test:pickup` → `Pickup logic checks passed.`; `npm run typecheck && npm run lint` ผ่าน
- [ ] **Step 5:** `git commit -m "feat(pickup): scan parsing and pickup rules"`

---

### Task 2: QR บนหน้าบัตร

**Files:**

- Modify: `package.json` / lock (`npm install qrcode` + `npm install -D @types/qrcode`)
- Create: `components/ticket-qr.tsx`
- Modify: `components/ticket-lookup.tsx` (ในส่วน `ticket && !loading` ใต้ `<strong className="ticket-number">`), `app/globals.css`

**Interfaces — Produces:** `export function TicketQr({ studentId }: { studentId: string }): JSX.Element` ("use client")

- สร้าง data URL ด้วย `QRCode.toDataURL(studentId, { margin: 2, width: 440, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })` ใน effect (set state ใน `.then`)
- แสดง `<img>` 220×220 CSS px พื้นขาว (QR สีดำบนพื้นขาวเสมอ แม้ธีมมืด) `alt="QR สำหรับรับบัตร"` ระหว่างสร้างให้เป็นกล่องว่างขนาดเท่ากัน (ไม่กระตุก layout)
- คำบรรยายใต้ QR (ตายตัว): `ยื่น QR นี้ให้ทีมงานสแกนตอนรับบัตร`
- แสดงเสมอเมื่อมี `ticket` ไม่ว่า `picked_up` เป็นอะไร

- [ ] **Step 1:** ติดตั้ง `qrcode`, `@types/qrcode`
- [ ] **Step 2:** เขียน `TicketQr` และใส่ใน `ticket-lookup.tsx` + CSS
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run test:pickup && npm run build` → ผ่าน
- [ ] **Step 4: ตรวจในเบราว์เซอร์** — เปิด `/ticket/<รหัสที่มีบัตร>` (backend dev) หรือดูผ่านแอปกล้องมือถือว่าสแกน QR แล้วได้ข้อความ 10 หลักตรงรหัส
- [ ] **Step 5:** `git commit -m "feat(ticket): show pickup QR on ticket page"`

---

### Task 3: กล้องสแกน + หน้า `/admin/scan`

**Files:**

- Modify: `package.json` / lock (`npm install jsqr`)
- Create: `components/qr-scanner.tsx`, `app/admin/scan/page.tsx`
- Modify: `components/admin-shell.tsx` (เมนู), `app/globals.css`

**Interfaces:**

- Consumes: ทั้งหมดจาก Task 1; `api` และ `thaiTime` (`lib/booking.ts`); `ErrorNotice`
- Produces:

```ts
// components/qr-scanner.tsx ("use client")
export function QrScanner({
  paused,
  onScan,
}: {
  paused: boolean;
  onScan(text: string): void;
}): JSX.Element;
```

`QrScanner`:

- `getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })` → `<video playsInline muted autoPlay>`; หยุดทุก track ตอน unmount
- ถอดทุก ~150 ms: วาดเฟรมลง canvas ย่อด้านยาว ≤ 640 px → `jsQR(data, w, h, { inversionAttempts: "dontInvert" })` → ถ้าเจอและ `!paused` → `onScan(code.data)`
- ข้อความ error (ตายตัว):
  - `!window.isSecureContext` → `กล้องใช้ได้เฉพาะเว็บที่เปิดผ่าน HTTPS`
  - `NotAllowedError` → `ไม่ได้รับสิทธิ์ใช้กล้อง อนุญาตกล้องในการตั้งค่าเบราว์เซอร์ หรือใช้ "พิมพ์ค้นหาแทน"`
  - อื่น ๆ → `เปิดกล้องไม่ได้ ลองใช้ "พิมพ์ค้นหาแทน"`
- กรอบเล็งกลางภาพ + ข้อความ `ส่อง QR บนหน้าบัตร`

หน้า `/admin/scan` — state:
`scanning` → (รหัสผ่าน `acceptScan`) → `parseScan` → null: การ์ด `not_found` ทันที; ไม่งั้น `looking` (`lookupPickup(id, api)`) → การ์ดตาม `PickupResult` → กด `ยืนยันแจกบัตร` → `confirming` (`confirmPickup(id, api)`) → `done` (แสดง `แจกบัตร {ticket_label} แล้ว` 1.5 วิ) → `scanning`; ผล `picked`/`cancelled`/`not_found` จาก confirm → แสดงการ์ดนั้นแทน

- `QrScanner` `paused` เมื่อไม่ใช่ `scanning`; บันทึก `LastScan` ตอนรับผลสแกน
- error (lookup หรือ confirm): `<ErrorNotice>` + ปุ่ม `ลองใหม่` ที่เรียกขั้นที่ล้มเหลวซ้ำ (การ์ดเดิมยังอยู่)
- ข้อความบนการ์ด (ตายตัว):
  - ready: ป้าย `ยังไม่รับบัตร`, เลขบัตรตัวใหญ่, ชื่อ, `รหัส {student_id}`, ปุ่มหลัก `ยืนยันแจกบัตร {ticket_label}`
  - picked: `รับบัตรไปแล้ว {thaiTime(picked_up_at)}` + เลขบัตร + ชื่อ (ไม่มีปุ่มแจก)
  - cancelled: `บัตรถูกยกเลิก` + `เหตุผล: {cancel_reason ?? "-"}` + ชื่อ (ไม่มีปุ่มแจก)
  - not_found: `ไม่พบบัตรของ QR นี้`
  - ทุกการ์ด: ปุ่มรอง `ไม่ใช่คนนี้ / สแกนใหม่` → กลับ `scanning`
- ปุ่ม `พิมพ์ค้นหาแทน` → ช่องกรอกรหัสนักศึกษา (`inputMode="numeric"`, `maxLength={10}`) + ปุ่ม `ค้นหา` → ผ่าน `parseScan` แล้วไปขั้น `looking` เหมือนสแกน
- สีการ์ด: ready เขียว, picked ส้ม, cancelled/not_found แดง (ตามม็อก `.superpowers/brainstorm/98990-1794131808/content/admin-scan-flow.html`); ปุ่มใหญ่ใช้นิ้วกดง่ายบนมือถือ
- เมนูใน `admin-shell.tsx`: เพิ่ม `["/admin/scan", "สแกนแจกบัตร"]` เป็นรายการที่สอง (ต่อจาก `ภาพรวม / เปิดปิดขาย`)

- [ ] **Step 1:** ติดตั้ง `jsqr` (มี type ในตัว)
- [ ] **Step 2:** เขียน `QrScanner`, หน้า `/admin/scan`, เมนู, CSS
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run test:pickup && npm run build` → ผ่าน
- [ ] **Step 4: ตรวจในเบราว์เซอร์/มือถือ** (ต้อง HTTPS: เช่น `npx next dev --experimental-https` แล้วเปิดจากมือถือในวง LAN เดียวกัน)
  - สแกน QR ของบัตรที่ยังไม่รับ → การ์ดเขียว → ยืนยัน → "แจกบัตร 012 แล้ว" → กลับไปสแกน, QR เดิมไม่ถูกอ่านซ้ำทันที
  - สแกนซ้ำหลัง 3 วิ → การ์ดส้ม "รับบัตรไปแล้ว"
  - เปิดสองเครื่อง: สแกนคนเดียวกันทั้งคู่ เครื่อง A ยืนยัน แล้วเครื่อง B กดยืนยัน → B ได้การ์ดส้ม
  - บัตรที่ถูกยกเลิก → การ์ดแดงพร้อมเหตุผล; QR อื่น (เช่น URL) → "ไม่พบบัตรของ QR นี้"
  - ปฏิเสธสิทธิ์กล้อง → ข้อความ + "พิมพ์ค้นหาแทน" ใช้ได้
  - iPhone (Safari) และ Android (Chrome) สแกนได้ทั้งคู่
- [ ] **Step 5:** `git commit -m "feat(admin): scan QR to hand out tickets"`

---

### Task 4: ปิดงาน

**Files:** Modify: `README.md` (เพิ่ม `/admin/scan` ในรายการหน้า, `npm run test:pickup` ในรายการตรวจ, หมายเหตุ "กล้องใช้ได้เฉพาะ HTTPS"), `FRONTEND_HANDOFF.md` (แถวตาราง: `/admin/scan` → `GET /api/admin/orders`, `POST /api/admin/orders/{id}/pickup`)

- [ ] **Step 1:** แก้เอกสาร
- [ ] **Step 2:** `npm run typecheck && npm run lint && npm run test:booking && npm run test:api && npm run test:scare && npm run test:pickup && npm run build` → ผ่านทั้งหมด
- [ ] **Step 3:** `git commit -m "docs: QR pickup usage"`
