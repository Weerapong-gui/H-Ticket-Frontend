"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ImageUp, UserRound, Users } from "lucide-react";
import { Summary, Progress } from "@/components/summary";
import { SalesNotice } from "@/components/sales-notice";
import { ErrorNotice } from "@/components/error-notice";
import { PaymentInfo } from "@/components/payment-info";
import { usePackage, usePurchaseSales } from "@/components/booking-provider";
import { api, ApiError } from "@/lib/api";
import {
  canOrderPackage,
  duplicateIndexes,
  slipProblem,
  validPhone,
  validStudentId,
} from "@/lib/booking";
import type { Dict } from "@/lib/i18n/dict";
import { useHref, useT } from "@/lib/i18n/client";

type Person = { name: string; studentId: string };
type Form = { people: Person[]; phone: string };
type ErrorKey = `name-${number}` | `studentId-${number}` | "phone" | "slip";
const digits = (v: string) => v.replace(/\D/g, "");
const blank = (): Person => ({ name: "", studentId: "" });

function validate(form: Form, slip: File | null, t: Dict) {
  const errors: Partial<Record<ErrorKey, string>> = {};
  const dup = duplicateIndexes(form.people.map((p) => p.studentId));
  form.people.forEach((person, i) => {
    const name = person.name.trim();
    if (!name) errors[`name-${i}`] = t.checkout.errName;
    else if ([...name].length > 100)
      errors[`name-${i}`] = t.checkout.errNameLong;
    if (!validStudentId(person.studentId))
      errors[`studentId-${i}`] = t.common.studentIdDigits;
    else if (dup.has(i)) errors[`studentId-${i}`] = t.checkout.errDupId;
  });
  if (!validPhone(form.phone)) errors.phone = t.checkout.errPhone;
  const problem = slipProblem(slip);
  if (problem)
    errors.slip = {
      missing: t.checkout.errSlipMissing,
      type: t.checkout.errSlipType,
      size: t.checkout.errSlipSize,
    }[problem];
  return errors;
}

export default function Checkout() {
  const router = useRouter();
  const t = useT();
  const href = useHref();
  const { sales, refresh } = usePurchaseSales();
  const { size } = usePackage();
  const [form, setForm] = useState<Form>({ people: [blank()], phone: "" });
  // ให้จำนวนช่องกรอกตรงกับโปรที่เลือก (เก็บข้อมูลที่กรอกไว้แล้ว)
  if (form.people.length !== size)
    setForm((f) => ({
      ...f,
      people: Array.from({ length: size }, (_, i) => f.people[i] ?? blank()),
    }));
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const guard = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validate(form, slip, t);
  const show = (k: ErrorKey) => (submitted ? errors[k] : undefined);

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
        people: form.people.map((p) => ({
          name: p.name,
          student_id: p.studentId,
        })),
        phone: form.phone,
        slip: slip!, // ส่งไฟล์ต้นฉบับ ห้ามบีบอัด QR จะอ่านไม่ออก
      });
      // ปุ่มคงสถานะรอจนเปลี่ยนหน้า กันการกดส่งซ้ำ
      router.push(
        href(`/ticket/${encodeURIComponent(ticket.student_id)}?new=1`),
      );
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
    key: ErrorKey,
    label: string,
    value: string,
    onChange: (value: string) => void,
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
          value={value}
          aria-invalid={!!err}
          aria-describedby={err ? `f-${key}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
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
  const setPerson = (i: number, patch: Partial<Person>) =>
    setForm((f) => ({
      ...f,
      people: f.people.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    }));

  const open = canOrderPackage(sales, size);
  return (
    <main className="booking-main">
      <Progress step={2} />
      <div className="page-heading">
        <h1>{t.checkout.title}</h1>
        <p>{size === 1 ? t.checkout.leadOne : t.checkout.leadGroup(size)}</p>
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
              {size > 1 ? <Users size={22} /> : <UserRound size={22} />}
              <h2 id="buyer-heading">{t.checkout.peopleHeading(size)}</h2>
            </div>
            {form.people.map((person, i) => (
              <fieldset className="person-fields" key={i}>
                {size > 1 && <legend>{t.checkout.person(i)}</legend>}
                <div className="form-fields">
                  {field(
                    `name-${i}`,
                    t.checkout.name,
                    person.name,
                    (v) => setPerson(i, { name: v }),
                    {
                      type: "text",
                      autoComplete: i === 0 ? "name" : "off",
                      maxLength: 100,
                      placeholder: t.checkout.namePh,
                      onBlur: () => setPerson(i, { name: person.name.trim() }),
                    },
                  )}
                  {field(
                    `studentId-${i}`,
                    t.common.studentId,
                    person.studentId,
                    (v) => setPerson(i, { studentId: digits(v) }),
                    {
                      type: "text",
                      inputMode: "numeric",
                      autoComplete: "off",
                      maxLength: 10,
                      placeholder: t.common.tenDigits,
                    },
                    i === 0 ? t.checkout.idHint : undefined,
                  )}
                  {i === 0 &&
                    field(
                      "phone",
                      t.checkout.phone,
                      form.phone,
                      (v) => setForm((f) => ({ ...f, phone: digits(v) })),
                      {
                        type: "tel",
                        inputMode: "tel",
                        autoComplete: "tel-national",
                        maxLength: 10,
                        placeholder: "08XXXXXXXX",
                      },
                      size > 1 ? t.checkout.phoneGroup : undefined,
                    )}
                </div>
              </fieldset>
            ))}
          </section>
          <section
            className="student-info student-entry"
            aria-labelledby="slip-heading"
          >
            <div className="student-form-heading">
              <ImageUp size={22} />
              <h2 id="slip-heading">{t.checkout.slipHeading}</h2>
            </div>
            <label htmlFor="f-slip">
              {t.checkout.slipLabel}{" "}
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
              <span className="field-hint">{t.checkout.slipRule}</span>
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
                alt={t.checkout.slipAlt}
              />
            )}
          </section>
          <PaymentInfo />
          <Link className="text-link" href={href("/booking")}>
            {t.checkout.back}
          </Link>
        </div>
        <Summary>
          <ErrorNotice error={error} studentId={form.people[0].studentId} />
          <button type="submit" className="button" disabled={pending || !open}>
            {pending
              ? t.checkout.checking
              : open
                ? t.checkout.confirm
                : t.checkout.cannotBuy}
            <ArrowRight size={16} />
          </button>
          <p className="selection-hint">{t.checkout.final}</p>
        </Summary>
      </form>
    </main>
  );
}
