/* eslint-disable @typescript-eslint/no-require-imports -- standalone multi-student demo checks */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const QRCode = require("qrcode");
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const result = { exports: {} };
  new Function("exports", "require", "module", output)(
    result.exports,
    (name) =>
      name === "./event-config" ? load("lib/event-config.ts") : require(name),
    result,
  );
  return result.exports;
}
const {
  emptyStudent,
  validateStudent,
  validateStudents,
  numericOnly,
  validQuantity,
  demoTotal,
  createDemoBooking,
  maskStudentId,
  maskPhone,
  demoQrPayload,
  resizeStudents,
  needsRemovalConfirmation,
  confirmDemoState,
  initialDemoState,
  DUPLICATE_ID_ERROR,
  USED_ID_ERROR,
} = load("lib/demo-booking.ts");
const student = (index) => ({
  fullName: `  Demo Student ${index}  `,
  studentId: `00${String(index).padStart(5, "0")}`,
  phone: "0812345678",
});
const ids = (count) =>
  Array.from({ length: count }, (_, index) => `HH-DEMO-TICKET-${index + 1}`);
assert.deepEqual(validateStudent(student(1)), {});
assert.equal(numericOnly("00 12a-345"), "0012345");
assert.deepEqual(Object.keys(validateStudent(emptyStudent)).sort(), [
  "fullName",
  "phone",
  "studentId",
]);
for (const studentId of ["0", "0001", "001234567", "000123456789012345"])
  assert.deepEqual(validateStudent({ ...student(1), studentId }), {});
assert.ok(validateStudent({ ...student(1), studentId: "001ABC" }).studentId);
assert.ok(
  validateStudent(student(1), 10).studentId,
  "Optional configured length is respected",
);
assert.deepEqual(
  validateStudent({ ...student(1), studentId: "0012345678" }, 10),
  {},
);
for (const phone of ["0612345678", "0812345678", "0912345678"])
  assert.deepEqual(validateStudent({ ...student(1), phone }), {});
for (const phone of [
  "0212345678",
  "0712345678",
  "081234567",
  "08123456789",
  "+66812345678",
])
  assert.ok(validateStudent({ ...student(1), phone }).phone);
for (let quantity = 1; quantity <= 10; quantity++) {
  const students = Array.from({ length: quantity }, (_, index) =>
    student(index + 1),
  );
  const booking = createDemoBooking(students, "HH-DEMO-BOOKING", ids(quantity));
  assert.equal(validQuantity(quantity), true);
  assert.equal(demoTotal(quantity), 30 * quantity);
  assert.equal(booking.quantity, quantity);
  assert.equal(booking.tickets.length, quantity);
  assert.equal(new Set(booking.tickets.map((t) => t.id)).size, quantity);
  booking.tickets.forEach((ticket, index) => {
    assert.equal(ticket.fullName, `Demo Student ${index + 1}`);
    assert.equal(ticket.studentId, students[index].studentId);
    assert.ok(ticket.studentId.startsWith("00"));
    const payload = demoQrPayload(ticket.id);
    assert.ok(payload.includes("DEMO / NOT VALID FOR ENTRY"));
    assert.ok(payload.includes(ticket.id));
    for (const item of students) {
      assert.ok(!payload.includes(item.studentId));
      assert.ok(!payload.includes(item.phone));
      assert.ok(!payload.includes(item.fullName.trim()));
    }
  });
}
for (const value of [0, 11, 1.5, NaN, Infinity])
  assert.equal(validQuantity(value), false);
const original = [student(1), student(2)];
const increased = resizeStudents(original, 3);
assert.deepEqual(increased.slice(0, 2), original);
assert.deepEqual(increased[2], emptyStudent);
assert.equal(original.length, 2);
assert.equal(needsRemovalConfirmation(original, 3), false);
assert.equal(needsRemovalConfirmation(increased, 2), false);
assert.equal(needsRemovalConfirmation(original, 1), true);
assert.deepEqual(
  original,
  [student(1), student(2)],
  "Planning/cancelling removal leaves entered data intact",
);
assert.deepEqual(resizeStudents(original, 1), [student(1)]);
assert.throws(() => resizeStudents(original, 0));
const duplicate = [
  student(1),
  { ...student(2), studentId: ` ${student(1).studentId} ` },
];
const duplicateErrors = validateStudents(duplicate);
assert.equal(duplicateErrors[0].studentId, DUPLICATE_ID_ERROR);
assert.equal(duplicateErrors[1].studentId, DUPLICATE_ID_ERROR);
assert.throws(() => createDemoBooking(duplicate, "HH-DEMO-BOOKING", ids(2)));
assert.throws(() =>
  createDemoBooking(original, "HH-DEMO-BOOKING", [
    "HH-DEMO-TICKET-SAME",
    "HH-DEMO-TICKET-SAME",
  ]),
);
assert.throws(() => createDemoBooking([], "HH-DEMO-BOOKING", []));
assert.throws(() => createDemoBooking(original, "HH-DEMO-BOOKING", ids(1)));
const initial = { ...initialDemoState(), students: original };
const confirmed = confirmDemoState(initial, "HH-DEMO-FIRST", ids(2));
assert.equal(confirmed.usedIds.size, 2);
assert.equal(initial.usedIds.size, 0);
assert.equal(confirmed.completed.tickets.length, 2);
assert.throws(
  () =>
    confirmDemoState(confirmed, "HH-DEMO-REPEAT", [
      "HH-DEMO-TICKET-NEW1",
      "HH-DEMO-TICKET-NEW2",
    ]),
  "Immediate repeated confirmation cannot issue duplicate active demo tickets",
);
const repeatedErrors = validateStudents(
  [student(1), student(3)],
  confirmed.usedIds,
);
assert.equal(repeatedErrors[0].studentId, USED_ID_ERROR);
assert.deepEqual(repeatedErrors[1], {});
assert.throws(() =>
  createDemoBooking(
    [student(1)],
    "HH-DEMO-REPEAT",
    ["HH-DEMO-TICKET-NEW"],
    confirmed.usedIds,
  ),
);
const next = confirmDemoState(
  { ...confirmed, students: [student(3)] },
  "HH-DEMO-SECOND",
  ["HH-DEMO-TICKET-THREE"],
);
assert.equal(next.usedIds.size, 3);
assert.equal(next.completed.tickets[0].studentId, student(3).studentId);
assert.equal(maskStudentId("001234567"), "•••• 4567");
assert.equal(maskPhone("0812345678"), "••••••5678");
Promise.all(
  confirmed.completed.tickets.map((ticket) =>
    QRCode.toDataURL(demoQrPayload(ticket.id)),
  ),
)
  .then((images) => {
    assert.equal(new Set(images).size, 2);
    for (const url of images)
      assert.ok(url.startsWith("data:image/png;base64,"));
    console.log(
      "Multi-student demo checks passed: dynamic forms, quantity preservation/removal planning, numeric IDs, configured length, local/prior-booking duplicates, atomic demo confirmation, individual IDs/QRs, masking and totals.",
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
