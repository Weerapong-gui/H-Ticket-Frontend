/* eslint-disable @typescript-eslint/no-require-imports -- standalone contract checks */
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
  new Function("exports", "require", "module", output)(
    m.exports,
    (name) =>
      name === "./event-config" ? load("lib/event-config.ts") : require(name),
    m,
  );
  return m.exports;
}
const {
  TICKET_PRICE,
  tickets,
  money,
  validStudentId,
  validPhone,
  validateSlip,
  canOrder,
  salesMessage,
  numberRanges,
  thaiTime,
  MAX_SLIP_BYTES,
} = load("lib/booking.ts");
assert.deepEqual(Object.keys(tickets), ["earlybird"]);
assert.equal(TICKET_PRICE, 30);
assert.equal(money(TICKET_PRICE), "30 THB");
assert.equal(validStudentId(" 6831501178 "), true);
for (const value of ["", "123", "abcdefghij", "68315011789"])
  assert.equal(validStudentId(value), false);
assert.equal(validPhone(" 0812345678 "), true);
for (const value of ["+66812345678", "1812345678", "081234567", "abcdefghij"])
  assert.equal(validPhone(value), false);
for (const type of ["image/jpeg", "image/png", "image/webp"])
  assert.equal(validateSlip({ type, size: MAX_SLIP_BYTES }), null);
assert.ok(validateSlip(null));
assert.ok(validateSlip({ type: "image/gif", size: 10 }));
assert.ok(validateSlip({ type: "image/png", size: 0 }));
assert.ok(validateSlip({ type: "image/png", size: MAX_SLIP_BYTES + 1 }));
const open = {
  open: true,
  closed_forever: false,
  total: 600,
  sold: 42,
  remaining: 558,
};
assert.equal(canOrder(open), true);
assert.equal(canOrder(null), false);
assert.equal(canOrder({ ...open, open: false }), false);
assert.equal(canOrder({ ...open, remaining: 0 }), false);
assert.equal(canOrder({ ...open, closed_forever: true }), false);
assert.equal(
  salesMessage({ ...open, open: false }),
  "ยังไม่เปิดขาย / ปิดขายชั่วคราว",
);
assert.equal(salesMessage({ ...open, remaining: 0 }), "บัตรหมดแล้ว");
assert.equal(
  salesMessage({ ...open, closed_forever: true, remaining: 0 }),
  "ปิดขายผ่านเว็บแล้ว ซื้อได้ที่หน้างาน",
);
assert.equal(numberRanges([7, 43, 44, 45, 600, 7]), "007, 043–045, 600");
assert.equal(numberRanges([]), "");
assert.equal(numberRanges([3, 1, 2]), "001–003");
assert.ok(thaiTime("2026-11-08T03:12:45.123Z").includes("10:12"));
console.log(
  "Buyer validation, original slip constraints, sales states, free-number ranges and Thai time checks passed.",
);
