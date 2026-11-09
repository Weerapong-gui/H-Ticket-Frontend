import type {
  AdminStats,
  IssuedTicket,
  Order,
  RejectedAttempt,
  SalesStatus,
} from "./api";

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const count = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === "string";
const nullableText = (value: unknown) => value === null || text(value);
const ticketNumber = (value: Record<string, unknown>) =>
  count(value.ticket_no) &&
  value.ticket_no >= 1 &&
  value.ticket_no <= 600 &&
  value.ticket_label === String(value.ticket_no).padStart(3, "0");

export function isSalesStatus(value: unknown): value is SalesStatus {
  return (
    record(value) &&
    typeof value.open === "boolean" &&
    typeof value.closed_forever === "boolean" &&
    count(value.total) &&
    count(value.sold) &&
    count(value.remaining) &&
    value.sold <= value.total &&
    value.remaining <= value.total
  );
}
export function isIssuedTicket(value: unknown): value is IssuedTicket {
  return (
    record(value) &&
    ticketNumber(value) &&
    text(value.name) &&
    !!value.name.trim() &&
    text(value.student_id) &&
    /^\d{10}$/.test(value.student_id) &&
    typeof value.picked_up === "boolean" &&
    (value.group === undefined ||
      (Array.isArray(value.group) &&
        value.group.every(
          (g) => record(g) && text(g.ticket_label) && text(g.name),
        ))) &&
    (value.tickets === undefined ||
      (Array.isArray(value.tickets) && value.tickets.every(isIssuedTicket)))
  );
}
export function isLoginResult(value: unknown): value is { token: string } {
  return record(value) && text(value.token) && !!value.token.trim();
}
export function isSalesFlags(
  value: unknown,
): value is Pick<SalesStatus, "open" | "closed_forever"> {
  return (
    record(value) &&
    typeof value.open === "boolean" &&
    typeof value.closed_forever === "boolean"
  );
}
export function isAdminStats(value: unknown): value is AdminStats {
  if (!record(value)) return false;
  const data = value;
  return (
    isSalesStatus(value) &&
    count(data.cancelled) &&
    count(data.picked_up) &&
    Array.isArray(data.free_numbers) &&
    data.free_numbers.every((n) => count(n) && n >= 1 && n <= value.total)
  );
}
export function isOrder(value: unknown): value is Order {
  return (
    record(value) &&
    text(value.id) &&
    ticketNumber(value) &&
    (value.status === "active" || value.status === "cancelled") &&
    text(value.name) &&
    text(value.student_id) &&
    text(value.phone) &&
    text(value.created_at) &&
    nullableText(value.cancelled_at) &&
    nullableText(value.cancel_reason) &&
    nullableText(value.picked_up_at)
  );
}
export const isOrders = (value: unknown): value is Order[] =>
  Array.isArray(value) && value.every(isOrder);
export function isRejectedAttempts(value: unknown): value is RejectedAttempt[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        record(item) &&
        text(item.id) &&
        ["invalid_slip", "duplicate_slip", "already_has_ticket"].includes(
          String(item.reason),
        ) &&
        text(item.name) &&
        text(item.student_id) &&
        text(item.phone) &&
        text(item.created_at),
    )
  );
}
