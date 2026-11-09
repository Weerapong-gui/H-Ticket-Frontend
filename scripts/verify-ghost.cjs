/* eslint-disable @typescript-eslint/no-require-imports -- standalone ghost camera logic checks */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const m = { exports: {} };
  cache[file] = m.exports;
  const req = (name) =>
    name.startsWith(".")
      ? load(path.join(path.dirname(file), name) + ".ts")
      : name.startsWith("@/")
        ? load(name.slice(2) + ".ts")
        : require(name);
  new Function("exports", "require", "module", output)(m.exports, req, m);
  return m.exports;
}
/** rand แบบกำหนดผลได้ (LCG) ให้เทสต์ซ้ำได้ */
const seeded = (seed) => {
  // กระจาย seed ก่อน ไม่งั้นค่าแรกของ seed ใกล้กันจะเกือบเท่ากัน
  let x = (seed * 2654435761 + 12345) % 4294967296;
  const next = () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
  for (let i = 0; i < 4; i++) next();
  return next;
};
const overlap = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const { maskStats } = load("lib/ghost-cam/mask.ts");
const { planGhost } = load("lib/ghost-cam/placement.ts");
const { ghostSprites } = load("lib/ghost-cam/ghost-config.ts");

/** mask ขนาด w×h ที่มีคนเป็นสี่เหลี่ยม x0..x1-1, y0..y1-1 */
function rectMask(w, h, x0, x1, y0, y1) {
  const m = new Float32Array(w * h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * w + x] = 1;
  return m;
}

// maskStats
const st = maskStats(rectMask(100, 100, 40, 60, 30, 100), 100, 100);
assert.deepEqual(st.person, { x: 40, y: 30, w: 20, h: 70 });
assert.equal(st.freeLeft, 40);
assert.equal(st.freeRight, 40);
assert.ok(Math.abs(st.coverage - 0.14) < 1e-9);
assert.ok(st.head.y === 30 && st.head.h > 0 && st.head.h <= 70 * 0.22 + 1);
assert.equal(maskStats(new Float32Array(100 * 100), 100, 100), null);

// sprites: ต้องมีอย่างน้อยหนึ่งตัวต่อ behind/far/edge
for (const kind of ["behind", "far", "edge"])
  assert.ok(
    ghostSprites.some((s) => s.kind === kind),
    kind,
  );
for (const s of ghostSprites) assert.ok(s.id && s.src && s.kind);

const W = 600;
const H = 800;
const noHand = ghostSprites.filter((s) => s.kind !== "hand");

// ไม่เจอคน → มุมจอ
assert.equal(
  planGhost(null, W, H, noHand, { figure: false, rand: seeded(1) }).variant,
  "edge",
);

// คนเต็มจอ (90% ความกว้าง) → มุมจอ (Review Focus 3)
const full = maskStats(rectMask(W, H, 30, 570, 100, H), W, H);
for (let i = 0; i < 50; i++)
  assert.equal(
    planGhost(full, W, H, noHand, { figure: false, rand: seeded(i) }).variant,
    "edge",
  );

// คนชิดซ้าย → ไม่มีวาง behind-left
const left = maskStats(rectMask(W, H, 0, 220, 150, H), W, H);
for (let i = 0; i < 200; i++)
  assert.notEqual(
    planGhost(left, W, H, noHand, { figure: false, rand: seeded(i) }).variant,
    "behind-left",
  );

// คนกลางจอ: ไม่ทับหัว, ความจางอยู่ในช่วง, แต่ละแบบถูกเลือกได้
const mid = maskStats(rectMask(W, H, 220, 380, 180, H), W, H);
const seen = new Set();
for (let i = 0; i < 500; i++) {
  const p = planGhost(mid, W, H, ghostSprites, {
    figure: false,
    rand: seeded(i),
  });
  seen.add(p.variant);
  if (p.variant !== "hand")
    assert.ok(!overlap(p.box, mid.head), `${p.variant} covers the head`);
  assert.ok(p.opacity >= 0.45 && p.opacity <= 0.7, String(p.opacity));
  assert.ok(p.blurPx >= 1.5 && p.blurPx <= 4);
  assert.ok(p.sprite && p.sprite.kind === kindOf(p.variant), p.variant);
}
for (const v of ["behind-left", "behind-right", "far", "edge"])
  assert.ok(seen.has(v), `never chose ${v}`);
function kindOf(v) {
  return v.startsWith("behind") ? "behind" : v;
}

// ไม่มีมือในรายการ → ไม่เลือก hand
for (let i = 0; i < 300; i++)
  assert.notEqual(
    planGhost(mid, W, H, noHand, { figure: false, rand: seeded(i) }).variant,
    "hand",
  );

// เซลฟี่: ไหล่เต็มความกว้างด้านล่าง แต่ข้างหัวมีที่ว่าง → ต้องวางผีหลังไหล่ได้ (สิ่งที่เจ้าของงานเน้น)
function selfieMask(w, h) {
  const m = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const head = y >= 80 && y < 300 && x >= 200 && x < 400;
      const body = y >= 300 && x >= 20 && x < 590;
      if (head || body) m[y * w + x] = 1;
    }
  return m;
}
const selfie = maskStats(selfieMask(W, H), W, H);
assert.equal(selfie.freeLeft, 200); // วัดที่ระดับหัว ไม่ใช่ทั้งตัว
assert.equal(selfie.freeRight, 200);
const selfieSeen = new Set();
for (let i = 0; i < 300; i++) {
  const p = planGhost(selfie, W, H, noHand, { figure: false, rand: seeded(i) });
  selfieSeen.add(p.variant);
  assert.ok(!overlap(p.box, selfie.head), `${p.variant} covers the head`);
  if (p.variant === "edge") {
    // มุมจอต้องอยู่ช่วงข้างหัว (ด้านล่างโดนไหล่บังหมด)
    assert.ok(p.box.y < selfie.head.y + selfie.head.h, "edge hidden by shoulders");
  }
}
assert.ok(selfieSeen.has("behind-left") && selfieSeen.has("behind-right"));
// ผีไกลในเซลฟี่: อยู่ในที่ว่างข้างหัว ไม่ชิดมุมภาพ
for (let i = 0; i < 200; i++) {
  const p = planGhost(selfie, W, H, noHand, { figure: false, rand: seeded(i) });
  if (p.variant !== "far") continue;
  const inLeft = p.box.x + p.box.w <= selfie.head.x + 1;
  const inRight = p.box.x >= selfie.head.x + selfie.head.w - 1;
  assert.ok(inLeft || inRight, "far ghost not beside the head");
  assert.ok(p.box.y >= H * 0.05, "far ghost jammed in the corner");
}
// ผีหลังไหล่ต้องอยู่ในภาพอย่างน้อยครึ่งหนึ่ง และชิดข้างหัว
for (let i = 0; i < 200; i++) {
  const p = planGhost(selfie, W, H, noHand, { figure: false, rand: seeded(i) });
  if (p.variant === "behind-left") {
    assert.ok(p.box.x + p.box.w / 2 >= 0, "mostly off-frame");
    assert.ok(Math.abs(p.box.x + p.box.w - selfie.head.x) < 1);
  }
  if (p.variant === "behind-right") {
    assert.ok(p.box.x + p.box.w / 2 <= W, "mostly off-frame");
    assert.ok(Math.abs(p.box.x - (selfie.head.x + selfie.head.w)) < 1);
  }
}

// ฉากจบผีชุดดำ
const fig = planGhost(mid, W, H, ghostSprites, {
  figure: true,
  rand: seeded(3),
});
assert.equal(fig.variant, "figure");
// ฉากจบ: ผีผมยาว (เห็นได้แม้ฉากหลังมืด) ยืนชิดข้างหัวพอดี ใหญ่และชัดกว่าผีปกติ
assert.equal(fig.sprite.kind, "behind");
assert.ok(fig.opacity >= 0.8);
assert.ok(!overlap(fig.box, mid.head));
assert.ok(
  Math.abs(fig.box.x + fig.box.w - mid.head.x) < 1 ||
    Math.abs(fig.box.x - (mid.head.x + mid.head.w)) < 1,
);
assert.ok(fig.box.h > mid.head.h * 3.4);
const figNone = planGhost(null, W, H, ghostSprites, {
  figure: true,
  rand: seeded(3),
});
assert.equal(figNone.variant, "figure");

// compose-math: ปรับความสว่างผีให้ peak ≈ ฉากหลัง × 1.35, กลับซ้ายขวา
const { matchBrightness, flipBox } = load("lib/ghost-cam/compose-math.ts");
assert.ok(Math.abs(255 * matchBrightness(255, 40) - 170) < 0.5); // ฉากหลัง + 130
assert.ok(Math.abs(255 * matchBrightness(255, 10) - 140) < 0.5);
assert.ok(matchBrightness(255, 240) <= 1); // ไม่สว่างเกินต้นฉบับ
assert.ok(matchBrightness(255, 0) > 0); // รูปมืดสนิทยังเห็นผีจาง ๆ
assert.equal(matchBrightness(0, 40), 0);
assert.deepEqual(flipBox({ x: 10, y: 5, w: 100, h: 50 }, 600), {
  x: 490,
  y: 5,
  w: 100,
  h: 50,
});

// camera-flow: สถานะหน้ากล้อง
const { nextCam } = load("lib/ghost-cam/camera-flow.ts");
const flow = [
  ["idle", "open", "starting"],
  ["starting", "granted", "live"],
  ["starting", "denied", "unavailable"],
  ["live", "shoot", "developing"],
  ["developing", "developed", "result"],
  ["result", "retake", "starting"],
  ["live", "close", "idle"],
  ["result", "close", "idle"],
  ["unavailable", "close", "idle"],
  ["idle", "shoot", "idle"],
  ["developing", "shoot", "developing"],
  ["live", "open", "live"],
  ["unavailable", "granted", "unavailable"],
];
for (const [from, ev, to] of flow)
  assert.equal(nextCam(from, ev), to, `${from} + ${ev}`);

console.log("Ghost camera logic checks passed.");
