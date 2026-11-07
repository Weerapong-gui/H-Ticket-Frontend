/* eslint-disable @typescript-eslint/no-require-imports -- standalone mocked API contract checks */
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
  const result = { exports: {} };
  new Function("exports", "require", "module", output)(
    result.exports,
    (name) =>
      name === "./api-contract" ? load("lib/api-contract.ts") : require(name),
    result,
  );
  return result.exports;
}
const m = { exports: load("lib/api.ts") };
const {
  api,
  ApiError,
  setAdminToken,
  getAdminToken,
  clearAdminToken,
  API_URL,
} = m.exports;
const storage = new Map();
global.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
let redirected = "";
global.window = {
  location: {
    pathname: "/admin/orders",
    replace: (path) => {
      redirected = path;
    },
  },
};
let calls = [];
let next;
global.fetch = async (url, init) => {
  calls.push({ url, init });
  if (next instanceof Error) throw next;
  return new Response(next?.body ?? JSON.stringify(next?.data ?? {}), {
    status: next?.status ?? 200,
    headers: { "Content-Type": next?.type ?? "application/json" },
  });
};
const ticket = {
  ticket_no: 12,
  ticket_label: "012",
  name: "Test Student",
  student_id: "6831501178",
  picked_up: false,
};
const response = (data, status = 200) => {
  next = { data, status };
};
const last = () => calls.at(-1);
async function main() {
  response({
    open: true,
    closed_forever: false,
    total: 600,
    sold: 42,
    remaining: 558,
  });
  await api.sales();
  assert.equal(last().url, `${API_URL}/api/sales`);
  assert.equal(last().init.cache, "no-store");
  const original = new File(
    [new Uint8Array([137, 80, 78, 71, 0, 1, 2, 255])],
    "original.png",
    { type: "image/png" },
  );
  response(ticket, 201);
  assert.deepEqual(
    await api.createOrder({
      name: " Test Student ",
      student_id: " 6831501178 ",
      phone: " 0812345678 ",
      slip: original,
    }),
    ticket,
  );
  assert.equal(last().url, `${API_URL}/api/orders`);
  assert.equal(last().init.method, "POST");
  assert.ok(last().init.body instanceof FormData);
  assert.equal(
    last().init.headers.has("Content-Type"),
    false,
    "Browser must set multipart boundary",
  );
  assert.equal(last().init.body.get("name"), "Test Student");
  assert.equal(last().init.body.get("student_id"), ticket.student_id);
  assert.equal(last().init.body.get("phone"), "0812345678");
  assert.deepEqual(
    new Uint8Array(await last().init.body.get("slip").arrayBuffer()),
    new Uint8Array(await original.arrayBuffer()),
    "Upload must preserve every original byte",
  );
  assert.equal(last().init.body.has("quantity"), false);
  response(ticket);
  assert.deepEqual(await api.ticket(" 6831501178 "), ticket);
  assert.equal(last().url, `${API_URL}/api/tickets/6831501178`);
  const errors = [
    [400, "invalid_input"],
    [403, "sales_closed"],
    [422, "invalid_slip"],
    [409, "duplicate_slip"],
    [409, "already_has_ticket"],
    [409, "sold_out"],
    [500, "internal"],
    [404, "not_found"],
  ];
  for (const [status, code] of errors) {
    response(
      {
        code,
        message: "ข้อความจาก backend",
        contact: "staff-contact",
        ticket_label: "012",
      },
      status,
    );
    await assert.rejects(
      () => api.ticket(ticket.student_id),
      (e) =>
        e instanceof ApiError &&
        e.status === status &&
        e.data.code === code &&
        e.message === "ข้อความจาก backend" &&
        e.data.contact === "staff-contact" &&
        e.data.ticket_label === "012",
    );
  }
  response({ token: "test-token" });
  assert.equal((await api.login("test-only")).token, "test-token");
  assert.equal(last().url, `${API_URL}/api/admin/login`);
  assert.deepEqual(JSON.parse(last().init.body), { password: "test-only" });
  assert.equal(last().init.headers.has("Authorization"), false);
  response(
    { code: "too_many_attempts", message: "รอก่อน", retry_after_secs: 37 },
    429,
  );
  await assert.rejects(
    () => api.login("test-only"),
    (e) => e.data.retry_after_secs === 37,
  );
  setAdminToken("test-token");
  response({
    open: true,
    closed_forever: false,
    total: 600,
    sold: 42,
    remaining: 558,
    cancelled: 3,
    picked_up: 10,
    free_numbers: [7, 43, 44],
  });
  await api.stats();
  assert.equal(last().init.headers.get("Authorization"), "Bearer test-token");
  assert.equal(last().url, `${API_URL}/api/admin/stats`);
  response([]);
  await api.orders("ชื่อ & 012", "active");
  const search = new URL(last().url).searchParams;
  assert.equal(search.get("q"), "ชื่อ & 012");
  assert.equal(search.get("status"), "active");
  await api.rejected();
  assert.equal(last().url, `${API_URL}/api/admin/rejected`);
  response({ open: true, closed_forever: false });
  await api.setSales(true);
  assert.equal(last().init.method, "PUT");
  assert.deepEqual(JSON.parse(last().init.body), { open: true });
  await api.closeForever();
  assert.equal(last().url, `${API_URL}/api/admin/sales/close-forever`);
  assert.equal(last().init.method, "POST");
  response({
    id: "order-id",
    ticket_no: 12,
    ticket_label: "012",
    status: "active",
    name: "Test Student",
    student_id: "6831501178",
    phone: "0812345678",
    created_at: "2026-11-08T03:12:45.123Z",
    cancelled_at: null,
    cancel_reason: null,
    picked_up_at: null,
  });
  await api.cancel("order/id", " reason ");
  assert.ok(last().url.endsWith("/api/admin/orders/order%2Fid/cancel"));
  assert.deepEqual(JSON.parse(last().init.body), { reason: "reason" });
  await api.pickup("order-id", true);
  assert.deepEqual(JSON.parse(last().init.body), { picked_up: true });
  await api.pickup("order-id", false);
  assert.deepEqual(JSON.parse(last().init.body), { picked_up: false });
  next = { body: "original-slip-bytes", type: "image/png" };
  const blob = await api.slip("order-id");
  assert.ok(blob instanceof Blob);
  assert.equal(await blob.text(), "original-slip-bytes");
  assert.equal(last().init.headers.get("Authorization"), "Bearer test-token");
  await api.slip("rejected-id", true);
  assert.ok(last().url.endsWith("/api/admin/rejected/rejected-id/slip"));
  response({ code: "unauthorized", message: "หมดอายุ" }, 401);
  await assert.rejects(
    () => api.stats(),
    (e) => e.status === 401,
  );
  assert.equal(getAdminToken(), null);
  assert.equal(redirected, "/admin/login");
  next = new Error("offline");
  await assert.rejects(
    () => api.sales(),
    (e) => e instanceof ApiError && e.data.code === "network",
  );
  next = { body: "not-json", status: 500 };
  await assert.rejects(
    () => api.sales(),
    (e) => e.data.code === "internal",
  );
  // Reject incomplete or contradictory success payloads instead of inventing data.
  for (const payload of [
    null,
    {},
    { open: "true", total: 600 },
    { open: true, closed_forever: false, total: 600, sold: 0, remaining: -1 },
  ]) {
    response(payload);
    await assert.rejects(
      () => api.sales(),
      (e) => e.data.code === "invalid_response",
    );
  }
  for (const payload of [
    { ...ticket, ticket_label: "12" },
    { ...ticket, ticket_no: 601, ticket_label: "601" },
    { ...ticket, student_id: "bad" },
    { ...ticket, picked_up: undefined },
  ]) {
    response(payload);
    await assert.rejects(
      () => api.ticket(ticket.student_id),
      (e) => e.data.code === "invalid_response",
    );
  }
  response({ token: "" });
  await assert.rejects(
    () => api.login("test-only"),
    (e) => e.data.code === "invalid_response",
  );
  response({ unexpected: "object" });
  await assert.rejects(
    () => api.orders(),
    (e) => e.data.code === "invalid_response",
  );
  response({ total: 600 });
  await assert.rejects(
    () => api.stats(),
    (e) => e.data.code === "invalid_response",
  );
  next = { body: "not-json", status: 200 };
  await assert.rejects(
    () => api.sales(),
    (e) => e.data.code === "invalid_response",
  );
  // An external cancellation signal must not accidentally disable the timeout.
  const originalFetch = global.fetch;
  const originalTimeout = AbortSignal.timeout;
  try {
    const deadline = new AbortController();
    AbortSignal.timeout = () => deadline.signal;
    global.fetch = async (_url, init) =>
      new Promise((_resolve, reject) => {
        if (init.signal.aborted) reject(init.signal.reason);
        else
          init.signal.addEventListener(
            "abort",
            () => reject(init.signal.reason),
            { once: true },
          );
      });
    const caller = new AbortController();
    const timedRequest = api.sales(caller.signal);
    deadline.abort(new DOMException("Timed out", "TimeoutError"));
    await assert.rejects(
      () => timedRequest,
      (e) => e.data.code === "network",
    );
    const cancelled = new AbortController();
    cancelled.abort(new DOMException("Cancelled", "AbortError"));
    await assert.rejects(
      () => api.sales(cancelled.signal),
      (e) => e.name === "AbortError",
    );
  } finally {
    global.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
  }
  clearAdminToken();
  console.log(
    "Mocked contracts passed for buyer and all admin endpoints, multipart bytes, error codes/contact, 429 retry data, bearer authentication, slip blobs, 401 logout, malformed-response handling and timeout/cancellation. No real backend mutations were made.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
