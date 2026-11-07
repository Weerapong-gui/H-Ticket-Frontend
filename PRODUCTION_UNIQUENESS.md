# Production uniqueness handoff — ONE STUDENT ID = ONE TICKET

The backend is owned by another team. This change implements a multi-student **demo** only; it does not modify the backend, create a database or claim cross-user uniqueness.

## Implemented in this frontend

- One student record per ticket, quantities 1–10, one ticket per distinct numeric student ID.
- Exact string IDs preserve leading zeros; outer whitespace is trimmed. Optional length comes from `eventConfig.studentIdLength` and defaults to `null` (unspecified).
- Duplicate IDs inside a batch are rejected on every affected field. Confirmed demo IDs in this tab are also rejected with `รหัสนักศึกษานี้มีการจองตั๋วแล้ว ไม่สามารถจองซ้ำได้`.
- Demo confirmation revalidates the entire batch synchronously before one in-memory state commit. A repeated confirmation in the same tab cannot create a second active demo ticket for those IDs.
- Each student gets a separate random UUID-based ticket ID and QR. QR payloads contain only the random ticket ID plus `DEMO / NOT VALID FOR ENTRY`; no name, student ID or phone.
- Increasing quantity preserves prior records. Reducing quantity prompts before dropping any filled record. Cancelling keeps both the quantity and all data unchanged.
- Data and the duplicate registry exist only in React memory. Starting a new demo removes previous names/phones from the active draft but retains the used-ID set for this tab. `ล้างข้อมูลเดโมทั้งหมด`, refresh or closing the tab clears both. Cleared demos have no real admission validity.

## Existing API limitation

`GET /api/tickets/{student_id}` in `docs/BACKEND_API.md` returns a person's name and ticket details. The new duplicate checker **does not call it**. There is no documented privacy-safe batch eligibility or atomic multi-student order endpoint. The frontend therefore does not claim to check real existing bookings. Real ticket lookup and staff tools are retained separately.

## Required backend contract (to agree with the backend team)

1. Provide an authenticated, rate-limited eligibility check that accepts an event ID and student IDs in a POST body. Return only per-input eligibility/error codes, never student records, names, phones or ticket numbers. Do not put IDs in browser URLs or analytics. Eligibility is advisory, never a lock or issuance guarantee.
2. Accept a complete 1–10 student batch at confirmation. Validate event, quantity, every field, normalized student IDs and duplicates again on the server. The server owns price (30 THB), total and availability; do not trust client totals.
3. Require an idempotency key for confirmation. Repeated retries must return the same successful booking rather than issuing more tickets.
4. Execute the whole batch in **one database transaction**. Check capacity, acquire required locks, reserve/issue all tickets, enforce uniqueness, and commit together. A conflict must roll back the entire batch; do not issue only some students' tickets.
5. Enforce a database unique key/index on `(event_id, student_id)` for **active** records. For databases supporting partial unique indexes, scope it to explicit active states. Otherwise use a separate active-claim table with a unique `(event_id, student_id)` key, maintained transactionally. Application-only prechecks are insufficient against concurrent requests.
6. A uniqueness conflict should produce an HTTP 409 with a stable code and affected input indexes. Return no other student's details. The frontend can attach a Thai error to the corresponding submitted fields.

## Reservation lifecycle

The backend team must define explicit states and transitions. Recommended contract:

- `reserved`: active; a claim blocks a second reservation for the same event/ID.
- `confirmed`: active; one valid ticket exists for the claim.
- `used`: still blocks another ticket for the same event/ID, unless an explicit event policy says otherwise.
- `cancelled`: invalidate the token and release the active claim in the same transaction, with an auditable reason. A replacement may be booked only after that transaction commits.
- `expired`: invalidate the token and release the claim transactionally. A worker or the confirmation transaction must perform this transition; do not rely on a time-based frontend check or a dynamic `now()` database index predicate.

These are proposed production policies, not new implemented backend states. Existing `active`/`cancelled` API behavior must be reconciled before integration.

## Production QR and privacy

Issue opaque, cryptographically unpredictable tokens server-side and store only their hashes where practical. Tokens must not encode student IDs, names or phone numbers. Authorized staff validate event/status/token on the server. Entry uses an atomic compare-and-set transition so concurrent scans cannot admit the same ticket twice. Cancellation/expiry must invalidate entry immediately.

Require staff/owner authorization for personal records, TLS, no-store responses and redacted application/proxy logs. Separate operational ticket data from payment-slip retention. The organizer/backend team must define retention periods, deletion/anonymization jobs, access auditing and the treatment of cancelled/expired records and backups. Do not publish or expose student lists through an eligibility endpoint.

## Joint acceptance tests once the backend supports the contract

- Two simultaneous confirmations using the same `(event_id, student_id)` yield only one active claim.
- Duplicate IDs inside one batch and already-active IDs both reject the batch without partial issuance.
- Idempotent retries return the original ticket set.
- Cancelled/expired claims permit rebooking only after the atomic state change; used tickets stay blocked.
- Eligibility responses expose no student records.
- Each ticket has a separate token; duplicate concurrent entry scans admit at most once.

Until these backend/database checks pass, all tickets from this demo remain invalid for real admission.
