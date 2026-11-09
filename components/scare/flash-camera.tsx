"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cameraConfig } from "@/lib/scare/camera-config";
import { drawGhost } from "@/lib/scare/ghost-shape";
import { canShoot, planShot, type ShotPlan } from "@/lib/scare/shot-policy";
import { useScare } from "./scare-provider";
import { api } from "@/lib/api";

const W = 600;
const H = 800; // ครอปทุกรูปเป็น 3:4
const MAX_POLAROIDS = 6;
const GHOST_FILL = "#e9e4dc";

type Polaroid = { n: number; url: string; tilt: number };
type Images = { photos: HTMLImageElement[]; mirror: HTMLImageElement };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** วาดรูปแบบ object-fit: cover แล้วคืนฟังก์ชันแปลงพิกัดรูป (0–1) เป็นพิกัด canvas */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return {
    x: (f: number) => dx + f * dw,
    y: (f: number) => dy + f * dh,
    h: (f: number) => f * dh,
  };
}

function tint(
  ctx: CanvasRenderingContext2D,
  color: string,
  op: GlobalCompositeOperation,
) {
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function grain(ctx: CanvasRenderingContext2D) {
  const d = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 36;
    d.data[i] += n;
    d.data[i + 1] += n;
    d.data[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);
}

/** กรอบกระจก mock: กรอบไม้เก่า + พื้นกระจก (สว่างเมื่อโดนแฟลช) */
function drawMockMirror(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  lit: boolean,
) {
  const glass = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  glass.addColorStop(0, lit ? "#9c9993" : "#14161a");
  glass.addColorStop(0.5, lit ? "#c9c5bd" : "#1c1e22");
  glass.addColorStop(1, lit ? "#6d6a65" : "#0e0f12");
  ctx.fillStyle = glass;
  ctx.beginPath();
  // ยอดโค้ง: roundRect ไม่มีใน iOS Safari < 16 / Firefox < 112 จึงวาดเองด้วย arc
  const rad = r.w / 2;
  ctx.moveTo(r.x, r.y + rad);
  ctx.arc(r.x + rad, r.y + rad, rad, Math.PI, 0);
  ctx.lineTo(r.x + r.w, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = lit ? "#5a4026" : "#1a120b";
  ctx.stroke();
}

function mirrorRect(m: ReturnType<typeof drawCover>) {
  const c = cameraConfig.mirrorShot.mirror;
  return {
    x: m.x(c.x),
    y: m.y(c.y),
    w: m.x(c.x + c.w) - m.x(c.x),
    h: m.h(c.h),
  };
}

function render(
  ctx: CanvasRenderingContext2D,
  images: Images,
  view: { kind: "photo"; photoIndex: number } | { kind: "mirror" },
  flash: ShotPlan | null,
) {
  ctx.clearRect(0, 0, W, H);
  const lit = flash !== null;
  const isMirror = view.kind === "mirror";
  const img = isMirror ? images.mirror : images.photos[view.photoIndex];
  const map = drawCover(ctx, img);
  const shot = cameraConfig.mirrorShot;
  if (isMirror && shot.mockFrame) drawMockMirror(ctx, mirrorRect(map), lit);

  if (!lit) {
    tint(ctx, "rgba(0,0,0,0.85)", "source-over"); // มืดเกือบมองไม่เห็น
    return;
  }
  tint(ctx, "rgba(196,160,118,0.18)", "multiply"); // sepia เบา ๆ
  tint(ctx, "rgba(255,246,234,0.1)", "screen"); // แสงแฟลช
  if (flash.kind === "mirror") {
    // ร่างดำในกระจก ยืนตรงตำแหน่งคนดู = อยู่ข้างหลังคุณ
    const r = mirrorRect(map);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    drawGhost(ctx, r.x + r.w / 2, r.y + r.h, r.h * 0.85, "#050505", 3);
    ctx.restore();
  } else if (flash.ghostSpot !== null) {
    const spot = cameraConfig.photos[flash.photoIndex].spots[flash.ghostSpot];
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawGhost(ctx, map.x(spot.x), map.y(spot.y), map.h(spot.h), GHOST_FILL, 4);
    ctx.restore();
  }
  grain(ctx);
}

/** กล้องจำลอง (รูปบ้าน mock) — ใช้แทนเมื่อเปิดกล้องจริงไม่ได้ */
export function FlashCamera({ showTitle = true }: { showTitle?: boolean }) {
  const { figure, consumeMirror, reducedMotion } = useScare();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [polaroids, setPolaroids] = useState<Polaroid[]>([]);
  const [shots, setShots] = useState(0);
  const lastShotAt = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  const mirrorArmed = figure.mirrorArmed;
  const photoCount = cameraConfig.photos.length;

  const darkView = useCallback(
    () =>
      mirrorArmed
        ? ({ kind: "mirror" } as const)
        : ({ kind: "photo", photoIndex: shots % photoCount } as const),
    [mirrorArmed, shots, photoCount],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      Promise.all(cameraConfig.photos.map((p) => loadImage(p.src))),
      loadImage(cameraConfig.mirrorShot.src),
    ])
      .then(([photos, mirror]) => {
        if (active) setImages({ photos, mirror });
      })
      .catch(() => {
        // โหลดรูปไม่ได้ ปุ่มจะกดไม่ได้ต่อไป
      });
    return () => {
      active = false;
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // วาดภาพมืดทุกครั้งที่รูปพร้อมหรือสถานะกระจกเปลี่ยน
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !images) return;
    try {
      render(ctx, images, darkView(), null);
    } catch {
      // วาดไม่ได้ก็ปล่อยกรอบดำ ห้ามทำให้ทั้งหน้าพัง
    }
  }, [images, darkView]);

  function shoot() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const now = Date.now();
    if (!canvas || !ctx || !images || !canShoot(now, lastShotAt.current))
      return;
    lastShotAt.current = now;
    api.countGhostShot();
    const plan = planShot(
      shots,
      photoCount,
      cameraConfig.photos.map((p) => p.spots.length),
      mirrorArmed,
      Math.random,
    );
    const view =
      plan.kind === "mirror"
        ? plan
        : ({ kind: "photo", photoIndex: plan.photoIndex } as const);
    let url: string;
    try {
      render(ctx, images, view, plan);
      url = canvas.toDataURL("image/jpeg", 0.8);
    } catch {
      return;
    }

    const fl = flashRef.current;
    if (fl) {
      fl.style.transition = "none";
      fl.style.opacity = reducedMotion ? "0.35" : "0.85";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          fl.style.transition = "opacity 0.5s";
          fl.style.opacity = "0";
        }),
      );
    }

    const n = shots + 1;
    setPolaroids((list) =>
      [{ n, url, tilt: Math.random() * 8 - 4 }, ...list].slice(
        0,
        MAX_POLAROIDS,
      ),
    );
    // ภาพสว่างค้าง ~110 ms แล้วค่อยเปลี่ยน state ซึ่งจะให้ effect ด้านบนวาดภาพมืดของรูปถัดไป
    // (ถ้าเปลี่ยน state ทันที effect จะทับภาพแฟลชเร็วเกินไป)
    timer.current = window.setTimeout(() => {
      if (plan.kind === "mirror") consumeMirror();
      setShots(n);
    }, 110);
  }

  const current = darkView();
  const alt =
    current.kind === "mirror"
      ? cameraConfig.mirrorShot.alt
      : cameraConfig.photos[current.photoIndex].alt;

  return (
    <div className="flash-camera">
      {showTitle && <h2 className="flash-camera-title">ลองถ่ายรูปบ้านนี้ดู</h2>}
      <div className="flash-frame">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={alt}
        />
        <div ref={flashRef} className="flash-overlay" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="button"
        disabled={!images}
        onClick={shoot}
      >
        <Camera size={18} /> ชัตเตอร์
      </button>
      {polaroids.length > 0 && (
        <div className="polaroids">
          {polaroids.map((p) => (
            <figure
              key={p.n}
              className="polaroid"
              style={{ transform: `rotate(${p.tilt}deg)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL จาก canvas */}
              <img src={p.url} alt={`รูปที่ ${p.n} จากกล้อง`} />
              <figcaption>รูปที่ {p.n}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
