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
  const [state, setState] = useState<CamState>("idle");
  const [facing, setFacing] = useState<Facing>("user");
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<string | null>(null);
  const lastShotAt = useRef<number | null>(null);
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
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    },
    [],
  );

  const start = useCallback(
    async (want: Facing) => {
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
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        send("granted");
      } catch {
        send("denied");
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
    } catch (e) {
      console.warn("[ghost-cam] ใส่ผีไม่สำเร็จ ใช้รูปเดิม", e);
    }
    const blob = await canvasToJpegBlob(out).catch(() => null);
    await minWait;
    if (blob) {
      clearResult();
      const url = URL.createObjectURL(blob);
      resultRef.current = url;
      setResult(url);
    }
    if (armed) consumeMirror();
    send("developed");
  }

  function retake() {
    clearResult();
    send("retake");
    void start(facing);
  }

  if (state === "unavailable")
    return (
      <div className="flash-camera ghost-camera">
        <h2 className="flash-camera-title">ถ่ายรูปกับผีในบ้านนี้</h2>
        <p className="ghost-camera-note">เปิดกล้องไม่ได้ ลองถ่ายบ้านแทน</p>
        <FlashCamera showTitle={false} />
      </div>
    );

  const live = state === "live" || state === "starting";
  return (
    <div className="flash-camera ghost-camera">
      <h2 className="flash-camera-title">ถ่ายรูปกับผีในบ้านนี้</h2>
      <div className="flash-frame">
        {/* วิดีโออยู่ตลอด (ถ่ายใหม่ต้องต่อกล้องเข้ากับ element เดิมได้ทันที) */}
        <video
          ref={videoRef}
          className={facing === "user" ? "ghost-video mirrored" : "ghost-video"}
          playsInline
          muted
          aria-label="ภาพจากกล้อง"
        />
        {state === "result" && result && (
          // eslint-disable-next-line @next/next/no-img-element -- object URL จาก canvas ในเครื่อง
          <img
            className="ghost-result"
            src={result}
            alt="รูปของคุณจากกล้องผี"
          />
        )}
        {state === "idle" && (
          <p className="ghost-camera-idle">
            รูปอยู่ในเครื่องคุณเท่านั้น ไม่ถูกส่งไปที่ไหน
          </p>
        )}
        {state === "developing" && (
          <p className="ghost-developing" role="status">
            กำลังล้างฟิล์ม…
          </p>
        )}
        <div ref={flashRef} className="flash-overlay" aria-hidden="true" />
      </div>
      <div className="action-buttons ghost-camera-actions">
        {state === "idle" && (
          <button type="button" className="button" onClick={open}>
            <Camera size={18} /> เปิดกล้อง
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
              <Camera size={18} /> ชัตเตอร์
            </button>
            <button
              type="button"
              className="button outline"
              disabled={state !== "live"}
              onClick={flip}
              aria-label="สลับกล้องหน้าหลัง"
            >
              <SwitchCamera size={18} />
            </button>
          </>
        )}
        {state === "result" && (
          <>
            {result && (
              <a
                className="button"
                href={result}
                download="haunted-house-ghost.jpg"
              >
                <Download size={18} /> ดาวน์โหลดรูป
              </a>
            )}
            <button type="button" className="button outline" onClick={retake}>
              <RefreshCw size={18} /> ถ่ายใหม่
            </button>
          </>
        )}
      </div>
    </div>
  );
}
