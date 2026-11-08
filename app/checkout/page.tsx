"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ImageUp, UserRound } from "lucide-react";
import { Summary, Progress } from "@/components/summary";
import { SalesNotice } from "@/components/sales-notice";
import { ErrorNotice } from "@/components/error-notice";
import { PaymentInfo } from "@/components/payment-info";
import { usePurchaseSales } from "@/components/booking-provider";
import { api, ApiError } from "@/lib/api";
import {
  canOrder,
  validateSlip,
  validPhone,
  validStudentId,
} from "@/lib/booking";

type Form = { name: string; studentId: string; phone: string };
const digits = (v: string) => v.replace(/\D/g, "");

function validate(form: Form, slip: File | null) {
  const errors: Partial<Record<keyof Form | "slip", string>> = {};
  const name = form.name.trim();
  if (!name) errors.name = "กรุณากรอกชื่อ-นามสกุล";
  else if ([...name].length > 100) errors.name = "ชื่อยาวเกิน 100 ตัวอักษร";
  if (!validStudentId(form.studentId))
    errors.studentId = "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก";
  if (!validPhone(form.phone))
    errors.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0";
  const slipError = validateSlip(slip);
  if (slipError) errors.slip = slipError;
  return errors;
}

export default function Checkout() {
  const router = useRouter();
  const { sales, refresh } = usePurchaseSales();
  const [form, setForm] = useState<Form>({
    name: "",
    studentId: "",
    phone: "",
  });
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const guard = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validate(form, slip);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

  // ล้าง blob URL ของรูปตัวอย่างตอนออกจากหน้า
  const previewRef = useRef("");
  useEffect(() => () => URL.revokeObjectURL(previewRef.current), []);
  function pickSlip(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : "";
    setPreview(previewRef.current);
    setSlip(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guard.current) return;
    setSubmitted(true);
    setError(null);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    guard.current = true;
    setPending(true);
    try {
      const ticket = await api.createOrder({
        name: form.name,
        student_id: form.studentId,
        phone: form.phone,
        slip: slip!, // ส่งไฟล์ต้นฉบับ ห้ามบีบอัด QR จะอ่านไม่ออก
      });
      // ปุ่มคงสถานะรอจนเปลี่ยนหน้า กันการกดส่งซ้ำ
      router.push(`/ticket/${encodeURIComponent(ticket.student_id)}?new=1`);
    } catch (err) {
      guard.current = false;
      setPending(false);
      setError(err);
      if (
        err instanceof ApiError &&
        ["sales_closed", "sold_out"].includes(err.data.code)
      )
        void refresh();
    }
  }

  const field = (
    key: keyof Form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint?: string,
  ) => {
    const err = show(key);
    return (
      <label htmlFor={`f-${key}`}>
        {label}{" "}
        <span className="required-mark" aria-hidden="true">
          *
        </span>
        <input
          id={`f-${key}`}
          name={key}
          required
          value={form[key]}
          aria-invalid={!!err}
          aria-describedby={err ? `f-${key}-error` : undefined}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]: key === "name" ? e.target.value : digits(e.target.value),
            }))
          }
          {...props}
        />
        {hint && <span className="field-hint">{hint}</span>}
        {err && (
          <span className="field-error" id={`f-${key}-error`} role="alert">
            {err}
          </span>
        )}
      </label>
    );
  };

  const open = canOrder(sales);
  return (
    <main className="booking-main">
      <Progress step={2} />
      <div className="page-heading">
        <p className="eyebrow">1 รหัสนักศึกษา = 1 ใบ</p>
        <h1>
          กรอกข้อมูล<em>และแนบสลิป</em>
        </h1>
        <p>กรอกข้อมูลของคุณและแนบสลิปโอนเงิน ระบบจะออกเลขบัตรให้ทันที</p>
      </div>
      <form
        ref={formRef}
        className="booking-grid student-checkout"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="booking-controls">
          <SalesNotice />
          <section
            className="student-info student-entry"
            aria-labelledby="buyer-heading"
          >
            <div className="student-form-heading">
              <UserRound size={22} />
              <h2 id="buyer-heading">ข้อมูลผู้ซื้อ</h2>
            </div>
            <div className="form-fields">
              {field("name", "ชื่อ-นามสกุล", {
                type: "text",
                autoComplete: "name",
                maxLength: 100,
                placeholder: "กรอกชื่อ-นามสกุล",
                onBlur: () => setForm((f) => ({ ...f, name: f.name.trim() })),
              })}
              {field(
                "studentId",
                "รหัสนักศึกษา",
                {
                  type: "text",
                  inputMode: "numeric",
                  autoComplete: "off",
                  maxLength: 10,
                  placeholder: "ตัวเลข 10 หลัก",
                },
                "ใช้ค้นบัตรและแลกบัตรจริง",
              )}
              {field("phone", "เบอร์โทรศัพท์", {
                type: "tel",
                inputMode: "tel",
                autoComplete: "tel-national",
                maxLength: 10,
                placeholder: "08XXXXXXXX",
              })}
            </div>
          </section>
          <section
            className="student-info student-entry"
            aria-labelledby="slip-heading"
          >
            <div className="student-form-heading">
              <ImageUp size={22} />
              <h2 id="slip-heading">สลิปโอนเงิน</h2>
            </div>
            <label htmlFor="f-slip">
              รูปสลิป (JPG, PNG, WebP ไม่เกิน 5 MB){" "}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
              <input
                id="f-slip"
                name="slip"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                aria-invalid={!!show("slip")}
                aria-describedby={show("slip") ? "f-slip-error" : undefined}
                onChange={(e) => pickSlip(e.target.files?.[0] ?? null)}
              />
              <span className="field-hint">
                ใช้รูปสลิปเต็มใบจากแอปธนาคาร ห้ามครอปหรือแคปบางส่วน ต้องเห็น QR
                บนสลิป
              </span>
              {show("slip") && (
                <span className="field-error" id="f-slip-error" role="alert">
                  {show("slip")}
                </span>
              )}
            </label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img
                className="slip-preview"
                src={preview}
                alt="ตัวอย่างสลิปที่เลือก"
              />
            )}
          </section>
          <PaymentInfo />
          <Link className="text-link" href="/booking">
            ← กลับไปดูรายละเอียดบัตร
          </Link>
        </div>
        <Summary>
          <ErrorNotice error={error} studentId={form.studentId} />
          <button type="submit" className="button" disabled={pending || !open}>
            {pending
              ? "กำลังตรวจสลิป…"
              : open
                ? "ยืนยันและรับเลขบัตร"
                : "ยังซื้อบัตรไม่ได้"}
            <ArrowRight size={16} />
          </button>
          <p className="selection-hint">
            ตรวจข้อมูลให้ถูกต้องก่อนกด · ซื้อแล้วแก้ไขเองไม่ได้ ต้องติดต่อทีมงาน
          </p>
        </Summary>
      </form>
    </main>
  );
}
