# The Haunted House

Cinematic Next.js website with a student demo booking flow and retained backend integration tools.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Requires Node.js 20.9 or newer.

## Current multi-student demo flow

`/booking` → `/checkout` (one student form per ticket) → validate unique IDs → review all students → `/confirmation` (one ticket/QR per student)

- One Early Bird - Single Ticket option at 30 THB per person, quantity 1–10. Each ticket requires a separate, unique student ID.
- Increasing quantity preserves existing student records. Decreasing quantity requests confirmation before removing filled records; cancelling preserves both quantity and data.
- Required full name, string student ID and Thai mobile (06/08/09, ten digits) are validated per student. Leading zeros are retained. An optional ID length can be set in `eventConfig.studentIdLength`; `null` means unspecified.
- Duplicate IDs within the batch and already-confirmed demo IDs in this tab are rejected before review and revalidated at confirmation.
- Confirmation creates a distinct UUID-based demo ticket ID and reference-only QR for each student. Names and masked IDs/phones are displayed, plus the booking reference and total. Every QR is marked DEMO / NOT VALID FOR ENTRY and contains no student ID or phone.
- No student records are requested from the backend to check duplicates. The existing ticket-lookup API returns personal data and is deliberately not used as an eligibility API. Real cross-user eligibility and transactional uniqueness remain backend work; see [PRODUCTION_UNIQUENESS.md](PRODUCTION_UNIQUENESS.md).
- Drafts, the current confirmation and the used-ID registry stay only in React memory. Back navigation retains drafts. Starting another demo retains used IDs but discards previous names/phones from the active state. The explicit clear action, refresh or tab close erases the demo data. No personal data is stored in URLs, browser storage or logs by this demo.
- Event date/time/location come from `lib/event-config.ts` (still `To be announced` until supplied). No calendar/time slot controls or price changes were added.
- This demo makes no real order/payment request and issues no valid admission tickets.

`components/demo-booking-provider.tsx` owns the in-memory state and removal confirmation. `lib/demo-booking.ts` owns batch validation, duplicate checks, quantity transitions, totals, masked data and atomic demo confirmation. `components/student-fields.tsx` and `components/individual-demo-ticket.tsx` provide the reusable per-student form and ticket.

## Backend team integration (retained separately)

`/ticket` and `/ticket/[studentId]` look up backend-issued tickets. `/admin/login`, `/admin`, `/admin/orders` and `/admin/rejected` retain the API-connected staff tools. These routes need the Rust service. The backend's one-ticket-per-student restriction is independent from the requested 1–10 quantity **demo**; the demo checkout never submits those quantities to that API.

Copy `.env.example` to `.env.local` to set `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`). Restart or rebuild after changing the public environment value. Backend implementation and startup remain with the backend team; see `docs/BACKEND_API.md` and [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md).

`lib/api.ts` owns API/error/token handling; `lib/api-contract.ts` checks response shapes. Staff requests use bearer tokens in sessionStorage and clear them on 401. Authenticated slip images use revocable blob URLs. Backend order adapters preserve original multipart slip bytes. Those adapters are not used by the current demo checkout.

## Verification

```sh
npm run test:demo
npm run test:booking
npm run test:api
npm run lint
npm run typecheck
npm run build
npm start
```

Demo tests cover per-student validation, optional configured ID length, quantity/data preservation, removal planning, local and previously-confirmed duplicates, repeated confirmation, individual ticket IDs/QRs, masking and totals. API tests use mocked fetch and make no real purchases or backend changes. Before production, coordinate a separate real purchase flow with the backend team and provide confirmed event and payment details; demo confirmations and QR codes must remain invalid for admission.
