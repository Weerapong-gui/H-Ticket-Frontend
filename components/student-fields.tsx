"use client";
import { useState } from "react";
import { UserRound } from "lucide-react";
import {
  DUPLICATE_ID_ERROR,
  numericOnly,
  StudentErrors,
  StudentInfo,
  USED_ID_ERROR,
} from "@/lib/demo-booking";
export function StudentFields({
  index,
  student,
  errors,
  submitted,
  onChange,
}: {
  index: number;
  student: StudentInfo;
  errors: StudentErrors;
  submitted: boolean;
  onChange: (patch: Partial<StudentInfo>) => void;
}) {
  const [touched, setTouched] = useState<
    Partial<Record<keyof StudentInfo, boolean>>
  >({});
  const visible = (field: keyof StudentInfo) =>
    submitted ||
    touched[field] ||
    (field === "studentId" &&
      [DUPLICATE_ID_ERROR, USED_ID_ERROR].includes(errors.studentId ?? ""))
      ? errors[field]
      : undefined;
  const fields = [
    {
      key: "fullName",
      label: "ชื่อ-นามสกุล",
      type: "text",
      placeholder: "กรอกชื่อ-นามสกุล",
      hint: "",
    },
    {
      key: "studentId",
      label: "รหัสนักศึกษา",
      type: "text",
      placeholder: "กรอกรหัสนักศึกษา",
      hint: "ใช้รหัสที่ไม่ซ้ำกัน เลข 0 นำหน้าจะถูกเก็บไว้",
    },
    {
      key: "phone",
      label: "เบอร์โทรศัพท์",
      type: "tel",
      placeholder: "08XXXXXXXX",
      hint: "มือถือไทย 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09",
    },
  ] as const;
  return (
    <section
      className="student-info student-entry"
      aria-labelledby={`student-${index}-heading`}
    >
      <div className="student-form-heading">
        <UserRound size={22} />
        <h2 id={`student-${index}-heading`}>
          นักศึกษาคนที่ {index + 1} <span>/ Ticket {index + 1}</span>
        </h2>
      </div>
      <div className="form-fields">
        {fields.map((field) => {
          const id = `student-${index}-${field.key}`;
          const error = visible(field.key);
          const described = [
            field.hint ? `${id}-help` : "",
            error ? `${id}-error` : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <label key={field.key} htmlFor={id}>
              {field.label}{" "}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
              <input
                id={id}
                name={`students[${index}].${field.key}`}
                type={field.type}
                inputMode={
                  field.key === "studentId"
                    ? "numeric"
                    : field.key === "phone"
                      ? "tel"
                      : undefined
                }
                autoComplete={
                  field.key === "fullName"
                    ? `section-student${index} name`
                    : field.key === "phone"
                      ? `section-student${index} tel-national`
                      : "off"
                }
                placeholder={field.placeholder}
                required
                maxLength={field.key === "phone" ? 10 : undefined}
                value={student[field.key]}
                aria-invalid={!!error}
                aria-describedby={described || undefined}
                onChange={(e) =>
                  onChange({
                    [field.key]:
                      field.key === "fullName"
                        ? e.target.value
                        : numericOnly(e.target.value),
                  })
                }
                onBlur={() => {
                  if (field.key === "fullName")
                    onChange({ fullName: student.fullName.trim() });
                  setTouched((value) => ({ ...value, [field.key]: true }));
                }}
              />
              {field.hint && (
                <span className="field-hint" id={`${id}-help`}>
                  {field.hint}
                </span>
              )}
              {error && (
                <span className="field-error" id={`${id}-error`} role="alert">
                  {error}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
