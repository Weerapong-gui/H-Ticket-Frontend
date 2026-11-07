"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, setAdminToken } from "@/lib/api";
import { ErrorNotice } from "@/components/error-notice";
export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [remaining, setRemaining] = useState(0);
  const sending = useRef(false);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [remaining]);
  return (
    <main className="booking-main">
      <div className="login-panel">
        <p className="eyebrow">STAFF ONLY</p>
        <h1>เข้าสู่ระบบแอดมิน</h1>
        <p>สำหรับทีมงานขายและแจกบัตร</p>
        <form
          className="form-fields"
          onSubmit={async (e) => {
            e.preventDefault();
            if (sending.current || remaining > 0) return;
            sending.current = true;
            setPending(true);
            setError(null);
            try {
              const { token } = await api.login(password);
              setAdminToken(token);
              setPassword("");
              router.replace("/admin");
            } catch (e) {
              setError(e);
              if (e instanceof ApiError && e.data.code === "too_many_attempts")
                setRemaining(Math.max(1, e.data.retry_after_secs ?? 60));
            } finally {
              sending.current = false;
              setPending(false);
            }
          }}
        >
          <label>
            รหัสผ่าน
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={pending || remaining > 0}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <ErrorNotice error={error} />
          {remaining > 0 && (
            <p role="status">ลองอีกครั้งได้ใน {remaining} วินาที</p>
          )}
          <button className="button" disabled={pending || remaining > 0}>
            {pending
              ? "กำลังเข้าสู่ระบบ…"
              : remaining > 0
                ? `รอ ${remaining} วินาที`
                : "เข้าสู่ระบบ"}
          </button>
        </form>
        <p className="privacy-note">
          เซสชันมีอายุ 12 ชั่วโมง เก็บ token เฉพาะแท็บนี้
        </p>
      </div>
    </main>
  );
}
