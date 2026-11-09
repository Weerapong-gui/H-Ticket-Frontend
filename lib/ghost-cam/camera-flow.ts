export type CamState =
  "idle" | "starting" | "live" | "developing" | "result" | "unavailable";
export type CamEvent =
  "open" | "granted" | "denied" | "shoot" | "developed" | "retake" | "close";

const EDGES: Partial<Record<CamState, Partial<Record<CamEvent, CamState>>>> = {
  idle: { open: "starting" },
  starting: { granted: "live", denied: "unavailable" },
  live: { shoot: "developing" },
  developing: { developed: "result" },
  result: { retake: "starting" },
};

/** สถานะหน้ากล้องผี · เหตุการณ์ที่ไม่เข้ากับสถานะตอนนั้นไม่ทำอะไร */
export function nextCam(s: CamState, e: CamEvent): CamState {
  if (e === "close") return "idle";
  return EDGES[s]?.[e] ?? s;
}
