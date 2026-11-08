# Scare Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มชั้นความน่ากลัวบนหน้าแรก `/`: หน้าประตู + เสียงกระซิบสุ่ม, ร่างชุดดำในทุ่งหมอก (Three.js) ที่ใกล้ขึ้นทุกครั้งที่กลับมา, กล้องแฟลช + โพลารอยด์บนรูปจริง และตอนจบที่ร่างโผล่ในกระจก

**Architecture:** logic ล้วน (state ของร่าง, กติกาสุ่มเสียง, ลำดับรูปแฟลช, การอ่าน/เขียน localStorage) อยู่ใน `lib/scare/*.ts` และทดสอบด้วย node script แบบเดียวกับ `scripts/verify-booking.cjs` ส่วนที่แตะ browser API (Web Audio, canvas, Three.js) อยู่ใน `components/scare/*` โดย `ScareProvider` เป็นเจ้าของ state ทั้งหมดและมีอยู่เฉพาะในหน้าแรก ออกจาก `/` แล้วทุกอย่าง (รวมเสียง) ถูก unmount

**Tech Stack:** Next.js 16.4.5 App Router, React 19.3, TypeScript, `three` (dependency ใหม่, lazy-load), Web Audio API, Canvas 2D, `motion` (มีอยู่แล้ว)

**Spec:** `docs/superpowers/specs/2026-11-08-scare-layer-design.md`

## Global Constraints

- ห้ามใช้ชื่อ ตัวละคร ภาพ เสียง ดนตรี หรือคำพูดจากหนัง (รวมคำว่า "ธี่หยด") และห้ามเอ่ยชื่อหนังบนเว็บ ผี/เสียง/ภาพสร้างเองทั้งหมด
- ลูกเล่นอยู่เฉพาะ `/` เท่านั้น ไม่แตะ `/booking`, `/checkout`, `/ticket*`, `/admin*`, API หรือ backend
- ปุ่ม "จองบัตร" ใน hero ต้องกดได้ทันทีหลังผ่านหน้าประตู ไม่มีอะไรบังหรือหน่วง
- แฟลชไม่เกิน 3 ครั้ง/วินาที (WCAG 2.3.1) → บังคับเว้น ≥ 1500 ms ระหว่างแฟลช
- ไม่มีเสียงดังกระแทก ไม่มีภาพเด้งเต็มจอ
- ข้อความบนเว็บเป็นภาษาไทย
- `three` ต้องโหลดแบบ lazy หลังข้อความ/ปุ่ม hero แสดงแล้ว
- ทุกการอ่าน/เขียน `localStorage` อยู่ใน try/catch และเว็บต้องทำงานได้แม้ storage ใช้ไม่ได้
- อ่าน `node_modules/next/dist/docs/` ก่อนใช้ API ของ Next (ตาม `AGENTS.md`) — `dynamic(..., { ssr: false })` ใช้ได้เฉพาะใน Client Component
- lint ของโปรเจกต์ห้าม `setState` ตรง ๆ ใน `useEffect` (react-hooks); โค้ดเดิมเลี่ยงด้วย `queueMicrotask(() => setX(...))` หรือใช้ `useSyncExternalStore` — ทำตามแบบนั้น

## Review Focus

1. **localStorage ใช้ไม่ได้ / ข้อมูลเสีย** (private mode, storage ถูก block, JSON พัง) → ใช้ค่าเริ่มต้น เห็นหน้าประตูทุกครั้ง ไม่ crash — เทสต์ใน Task 1
2. **เลื่อนจอรัว ๆ** → เสียงกระซิบห่างกันอย่างน้อย 15 วินาทีเสมอ — เทสต์ใน Task 1
3. **มือถือจอดับ/สลับแอปแป๊บเดียว (< 20 วินาที)** → ร่างไม่ขยับ — เทสต์ใน Task 1
4. **กลับมาหลายครั้งตอนเลื่อนลงไปแล้ว** → ร่างค้างไว้จนเห็น hero, ขยับไม่เกินระยะ "หายไป" และตอนจบกระจกไม่ถูกข้าม — เทสต์ใน Task 1
5. **กดชัตเตอร์รัว ๆ** → แฟลชไม่ถี่กว่า 1 ครั้ง/1500 ms — เทสต์ใน Task 1

---

### Task 0: เตรียม branch และ commit เอกสาร

- [ ] **Step 1:** `git checkout -b feat/scare-layer` จาก `main`
- [ ] **Step 2:** commit spec, plan และ `.gitignore` (มีบรรทัด `.superpowers/` แล้ว)

```bash
git add .gitignore docs/superpowers
git commit -m "docs: scare layer design and plan"
```

---

### Task 1: logic ล้วน + เทสต์

**Files:**

- Create: `lib/scare/figure-state.ts`, `lib/scare/whisper-policy.ts`, `lib/scare/shot-policy.ts`, `lib/scare/storage.ts`
- Create: `scripts/verify-scare.cjs`
- Modify: `package.json` (เพิ่ม script `"test:scare": "node scripts/verify-scare.cjs"`)

**Interfaces — Produces:**

```ts
// lib/scare/figure-state.ts
export const FIGURE_GONE = 6; // step 0–5 = ยืนใกล้ขึ้นเรื่อย ๆ, 6 = หายไป (ไปอยู่ข้างหลัง)
export const RETURN_MIN_AWAY_MS = 20_000;
export type FigureState = {
  step: number;
  pending: number;
  mirrorArmed: boolean;
  lastSeenAt: number | null;
};
export const initialFigure: FigureState; // { step: 0, pending: 0, mirrorArmed: false, lastSeenAt: null }
export function registerReturn(s: FigureState, now: number): FigureState;
export function markSeen(s: FigureState, now: number): FigureState; // lastSeenAt = now
export function revealPending(s: FigureState): FigureState; // เรียกเมื่อ hero อยู่บนจอ
export function consumeMirror(s: FigureState): FigureState; // หลังถ่ายรูปกระจกแล้ว → initialFigure แต่คง lastSeenAt
export function parseFigure(raw: string | null): FigureState;
export function serializeFigure(s: FigureState): string;

// lib/scare/whisper-policy.ts
export const WHISPER_COOLDOWN_MS = 15_000;
export const WHISPER_CHANCE = 0.3;
export function shouldWhisper(
  now: number,
  lastAt: number | null,
  rand: number,
): boolean;

// lib/scare/shot-policy.ts
export const SHOT_MIN_GAP_MS = 1_500;
export const GHOST_CHANCE = 0.5;
export function canShoot(now: number, lastShotAt: number | null): boolean;
export type ShotPlan =
  | { kind: "photo"; photoIndex: number; ghostSpot: number | null }
  | { kind: "mirror" };
export function planShot(
  shotCount: number,
  photoCount: number,
  spotCounts: number[],
  mirrorArmed: boolean,
  rand: () => number,
): ShotPlan;

// lib/scare/storage.ts
export type KV = Pick<Storage, "getItem" | "setItem">;
export const KEYS: {
  entered: "hh-entered";
  muted: "hh-muted";
  figure: "hh-figure";
};
export function readKey(store: KV | null, key: string): string | null; // null ถ้า throw
export function writeKey(store: KV | null, key: string, value: string): void; // เงียบถ้า throw
export function browserStore(): KV | null; // window.localStorage หรือ null (ห่อ try/catch)
```

Algorithm ที่ signature ไม่ได้บอก:

- `registerReturn`: ถ้า `lastSeenAt === null` หรือ `now - lastSeenAt < RETURN_MIN_AWAY_MS` → คืน `s` เดิม; ไม่งั้น `pending + 1` แต่ `step + pending` ต้องไม่เกิน `FIGURE_GONE`
- `revealPending`: ขยับ **ทีละ 1 ระยะต่อการเรียก** (`step + 1`, `pending - 1`) ถ้า `pending > 0`; เมื่อ step ถึง `FIGURE_GONE` → `mirrorArmed = true`
- `planShot`: ถ้า `mirrorArmed` → `{kind:"mirror"}`; ไม่งั้น `photoIndex = shotCount % photoCount`, `ghostSpot = rand() < GHOST_CHANCE ? Math.floor(rand() * spotCounts[photoIndex]) : null`
- `parseFigure`: JSON พัง/field ผิดชนิด/step นอกช่วง 0–6 → `initialFigure`

- [ ] **Step 1: เขียนเทสต์ใน `scripts/verify-scare.cjs`** (ใช้ loader `load()` แบบใน `scripts/verify-booking.cjs`, require ภายในระหว่างไฟล์ `lib/scare/*` ไม่มี)

```js
// figure-state
let s = { ...initialFigure, lastSeenAt: 0 };
assert.deepEqual(registerReturn(s, 19_999), s); // Review Focus 3
s = registerReturn(s, 20_000);
assert.equal(s.pending, 1);
assert.equal(s.step, 0);
s = revealPending(s);
assert.equal(s.step, 1);
assert.equal(s.pending, 0);
assert.equal(registerReturn(initialFigure, 99_999).pending, 0); // ไม่เคยเห็นมาก่อน
let far = { step: 5, pending: 0, mirrorArmed: false, lastSeenAt: 0 };
for (let i = 0; i < 10; i++)
  far = registerReturn({ ...far, lastSeenAt: 0 }, 60_000);
assert.equal(far.step + far.pending, FIGURE_GONE); // Review Focus 4: ไม่เกินระยะหายไป
far = revealPending(far);
assert.equal(far.step, 6);
assert.equal(far.mirrorArmed, true);
assert.equal(revealPending(far).step, 6);
const reset = consumeMirror({ ...far, lastSeenAt: 123 });
assert.deepEqual(reset, { ...initialFigure, lastSeenAt: 123 });
for (const bad of [null, "", "{", "[]", '{"step":9}', '{"step":"2"}'])
  assert.deepEqual(parseFigure(bad), initialFigure); // Review Focus 1
assert.deepEqual(parseFigure(serializeFigure(far)), far);

// whisper-policy — Review Focus 2
assert.equal(shouldWhisper(0, null, 0.1), true);
assert.equal(shouldWhisper(0, null, 0.9), false);
assert.equal(shouldWhisper(14_999, 0, 0), false);
assert.equal(shouldWhisper(15_000, 0, 0.1), true);

// shot-policy — Review Focus 5
assert.equal(canShoot(0, null), true);
assert.equal(canShoot(1_499, 0), false);
assert.equal(canShoot(1_500, 0), true);
assert.deepEqual(
  planShot(4, 3, [2, 2, 2], true, () => 0),
  { kind: "mirror" },
);
assert.deepEqual(planShot(4, 3, [2, 3, 2], false, seq(0.1, 0.7)), {
  kind: "photo",
  photoIndex: 1,
  ghostSpot: 2,
});
assert.deepEqual(
  planShot(0, 3, [2, 2, 2], false, () => 0.9),
  { kind: "photo", photoIndex: 0, ghostSpot: null },
);

// storage — Review Focus 1
const throwing = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};
assert.equal(readKey(throwing, KEYS.entered), null);
writeKey(throwing, KEYS.entered, "1"); // ต้องไม่ throw
assert.equal(readKey(null, KEYS.entered), null);
const mem = new Map();
const kv = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, v),
};
writeKey(kv, KEYS.muted, "1");
assert.equal(readKey(kv, KEYS.muted), "1");
console.log("Scare logic checks passed.");
```

(`seq(...xs)` = helper ใน script ที่คืนค่าตามลำดับ)

- [ ] **Step 2:** `npm run test:scare` → FAIL (ไฟล์ยังไม่มี)
- [ ] **Step 3:** เขียน 4 ไฟล์ใน `lib/scare/` ตาม Interfaces (ห้าม import อะไรนอกจากกันเอง — loader ของ script รองรับแค่นั้น; `storage.ts` ห้ามแตะ `window` ตอน import)
- [ ] **Step 4:** `npm run test:scare` → `Scare logic checks passed.` และ `npm run typecheck && npm run lint` ผ่าน
- [ ] **Step 5: Commit** — `git commit -m "feat(scare): pure state, whisper and shot policies"`

---

### Task 2: หน้าประตู + เสียงกระซิบ + ปุ่มเสียง

**Files:**

- Create: `components/scare/whisper-engine.ts`, `components/scare/scare-provider.tsx`, `components/scare/entry-gate.tsx`, `components/scare/mute-button.tsx`, `components/scare/scare-layer.tsx`
- Modify: `app/page.tsx` (ห่อ `<main>` ด้วย `<ScareLayer>`), `app/globals.css` (style ของ gate และปุ่มเสียง)

**Interfaces:**

- Consumes: `shouldWhisper`, `KEYS`, `readKey`, `writeKey`, `browserStore`, และ figure-state ทั้งหมดจาก Task 1
- Produces:

```ts
// components/scare/whisper-engine.ts  (client only)
export class WhisperEngine {
  unlock(opts: { overrideSilent: boolean }): Promise<void>; // สร้าง/resume AudioContext ภายใน gesture; ถ้า overrideSilent และมี navigator.audioSession → type = "playback"
  play(): void; // เสียงกระซิบ 1 วลี
  setMuted(muted: boolean): void;
  dispose(): void; // หยุดทุกเสียง ปิด AudioContext
}

// components/scare/scare-provider.tsx
export function ScareProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element;
export function useScare(): {
  entered: boolean | null; // null = ยังไม่รู้ (ก่อน mount)
  muted: boolean;
  enter(withSound: boolean): void;
  toggleMute(): void;
  figure: FigureState;
  heroVisible(): void; // ให้ hero เรียกเมื่ออยู่บนจอ → revealPending + บันทึก
  consumeMirror(): void;
  reducedMotion: boolean;
};

// components/scare/scare-layer.tsx  ("use client")
export function ScareLayer({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element; // ScareProvider + EntryGate + MuteButton + children
```

พฤติกรรมที่ต้องมี:

- **เสียง (`play`)**: พอร์ตจากแท็บ 4 ของม็อก (`.superpowers/brainstorm/98990-1794131808/content/scare-mocks.html`, ส่วน `demo('whisper', ...)`) — noise → highpass 700 Hz → bandpass (Q 1.4, สุ่ม 1800–4000 Hz ต่อพยางค์) → gain envelope 2–4 พยางค์ → `PannerNode` HRTF ตำแหน่งสุ่มรอบหัว (รัศมี 1.6) และโอกาส 25% จ่อหูข้างเดียว (รัศมี 0.25) ความดังสูงสุดของ envelope ≤ 0.35 ไม่ใช้เอฟเฟกต์ภาพเบลอ
- **Provider**: อ่าน `entered`/`muted`/`figure` หลัง mount (ห้ามอ่านตอน render); ตอน mount เรียก `registerReturn(figure, Date.now())` แล้ว `markSeen` เมื่อ `visibilitychange` → hidden และ `pagehide`; เมื่อ visible อีกครั้งเรียก `registerReturn`; บันทึกลง `KEYS.figure` ทุกครั้งที่เปลี่ยน
- **ทริกเกอร์เสียง**: ฟัง `pointerdown` และ `scroll` (passive) บน `window`; ถ้า `entered && !muted && shouldWhisper(now, lastAt, Math.random())` → `play()` แล้วจำ `lastAt`. ผู้ใช้ที่เคยเข้าแล้ว (ไม่มีหน้าประตู) → `pointerdown` แรกเรียก `unlock({ overrideSilent: true })` ก่อน (scroll ปลดล็อกเสียงไม่ได้ จึงไม่เล่น)
- **unmount** (ออกจาก `/`) → `dispose()`
- **`reducedMotion`**: จาก `matchMedia("(prefers-reduced-motion: reduce)")`

หน้าประตู (`EntryGate`) — แสดงเมื่อ `entered === false` (ช่วง `null` ไม่แสดง เพื่อคนที่เคยเข้าแล้วจะไม่เห็นจอดำแวบ):

- `role="dialog" aria-modal="true" aria-labelledby`, พื้นดำเต็มจอ, focus อยู่ที่ปุ่มหลัก
- ข้อความ (ตายตัว):
  - หัว: `THE HAUNTED HOUSE`
  - บรรทัด: `บ้านหลังนี้มีเสียง ใส่หูฟังจะดีที่สุด`
  - ปุ่มหลัก: `เข้าบ้าน (มีเสียง)` → `enter(true)`: `unlock({overrideSilent:true})` → `play()` ทันที → บันทึก `entered=1`, `muted=0`
  - ปุ่มรอง (เล็ก): `เข้าแบบไม่มีเสียง` → `enter(false)`: บันทึก `entered=1`, `muted=1`
- ปิดด้วย fade 0.8 วิ (ไม่มี animation ถ้า `reducedMotion`)

ปุ่มเสียง (`MuteButton`): fixed มุมขวาล่าง แสดงหลัง `entered === true`, ไอคอน `Volume2`/`VolumeX` จาก lucide, `aria-label` = `ปิดเสียง` / `เปิดเสียง`, `aria-pressed`; การกดเปิดเสียงถือเป็น gesture → `unlock({overrideSilent:true})`

- [ ] **Step 1:** เขียน 5 ไฟล์และ CSS; ใน `app/page.tsx` ห่อเนื้อหาเดิมทั้งหมดด้วย `<ScareLayer>`
- [ ] **Step 2:** `npm run typecheck && npm run lint && npm run test:scare && npm run build` → ผ่าน
- [ ] **Step 3: ตรวจในเบราว์เซอร์** (`npm run dev`, ใส่หูฟัง)
  - เปิด `/` ใน private window → เห็นหน้าประตู; กด "เข้าบ้าน (มีเสียง)" → ได้ยินเสียงกระซิบทันที, หน้าเว็บเปิด, ปุ่ม "จองบัตร" กดได้
  - เลื่อน/แตะรัว ๆ 30 วินาที → ได้ยินไม่เกิน 2–3 ครั้ง ไม่ติดกัน
  - กดปุ่มเสียง → เงียบ; reload → ไม่มีหน้าประตู และยังเงียบ
  - เปิด `/` ใหม่ใน private window → "เข้าแบบไม่มีเสียง" → ไม่มีเสียงเลยจนกดปุ่มเสียง
  - กด "จองบัตร" ไป `/booking` → เสียงหยุด, ไม่มีปุ่มเสียง
- [ ] **Step 4: Commit** — `git commit -m "feat(scare): entry gate, whispers and mute toggle on home"`

---

### Task 3: กล้องแฟลช + โพลารอยด์ + ตอนจบกระจก

**Files:**

- Create: `lib/scare/ghost-shape.ts`, `lib/scare/camera-config.ts`, `components/scare/flash-camera.tsx`
- Modify: `app/page.tsx` (แทน `<section className="section experiences" id="experiences">` และลบ array `gallery`), `app/globals.css` (ลบ `.experience*`, `.experience-grid`; เพิ่ม style ของกล้อง/โพลารอยด์)

**Interfaces:**

- Consumes: `canShoot`, `planShot`, `SHOT_MIN_GAP_MS` (Task 1); `useScare().figure.mirrorArmed`, `consumeMirror`, `reducedMotion` (Task 2)
- Produces:

```ts
// lib/scare/ghost-shape.ts — ใช้ร่วมกับ Task 4
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  fill: string,
  blurPx: number,
): void;
// ร่างผมยาว ชุดยาว แขนห้อย — พอร์ตจาก ghostCanvas() ในม็อก; (x,y) = กึ่งกลางด้านล่างเท้า

// lib/scare/camera-config.ts — วันงานแก้เฉพาะไฟล์นี้ + วางรูปใน public/images/
export type Spot = { x: number; y: number; h: number }; // 0–1 ของความกว้าง/สูงรูป; (x,y) = ตำแหน่งเท้า, h = ความสูงร่าง
export type CameraPhoto = { src: string; alt: string; spots: Spot[] };
export type MirrorShot = {
  src: string;
  alt: string;
  mirror: { x: number; y: number; w: number; h: number };
  mockFrame: boolean;
};
export const cameraConfig: { photos: CameraPhoto[]; mirrorShot: MirrorShot };
```

ค่าเริ่มต้นของ `cameraConfig` (mock):

- `photos`: `/images/hallway.jpg`, `/images/room.jpg`, `/images/ritual.jpg` แต่ละรูปมี 2–3 spots ที่ผู้สร้างเลือกจากการดูรูป (เช่นในประตู/ปลายทางเดิน)
- `mirrorShot`: `src: "/images/room.jpg"`, `mockFrame: true`, `mirror` = สี่เหลี่ยมแนวตั้งราว 30% ของความกว้างรูป ตรงกลาง — เมื่อ `mockFrame` เป็น true คอมโพเนนต์วาดกรอบกระจกเก่า + พื้นกระจกมืดเอง วันงานเปลี่ยนเป็นรูปกระจกจริงแล้วตั้ง `mockFrame: false`

พฤติกรรม `FlashCamera`:

- canvas 2D แสดงรูป `photos[n]` แบบมืด (brightness ≈ 0.15) ปุ่ม `ชัตเตอร์` (ไอคอน `Camera`) ใต้ภาพ, eyebrow `ลองถ่ายรูปบ้าน`
- กด: ถ้า `!canShoot` → ไม่ทำอะไร; ไม่งั้น `planShot(...)`:
  - วาดภาพตอนแฟลช (brightness ≈ 1.1, sepia เบา ๆ + grain) + `drawGhost` ที่ spot (สีซีดขาว `#e9e4dc`, opacity ≈ 0.8) ถ้ามี
  - แฟลช: overlay สีขาวทับ **เฉพาะกรอบภาพ** opacity 0.85 → 0 ใน 0.5 วิ; ถ้า `reducedMotion` ใช้ opacity 0.35
  - ภาพสว่างค้าง ~110 ms แล้วกลับมืด (ไม่มีผี)
  - เพิ่มโพลารอยด์ (`toDataURL("image/jpeg", 0.8)`) ไว้หน้าสุด, caption `รูปที่ N`, ล้างภาพ opacity 0→1 ใน 3 วิ, เก็บแค่ 6 ใบล่าสุด, เอียงสุ่ม ±4°
- `kind: "mirror"`: ใช้ `mirrorShot` → (กรอบ mock ถ้า `mockFrame`) → ในพื้นที่กระจกวาดร่าง **สีดำ** สูง ~85% ของกระจก ตรงกลาง = ยืนตรงตำแหน่งคนดู → ผีติดแน่นอน → `consumeMirror()` หลังแสดงผล
- โหลดรูปด้วย `HTMLImageElement` (same-origin) ก่อนเปิดให้กด; ระหว่างโหลดปุ่ม disabled
- alt ของรูปมืดใช้ `CameraPhoto.alt`; โพลารอยด์ `alt` = `รูปที่ N จากกล้อง`

- [ ] **Step 1:** เขียนไฟล์และแก้ `app/page.tsx` + CSS
- [ ] **Step 2:** `npm run typecheck && npm run lint && npm run test:scare && npm run build` → ผ่าน
- [ ] **Step 3: ตรวจในเบราว์เซอร์**
  - กดชัตเตอร์ 10 ครั้ง → ประมาณครึ่งหนึ่งมีผี, โพลารอยด์ ≤ 6 ใบ, รูปวนครบ 3 รูป
  - กดรัว ๆ → แฟลชไม่ถี่กว่าราว 1.5 วินาที/ครั้ง
  - แสงแฟลชไม่ล้นออกนอกกรอบภาพ
  - จำลองตอนจบ: DevTools console `localStorage.setItem("hh-figure", JSON.stringify({step:6,pending:0,mirrorArmed:true,lastSeenAt:null}))` แล้ว reload → แฟลชครั้งแรกเป็นรูปกระจกพร้อมร่างดำในกระจก, ครั้งต่อไปกลับเป็นรูปปกติ
  - เปิด reduce motion ใน OS → แฟลชอ่อนลง
- [ ] **Step 4: Commit** — `git commit -m "feat(scare): flash camera with polaroids and mirror ending"`

---

### Task 4: ทุ่งหมอก + ร่างชุดดำใน hero (Three.js)

**Files:**

- Modify: `package.json` / `package-lock.json` (`npm install three` และ `npm install -D @types/three`)
- Create: `components/scare/fog-scene.ts`, `components/scare/hero-backdrop.tsx`
- Modify: `app/page.tsx` (แทน `<Image src="/images/mansion.jpg" ... className="hero-image" />` ใน hero ด้วย `<HeroBackdrop />`), `app/globals.css`

**Interfaces:**

- Consumes: `drawGhost` (Task 3); `FIGURE_GONE` (Task 1); `useScare().figure.step`, `heroVisible`, `reducedMotion` (Task 2)
- Produces:

```ts
// components/scare/fog-scene.ts — import "three" เฉพาะในไฟล์นี้
export const FIGURE_Z: readonly number[]; // [-28, -21, -15, -10, -6, -3] ตาม step 0–5
export type FogScene = {
  setStep(step: number): void;
  setRunning(on: boolean): void;
  resize(): void;
  dispose(): void;
};
export function createFogScene(
  container: HTMLElement,
  opts: { reducedMotion: boolean },
): FogScene; // throw ถ้าสร้าง WebGL context ไม่ได้

// components/scare/hero-backdrop.tsx ("use client")
export function HeroBackdrop(): JSX.Element;
```

พฤติกรรม:

- `HeroBackdrop` render `<Image src="/images/mansion.jpg" ... className="hero-image" loading="eager" fill sizes="100vw" />` เดิมเสมอ (SSR, เป็น LCP และเป็น fallback) แล้วหลัง mount `import("./fog-scene")` แบบ dynamic วาง canvas ทับรูป แล้ว fade canvas เข้า 1.5 วิ ถ้า `createFogScene` throw → เก็บรูปนิ่งไว้ (ไม่มีร่าง ไม่เรียก `heroVisible`)
- ฉาก: พอร์ตจากแท็บ 3 ของม็อก — `FogExp2` สี `0x11151a` density 0.055, พื้น, ต้นไม้ (ต้นหลักที่ x 0.8, z -30 สเกล 1.4 + อีก 5 ต้น), `HemisphereLight`, ร่างเป็น `Sprite` จาก `CanvasTexture` ของ `drawGhost` สี `#050505` ที่ `FIGURE_Z[step]`; `step >= FIGURE_GONE` → ซ่อนร่าง
- กล้องส่ายเบา ๆ (`y += sin(t/900)*0.02`) — ปิดถ้า `reducedMotion`
- pixel ratio ≤ 1.5; `IntersectionObserver` บน hero: เห็น → `setRunning(true)` และเรียก `heroVisible()`; พ้นจอ หรือ `document.hidden` → `setRunning(false)`
- ร่างขยับเมื่อ `figure.step` เปลี่ยน: hero ดำ 0.6 วิ → `setStep` → กลับมา (เหมือนกะพริบตา) ไม่มีการเลื่อนให้เห็น; `reducedMotion` → เปลี่ยนทันที
- `.hero-shade`, `.fog` และข้อความ hero เดิมยังอยู่ด้านบน (z-index เดิม)

- [ ] **Step 1:** ติดตั้ง `three` และ `@types/three`
- [ ] **Step 2:** เขียนไฟล์และแก้ `app/page.tsx` + CSS
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run test:scare && npm run build` → ผ่าน และตรวจว่า `three` ไม่อยู่ใน chunk แรกของ `/` (ดู `.next` หรือ Network tab: ไฟล์ three โหลดหลังหน้าแสดงแล้ว)
- [ ] **Step 4: ตรวจในเบราว์เซอร์**
  - ข้อความและปุ่ม hero ขึ้นทันทีบนรูปนิ่ง แล้วทุ่งหมอกค่อย ๆ จางเข้ามา
  - console: `localStorage.setItem("hh-figure", JSON.stringify({step:0,pending:0,mirrorArmed:false,lastSeenAt:Date.now()-60000}))` → reload → ร่างขยับหนึ่งระยะ; ทำซ้ำจน step 6 → ทุ่งว่าง → กล้องแฟลชถ่ายติดกระจก (Task 3) → reload หลัง 20 วิ ร่างกลับไปยืนไกล
  - สลับแท็บ < 20 วิ → ร่างไม่ขยับ; สลับ > 20 วิ ขณะเลื่อนลงไปอยู่ section อื่น → ร่างยังไม่ขยับจนกว่าจะเลื่อนกลับมาเห็น hero
  - Chrome: `chrome://flags` ปิด WebGL (หรือ DevTools rendering ปิด WebGL) → เห็นรูปนิ่ง, เสียงและกล้องแฟลชยังทำงาน
  - มือถือจริง (Android ระดับกลาง + iPhone) → เลื่อนลื่น, iPhone โหมดเงียบ + "เข้าบ้าน (มีเสียง)" → ได้ยินเสียง (Safari ที่รองรับ `audioSession`)
- [ ] **Step 5: Commit** — `git commit -m "feat(scare): fog hero with approaching figure"`

---

### Task 5: ปิดงาน

**Files:**

- Modify: `README.md` (เพิ่มหัวข้อ "ลูกเล่นหน้าแรก": ไฟล์ `lib/scare/camera-config.ts` คือที่เปลี่ยนรูปวันงาน + วิธีรีเซ็ต `localStorage` key `hh-entered`, `hh-muted`, `hh-figure` เพื่อทดสอบ + `npm run test:scare` ในรายการตรวจก่อน push), `FRONTEND_HANDOFF.md` (บรรทัดเดียว: หน้าแรกมี scare layer, ไม่กระทบ API)

- [ ] **Step 1:** แก้ README และ FRONTEND_HANDOFF
- [ ] **Step 2:** รันทั้งหมด: `npm run typecheck && npm run lint && npm run test:booking && npm run test:api && npm run test:scare && npm run build` → ผ่านทุกตัว
- [ ] **Step 3:** ตรวจ `/booking`, `/checkout`, `/ticket` ในเบราว์เซอร์ → ไม่มีหน้าประตู ไม่มีเสียง ไม่มีปุ่มเสียง
- [ ] **Step 4: Commit** — `git commit -m "docs: scare layer usage and event-day photo swap"`
