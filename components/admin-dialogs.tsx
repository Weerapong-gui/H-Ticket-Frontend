"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { ErrorNotice } from "./error-notice";
export function ActionDialog({
  title,
  description,
  fieldLabel,
  expected,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  fieldLabel: string;
  expected?: string;
  onCancel: () => void;
  onConfirm: (value: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const guard = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="action-dialog"
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
    >
      <h2 id={label}>{title}</h2>
      <p>{description}</p>
      <form
        className="form-fields"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            guard.current ||
            !value.trim() ||
            (expected && value !== expected)
          )
            return;
          guard.current = true;
          setPending(true);
          setError(null);
          try {
            await onConfirm(value.trim());
            onCancel();
          } catch (e) {
            setError(e);
          } finally {
            guard.current = false;
            setPending(false);
          }
        }}
      >
        <label>
          {fieldLabel}
          <input
            required
            autoFocus
            disabled={pending}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={500}
          />
        </label>
        <ErrorNotice error={error} />
        <div className="action-buttons">
          <button
            className="button"
            disabled={
              pending || !value.trim() || (!!expected && value !== expected)
            }
          >
            {pending ? "กำลังดำเนินการ…" : "ยืนยัน"}
          </button>
          <button
            type="button"
            className="button outline"
            disabled={pending}
            onClick={onCancel}
          >
            กลับ
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function SlipDialog({
  id,
  rejected = false,
  onClose,
}: {
  id: string;
  rejected?: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    const dialog = ref.current;
    dialog?.showModal();
    api
      .slip(id, rejected)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      dialog?.close();
    };
  }, [id, rejected]);
  return (
    <dialog
      ref={ref}
      className="action-dialog slip-dialog"
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={label}>รูปสลิปต้นฉบับ</h2>
        <button aria-label="ปิดรูปสลิป" onClick={onClose}>
          ×
        </button>
      </div>
      <ErrorNotice error={error} />
      {url ? (
        <Image
          src={url}
          alt="รูปสลิปการโอนเงิน"
          width={900}
          height={1200}
          unoptimized
        />
      ) : (
        !error && <p role="status">กำลังโหลดรูปสลิป…</p>
      )}
    </dialog>
  );
}
