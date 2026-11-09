import { drawGhost } from "@/lib/scare/ghost-shape";
import {
  ANALYSIS_W,
  OUT_H,
  OUT_W,
  spriteRect,
  matchBrightness,
} from "./compose-math";
import type { Box } from "./mask";
import type { Placement } from "./placement";
import type { PersonMask } from "./segmenter";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const ctx2d = (c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2d unavailable");
  return ctx;
};

/** ค่าเฉลี่ยสี (และความสว่าง) ของบริเวณ box ในภาพ */
function regionMean(ctx: CanvasRenderingContext2D, box: Box) {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const w = Math.max(1, Math.min(OUT_W - x, Math.ceil(box.w)));
  const h = Math.max(1, Math.min(OUT_H - y, Math.ceil(box.h)));
  const d = ctx.getImageData(x, y, w, h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 7) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
    n++;
  }
  r /= n;
  g /= n;
  b /= n;
  return { r, g, b, luma: 0.299 * r + 0.587 * g + 0.114 * b };
}

/** จุดที่สว่างที่สุดของชั้นผี (สุ่มอ่านเป็นช่วง ๆ พอ) */
function peakLuma(ctx: CanvasRenderingContext2D, box: Box) {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const w = Math.max(1, Math.min(OUT_W - x, Math.ceil(box.w)));
  const h = Math.max(1, Math.min(OUT_H - y, Math.ceil(box.h)));
  const d = ctx.getImageData(x, y, w, h).data;
  let peak = 0;
  for (let i = 0; i < d.length; i += 4 * 5) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (l > peak) peak = l;
  }
  return peak;
}

/** เบลอแบบย่อแล้วขยาย (ใช้ได้ทุกเบราว์เซอร์ ไม่พึ่ง ctx.filter) */
function softBlur(src: HTMLCanvasElement, blurPx: number) {
  const f = 1 / Math.max(1, blurPx);
  const small = canvas(
    Math.max(1, Math.round(src.width * f)),
    Math.max(1, Math.round(src.height * f)),
  );
  const s = ctx2d(small);
  s.imageSmoothingQuality = "high";
  s.drawImage(src, 0, 0, small.width, small.height);
  const out = canvas(src.width, src.height);
  const o = ctx2d(out);
  o.imageSmoothingQuality = "high";
  o.drawImage(small, 0, 0, out.width, out.height);
  return out;
}

/**
 * รูปผีที่ขอบค่อย ๆ จางเป็นดำ (ผสม screen แล้วดำ = มองไม่เห็น) กันเส้นตัดตรง ๆ ของไฟล์
 * keepLeft: ผีครึ่งหน้า ไม่จางฝั่งซ้าย (รอยตัดที่ต้องชนขอบภาพ)
 */
function featheredSprite(
  sprite: CanvasImageSource,
  w: number,
  h: number,
  keepLeft: boolean,
) {
  const c = canvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  const x = ctx2d(c);
  x.drawImage(sprite, 0, 0, c.width, c.height);
  const fade = (x0: number, y0: number, x1: number, y1: number) => {
    const g = x.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(
      Math.min(x0, x1),
      Math.min(y0, y1),
      Math.abs(x1 - x0) || c.width,
      Math.abs(y1 - y0) || c.height,
    );
  };
  const fx = c.width * 0.18;
  const fy = c.height * 0.15;
  if (!keepLeft) fade(0, 0, fx, 0);
  fade(c.width, 0, c.width - fx, 0);
  fade(0, 0, 0, fy);
  fade(0, c.height, 0, c.height - fy);
  return c;
}

/** ชั้นผี: วาดลงกรอบ ปรับสี/ความสว่างให้เข้ากับฉากหลังตรงนั้น แล้วเบลอ */
function ghostLayer(
  photo: CanvasRenderingContext2D,
  p: Placement,
  box: Box,
  sprite: CanvasImageSource | null,
) {
  const layer = canvas(OUT_W, OUT_H);
  const g = ctx2d(layer);
  g.fillStyle = "#000";
  g.fillRect(0, 0, OUT_W, OUT_H);
  const edgeRight = p.variant === "edge" && box.x + box.w / 2 > OUT_W / 2;
  if (sprite) {
    const { width: sw, height: sh } = sprite as {
      width: number;
      height: number;
    };
    const r = spriteRect(sw, sh, box, p.variant, OUT_W);
    // ผีมุมจอฝั่งขวาต้องกลับด้านเสมอ (รอยตัดไปอยู่ขอบขวา)
    const flip = p.variant === "edge" ? edgeRight : p.flipX;
    const art = featheredSprite(sprite, r.w, r.h, p.variant === "edge");
    g.save();
    if (flip) {
      g.translate(r.x + r.w, r.y);
      g.scale(-1, 1);
      g.drawImage(art, 0, 0, r.w, r.h);
    } else {
      g.drawImage(art, r.x, r.y, r.w, r.h);
    }
    g.restore();
  } else {
    drawGhost(g, box.x + box.w / 2, box.y + box.h, box.h, "#e9e4dc", 6);
  }

  {
    const bg = regionMean(photo, box);
    const scale = matchBrightness(peakLuma(g, box), bg.luma);
    const top = Math.max(bg.r, bg.g, bg.b, 1);
    // ปรับความสว่าง + อมสีของฉากหลังครึ่งหนึ่ง (multiply บนพื้นดำไม่เปลี่ยนส่วนที่ดำ)
    const ch = (c: number) => Math.round(255 * scale * (0.5 + (0.5 * c) / top));
    g.globalCompositeOperation = "multiply";
    g.fillStyle = `rgb(${ch(bg.r)},${ch(bg.g)},${ch(bg.b)})`;
    g.fillRect(0, 0, OUT_W, OUT_H);
    g.globalCompositeOperation = "source-over";
  }
  // เบลอพอนุ่ม (2–6 px) ไม่งั้นผีแคบ ๆ อย่างผีครึ่งหน้าจะเบลอจนหายไป
  return softBlur(layer, p.blurPx * 1.5);
}

/** ตัวคนจากรูป (ขอบนุ่ม) สำหรับวาดทับผี */
function personLayer(photo: HTMLCanvasElement, seg: PersonMask) {
  const m = canvas(seg.w, seg.h);
  const mc = ctx2d(m);
  const img = mc.createImageData(seg.w, seg.h);
  for (let i = 0; i < seg.mask.length; i++) {
    // smoothstep 0.3–0.7: ขอบนุ่ม ไม่เป็นขั้น
    const t = Math.min(1, Math.max(0, (seg.mask[i] - 0.3) / 0.4));
    img.data[i * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
  mc.putImageData(img, 0, 0);
  const out = canvas(OUT_W, OUT_H);
  const o = ctx2d(out);
  o.drawImage(photo, 0, 0, OUT_W, OUT_H);
  o.globalCompositeOperation = "destination-in";
  o.imageSmoothingQuality = "high";
  o.drawImage(m, 0, 0, OUT_W, OUT_H);
  return out;
}

/** เกรดทั้งภาพให้คนกับผีเป็นภาพเดียวกัน: ลดสี อมฟ้าเย็น เม็ดฟิล์ม ขอบมืด */
function grade(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalCompositeOperation = "saturation";
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgb(214,226,236)";
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.restore();

  const d = ctx.getImageData(0, 0, OUT_W, OUT_H);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d.data[i] += n;
    d.data[i + 1] += n;
    d.data[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);

  const v = ctx.createRadialGradient(
    OUT_W / 2,
    OUT_H / 2,
    OUT_W * 0.45,
    OUT_W / 2,
    OUT_H / 2,
    OUT_H * 0.75,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
}

/**
 * ประกอบภาพติดวิญญาณ: รูป → ผี (screen) → ตัวคนทับ → เกรดทั้งภาพ
 * photo ต้องเป็น OUT_W×OUT_H · placement อยู่ในพิกัดภาพวิเคราะห์ (ANALYSIS_W กว้าง)
 */
export async function composeGhostPhoto(
  photo: HTMLCanvasElement,
  seg: PersonMask | null,
  placement: Placement,
  sprite: CanvasImageSource | null,
): Promise<HTMLCanvasElement> {
  const out = canvas(OUT_W, OUT_H);
  const ctx = ctx2d(out);
  ctx.drawImage(photo, 0, 0, OUT_W, OUT_H);

  const k = OUT_W / (seg?.w ?? ANALYSIS_W);
  const b = placement.box;
  const box = { x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k };
  const ghost = ghostLayer(ctx, placement, box, sprite);
  ctx.save();
  ctx.globalAlpha = placement.opacity;
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(ghost, 0, 0);
  ctx.restore();

  if (seg && !placement.front) ctx.drawImage(personLayer(photo, seg), 0, 0);

  grade(ctx);
  return out;
}

export function canvasToJpegBlob(c: HTMLCanvasElement, q = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      q,
    ),
  );
}
