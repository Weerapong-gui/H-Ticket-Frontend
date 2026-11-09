"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, RefreshCw, SwitchCamera } from "lucide-react";
import { api } from "@/lib/api";
import { canShoot } from "@/lib/scare/shot-policy";
import {
  nextCam,
  type CamEvent,
  type CamState,
} from "@/lib/ghost-cam/camera-flow";
import {
  ANALYSIS_H,
  ANALYSIS_W,
  OUT_H,
  OUT_W,
} from "@/lib/ghost-cam/compose-math";
import { canvasToJpegBlob, composeGhostPhoto } from "@/lib/ghost-cam/compose";
import { ghostSprites } from "@/lib/ghost-cam/ghost-config";
import { maskStats } from "@/lib/ghost-cam/mask";
import { planGhost } from "@/lib/ghost-cam/placement";
import { preloadSegmenter, segmentPerson } from "@/lib/ghost-cam/segmenter";
import { FlashCamera } from "./flash-camera";
import { useScare } from "./scare-provider";
import { useT } from "@/lib/i18n/client";

/** หน้ารอ "กำลังล้างฟิล์ม…" แสดงอย่างน้อยเท่านี้ เพื่อความลุ้น */
const DEVELOP_MS = 2_000;
type Facing = "user" | "environment";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** ภาพจากวิดีโอ ครอปตรงกลางเป็น 3:4 · กล้องหน้ากลับด้านให้ตรงกับที่เห็นตอนถ่าย */
function grabFrame(video: HTMLVideoElement, mirror: boolean) {
  const c = document.createElement("canvas");
  c.width = OUT_W;
  c.height = OUT_H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.max(OUT_W / vw, OUT_H / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  if (mirror) {
    ctx.translate(OUT_W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh);
  return c;
}

function downscale(src: HTMLCanvasElement) {
  const c = document.createElement("canvas");
  c.width = ANALYSIS_W;
  c.height = ANALYSIS_H;
  c.getContext("2d")?.drawImage(src, 0, 0, ANALYSIS_W, ANALYSIS_H);
  return c;
}

/** กล้องถ่ายภาพติดวิญญาณ: ทุกอย่างทำในเครื่อง รูปไม่ถูกส่งไปที่ไหน */
export function GhostCamera() {
  const { figure, consumeMirror, reducedMotion } = useScare();
  const t = useT();
  const [state, setState] = useState<CamState>("idle");
  const [facing, setFacing] = useState<Facing>("user");
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const lastShotAt = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** นับคำขอกล้อง: คำขอเก่าที่ตอบกลับช้าต้องปิดกล้องทิ้ง ไม่งั้นไฟกล้องค้าง */
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  const send = useCallback((e: CamEvent) => setState((s) => nextCam(s, e)), []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const clearResult = useCallback(() => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    resultRef.current = null;
    setResult(null);
  }, []);

  // ออกจากหน้า: ปิดกล้อง (ไฟกล้องดับ) และคืนหน่วยความจำรูป
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // ตั้งใจเปลี่ยนค่าตัวนับ (ไม่ใช่ DOM ref) ให้คำขอกล้องที่ค้างอยู่รู้ว่าต้องปิดทิ้ง
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestRef.current++;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    };
  }, []);

  // เลื่อนออกจากส่วนกล้อง หรือสลับไปแท็บอื่น: ปิดกล้อง กลับไปหน้าเริ่ม
  const live = state === "live" || state === "starting";
  useEffect(() => {
    if (!live) return;
    const off = () => {
      requestRef.current++;
      stop();
      send("close");
    };
    const onHide = () => document.hidden && off();
    document.addEventListener("visibilitychange", onHide);
    const el = frameRef.current;
    // ปิดเมื่อ "เลื่อนออก" เท่านั้น: ต้องเคยเห็นกรอบก่อน (ครั้งแรกที่ observer แจ้งอาจยังไม่อยู่ในจอ)
    let seen = false;
    const io =
      el && "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => {
            if (e.isIntersecting) seen = true;
            else if (seen) off();
          })
        : null;
    if (el) io?.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      io?.disconnect();
    };
  }, [live, send, stop]);

  const start = useCallback(
    async (want: Facing) => {
      const req = ++requestRef.current;
      stop();
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        send("denied");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: want,
            width: { ideal: 1440 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
        if (req !== requestRef.current || !mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        send("granted");
      } catch {
        if (req === requestRef.current && mountedRef.current) send("denied");
      }
    },
    [send, stop],
  );

  function open() {
    preloadSegmenter();
    send("open");
    void start(facing);
  }

  function flip() {
    const next: Facing = facing === "user" ? "environment" : "user";
    setFacing(next);
    send("switch"); // ปุ่มกดไม่ได้ระหว่างเปิดกล้องใหม่ · พลาดแล้วไปกล้องจำลอง
    void start(next);
  }

  function flash() {
    const fl = flashRef.current;
    if (!fl) return;
    fl.style.transition = "none";
    fl.style.opacity = reducedMotion ? "0.35" : "0.85";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fl.style.transition = "opacity 0.5s";
        fl.style.opacity = "0";
      }),
    );
  }

  async function shoot() {
    const video = videoRef.current;
    const now = Date.now();
    if (!video || !video.videoWidth || !canShoot(now, lastShotAt.current))
      return;
    lastShotAt.current = now;
    let photo: HTMLCanvasElement;
    try {
      photo = grabFrame(video, facing === "user");
    } catch {
      return;
    }
    flash();
    stop();
    send("shoot");
    api.countGhostShot();
    const minWait = new Promise((r) => setTimeout(r, DEVELOP_MS));
    const armed = figure.mirrorArmed;

    let out: HTMLCanvasElement = photo;
    let ghosted = false;
    try {
      const seg = await segmentPerson(downscale(photo));
      const stats = seg ? maskStats(seg.mask, seg.w, seg.h) : null;
      const placement = planGhost(
        stats,
        seg?.w ?? ANALYSIS_W,
        seg?.h ?? ANALYSIS_H,
        ghostSprites,
        { figure: armed, rand: Math.random },
      );
      const src = placement.sprite?.src;
      const sprite =
        src && !src.startsWith("procedural:")
          ? await loadImage(src).catch(() => null)
          : null;
      out = await composeGhostPhoto(photo, seg, placement, sprite);
      ghosted = true;
    } catch (e) {
      console.warn("[ghost-cam] ใส่ผีไม่สำเร็จ ใช้รูปเดิม", e);
    }
    const blob = await canvasToJpegBlob(out).catch(() => null);
    await minWait;
    if (!mountedRef.current) return;
    if (blob) {
      clearResult();
      const url = URL.createObjectURL(blob);
      resultRef.current = url;
      blobRef.current = blob;
      setResult(url);
    }
    // ฉากจบใช้ไปก็ต่อเมื่อใส่ผีได้จริง
    if (armed && ghosted) consumeMirror();
    send("developed");
  }

  /** มือถือ: เปิดเมนูแชร์ (มี "บันทึกรูปภาพ" ลงคลังรูป) · ไม่รองรับก็ดาวน์โหลดไฟล์ */
  async function save() {
    const blob = blobRef.current;
    const url = resultRef.current;
    if (!blob || !url) return;
    const file = new File([blob], "haunted-house-ghost.jpg", {
      type: "image/jpeg",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        // ผู้ใช้กดยกเลิกเอง ไม่ต้องดาวน์โหลดซ้ำ
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "haunted-house-ghost.jpg";
    a.click();
  }

  function retake() {
    blobRef.current = null;
    clearResult();
    send("retake");
    void start(facing);
  }

  if (state === "unavailable")
    return (
      <div className="flash-camera ghost-camera">
        <h2 className="flash-camera-title">{t.camera.title}</h2>
        <p className="ghost-camera-note">{t.camera.unavailable}</p>
        <FlashCamera showTitle={false} />
      </div>
    );

  return (
    <div className="flash-camera ghost-camera">
      <h2 className="flash-camera-title">{t.camera.title}</h2>
      <div className="flash-frame" ref={frameRef}>
        {/* วิดีโออยู่ตลอด (ถ่ายใหม่ต้องต่อกล้องเข้ากับ element เดิมได้ทันที) */}
        <video
          ref={videoRef}
          className={facing === "user" ? "ghost-video mirrored" : "ghost-video"}
          playsInline
          muted
          aria-label={t.camera.videoAria}
        />
        {state === "result" && result && (
          // eslint-disable-next-line @next/next/no-img-element -- object URL จาก canvas ในเครื่อง
          <img className="ghost-result" src={result} alt={t.camera.resultAlt} />
        )}
        {state === "idle" && (
          <p className="ghost-camera-idle">{t.camera.privacy}</p>
        )}
        {state === "developing" && (
          <p className="ghost-developing" role="status">
            {t.camera.developing}
          </p>
        )}
        <div ref={flashRef} className="flash-overlay" aria-hidden="true" />
      </div>
      {state === "result" && result && (
        <p className="ghost-camera-note">{t.camera.saveHint}</p>
      )}
      <div className="action-buttons ghost-camera-actions">
        {state === "idle" && (
          <button type="button" className="button" onClick={open}>
            <Camera size={18} /> {t.camera.open}
          </button>
        )}
        {live && (
          <>
            <button
              type="button"
              className="button"
              disabled={state !== "live"}
              onClick={() => void shoot()}
            >
              <Camera size={18} /> {t.camera.shutter}
            </button>
            <button
              type="button"
              className="button outline"
              disabled={state !== "live"}
              onClick={flip}
              aria-label={t.camera.switch}
            >
              <SwitchCamera size={18} />
            </button>
          </>
        )}
        {state === "result" && (
          <>
            {result && (
              <button
                type="button"
                className="button"
                onClick={() => void save()}
              >
                <Download size={18} /> {t.camera.save}
              </button>
            )}
            <button type="button" className="button outline" onClick={retake}>
              <RefreshCw size={18} /> {t.camera.retake}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
