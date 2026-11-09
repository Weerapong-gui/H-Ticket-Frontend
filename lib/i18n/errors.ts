import { ApiError, errorMessage } from "@/lib/api";
import { API_ERRORS_EN, type Lang } from "./dict";

/** ข้อความ error ตามภาษา: ไทยใช้ข้อความเดิมจาก backend/ระบบ · อังกฤษแปลตามรหัส error */
export function errorText(error: unknown, lang: Lang): string {
  if (lang === "th") return errorMessage(error);
  if (error instanceof ApiError)
    return API_ERRORS_EN[error.data.code] ?? API_ERRORS_EN.internal;
  return error instanceof Error ? error.message : API_ERRORS_EN.internal;
}
