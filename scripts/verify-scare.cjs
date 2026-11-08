/* eslint-disable @typescript-eslint/no-require-imports -- standalone scare logic checks */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const m = { exports: {} };
  new Function("exports", "require", "module", output)(m.exports, require, m);
  return m.exports;
}
const seq = (...xs) => {
  let i = 0;
  return () => xs[i++];
};

const {
  FIGURE_GONE,
  initialFigure,
  registerReturn,
  revealPending,
  consumeMirror,
  parseFigure,
  serializeFigure,
} = load("lib/scare/figure-state.ts");
const { shouldWhisper, createScrollGate } = load("lib/scare/whisper-policy.ts");
const { canShoot, planShot } = load("lib/scare/shot-policy.ts");
const { KEYS, readKey, writeKey, ENTRY_GATE_SCRIPT } = load(
  "lib/scare/storage.ts",
);

// figure-state
let s = { ...initialFigure, lastSeenAt: 0 };
assert.deepEqual(registerReturn(s, 19_999), s); // Review Focus 3
s = registerReturn(s, 20_000);
assert.equal(s.pending, 1);
assert.equal(s.step, 0);
s = revealPending(s);
assert.equal(s.step, 1);
assert.equal(s.pending, 0);
assert.equal(registerReturn(initialFigure, 99_999).pending, 0); // never seen before
let far = { step: 5, pending: 0, mirrorArmed: false, lastSeenAt: 0 };
for (let i = 0; i < 10; i++)
  far = registerReturn({ ...far, lastSeenAt: 0 }, 60_000);
assert.equal(far.step + far.pending, FIGURE_GONE); // Review Focus 4
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
  {
    kind: "photo",
    photoIndex: 0,
    ghostSpot: null,
  },
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
writeKey(throwing, KEYS.entered, "1"); // must not throw
assert.equal(readKey(null, KEYS.entered), null);
const mem = new Map();
const kv = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, v),
};
writeKey(kv, KEYS.muted, "1");
assert.equal(readKey(kv, KEYS.muted), "1");
// review fix: at most one pending step per sighting (several returns while scrolled away = 1 step)
let away = { ...initialFigure, step: 2, lastSeenAt: 0 };
away = registerReturn(away, 30_000);
away = registerReturn({ ...away, lastSeenAt: 0 }, 60_000);
away = registerReturn({ ...away, lastSeenAt: 0 }, 90_000);
assert.equal(away.pending, 1);

// review fix: one whisper roll per scroll gesture, not per scroll event
const gate = createScrollGate(1_000);
assert.equal(gate(0), true);
assert.equal(gate(100), false);
assert.equal(gate(900), false);
assert.equal(gate(1_950), true); // >1s since the last scroll event = new gesture
assert.equal(gate(2_000), false);

// review fix: a photo with no ghost spots never yields a ghost
assert.deepEqual(
  planShot(1, 2, [2, 0], false, () => 0.1),
  {
    kind: "photo",
    photoIndex: 1,
    ghostSpot: null,
  },
);
// review fix: pre-paint script marks returning visitors, and never throws when storage is blocked
function runGateScript(storage) {
  const attrs = {};
  const document = {
    documentElement: { setAttribute: (k, v) => (attrs[k] = v) },
  };
  new Function("localStorage", "document", ENTRY_GATE_SCRIPT)(
    storage,
    document,
  );
  return attrs;
}
assert.deepEqual(runGateScript({ getItem: () => "1" }), {
  "data-hh-entered": "",
});
assert.deepEqual(runGateScript({ getItem: () => null }), {});
assert.deepEqual(runGateScript(throwing), {});
console.log("Scare logic checks passed.");
