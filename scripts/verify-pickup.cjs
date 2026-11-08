/* eslint-disable @typescript-eslint/no-require-imports -- standalone pickup logic checks */
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
const { parseScan, resolvePickup, confirmPickup, acceptScan } =
  load("lib/pickup.ts");

(async () => {
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
    resolvePickup("6831501178", [
      order({ picked_up_at: "2026-11-08T12:00:00Z" }),
    ]).kind,
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
  assert.equal(
    acceptScan("6700000000", 10, { text: "6831501178", at: 0 }),
    true,
  );
  console.log("Pickup logic checks passed.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
