import {
  isSalesStatus,
  isIssuedTicket,
  isLoginResult,
  isSalesFlags,
  isAdminStats,
  isOrders,
  isOrder,
  isRejectedAttempts,
} from "./api-contract";
export type SalesStatus = {
  open: boolean;
  closed_forever: boolean;
  total: number;
  sold: number;
  remaining: number;
};
export type IssuedTicket = {
  ticket_no: number;
  ticket_label: string;
  name: string;
  student_id: string;
  picked_up: boolean;
  group_size?: number;
  /** เพื่อนที่ซื้อกลุ่มเดียวกัน (มีเฉพาะตอนค้นบัตร) */
  group?: { ticket_label: string; name: string }[];
  /** ทุกบัตรในออเดอร์ (มีเฉพาะตอนสร้างออเดอร์) */
  tickets?: IssuedTicket[];
};
export type AdminStats = SalesStatus & {
  cancelled: number;
  picked_up: number;
  free_numbers: number[];
};
export type Order = {
  id: string;
  ticket_no: number;
  ticket_label: string;
  status: "active" | "cancelled";
  name: string;
  student_id: string;
  phone: string;
  created_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  picked_up_at: string | null;
  group_id?: string;
  group_size?: number;
};
export type RejectedAttempt = {
  id: string;
  reason: "invalid_slip" | "duplicate_slip" | "already_has_ticket";
  name: string;
  student_id: string;
  phone: string;
  created_at: string;
};
export type ApiErrorData = {
  code: string;
  message: string;
  contact?: string | Record<string, unknown>;
  ticket_label?: string;
  student_id?: string;
  retry_after_secs?: number;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorData,
  ) {
    super(data.message);
    this.name = "ApiError";
  }
}
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");
const TOKEN_KEY = "haunted-admin-token";
export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
const tokenListeners = new Set<() => void>();
/** ให้หน้า admin รู้ทันทีเมื่อ token เปลี่ยน (login, ออกจากระบบ, โดน 401) */
export function subscribeAdminToken(listener: () => void) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}
const notifyToken = () => tokenListeners.forEach((listener) => listener());
export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  notifyToken();
}
export function clearAdminToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
  notifyToken();
}
async function request<T>(
  path: string,
  init: RequestInit = {},
  admin = false,
  guard?: (value: unknown) => value is T,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (admin) {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(0, {
      code: "network",
      message:
        "เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่ หากเพิ่งส่งสลิป ให้ค้นบัตรด้วยรหัสนักศึกษาก่อนส่งซ้ำ",
    });
  }
  if (!response.ok) {
    let data: ApiErrorData;
    try {
      const body = await response.json();
      data = {
        ...body,
        code: typeof body.code === "string" ? body.code : "internal",
        message:
          typeof body.message === "string"
            ? body.message
            : "ระบบขัดข้อง กรุณาลองใหม่",
      };
    } catch {
      data = { code: "internal", message: "ระบบขัดข้อง กรุณาลองใหม่" };
    }
    if (admin && response.status === 401) {
      clearAdminToken();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/admin/login"
      )
        window.location.replace("/admin/login");
    }
    throw new ApiError(response.status, data);
  }
  if (path.endsWith("/slip")) return (await response.blob()) as T;
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new ApiError(502, {
      code: "invalid_response",
      message:
        "ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่ หากส่งสลิปแล้วให้ค้นบัตรก่อนส่งซ้ำ",
    });
  }
  if (guard && !guard(value))
    throw new ApiError(502, {
      code: "invalid_response",
      message:
        "ข้อมูลตอบกลับจากระบบไม่ตรงตามรูปแบบที่รองรับ กรุณาลองใหม่ หากส่งสลิปแล้วให้ค้นบัตรก่อนส่งซ้ำ",
    });
  return value as T;
}
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export const api = {
  sales: (signal?: AbortSignal) =>
    request<SalesStatus>("/api/sales", { signal }, false, isSalesStatus),
  /** people[0] คือผู้ซื้อ จำนวนคนต้องเป็นขนาดโปร (1, 2, 5) */
  createOrder: (input: {
    people: { name: string; student_id: string }[];
    phone: string;
    slip: File;
  }) => {
    const body = new FormData();
    for (const person of input.people) {
      body.append("name", person.name.trim());
      body.append("student_id", person.student_id.trim());
    }
    body.append("phone", input.phone.trim());
    body.append("slip", input.slip);
    return request<IssuedTicket>(
      "/api/orders",
      { method: "POST", body },
      false,
      isIssuedTicket,
    );
  },
  ticket: (studentId: string, signal?: AbortSignal) =>
    request<IssuedTicket>(
      `/api/tickets/${encodeURIComponent(studentId.trim())}`,
      { signal },
      false,
      isIssuedTicket,
    ),
  login: (password: string) =>
    request<{ token: string }>(
      "/api/admin/login",
      json("POST", { password }),
      false,
      isLoginResult,
    ),
  stats: () => request<AdminStats>("/api/admin/stats", {}, true, isAdminStats),
  orders: (q = "", status = "") => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    return request<Order[]>(
      `/api/admin/orders${params.size ? `?${params}` : ""}`,
      {},
      true,
      isOrders,
    );
  },
  rejected: () =>
    request<RejectedAttempt[]>(
      "/api/admin/rejected",
      {},
      true,
      isRejectedAttempts,
    ),
  slip: (id: string, rejected = false) =>
    request<Blob>(
      `/api/admin/${rejected ? "rejected" : "orders"}/${encodeURIComponent(id)}/slip`,
      {},
      true,
    ),
  cancel: (id: string, reason: string) =>
    request<Order>(
      `/api/admin/orders/${encodeURIComponent(id)}/cancel`,
      json("POST", { reason: reason.trim() }),
      true,
      isOrder,
    ),
  pickup: (id: string, picked_up: boolean) =>
    request<Order>(
      `/api/admin/orders/${encodeURIComponent(id)}/pickup`,
      json("POST", { picked_up }),
      true,
      isOrder,
    ),
  setSales: (open: boolean) =>
    request<Pick<SalesStatus, "open" | "closed_forever">>(
      "/api/admin/sales",
      json("PUT", { open }),
      true,
      isSalesFlags,
    ),
  closeForever: () =>
    request<Pick<SalesStatus, "open" | "closed_forever">>(
      "/api/admin/sales/close-forever",
      { method: "POST" },
      true,
      isSalesFlags,
    ),
};
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ระบบขัดข้อง กรุณาลองใหม่";
}
