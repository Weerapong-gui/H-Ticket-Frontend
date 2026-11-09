import type { Box, MaskStats } from "./mask";
import type { GhostKind, GhostSprite } from "./ghost-config";

export type Variant =
  "behind-left" | "behind-right" | "far" | "edge" | "hand" | "figure";
export type Placement = {
  variant: Variant;
  /** null = ผีชุดดำ (วาดด้วยโค้ด) */
  sprite: GhostSprite | null;
  box: Box;
  flipX: boolean;
  opacity: number;
  blurPx: number;
};

/** ฉากหลังข้างตัวคนต้องกว้างอย่างน้อยเท่านี้ (สัดส่วนความกว้างภาพ) ถึงวางผีหลังไหล่/ไกลได้ */
const MIN_FREE = 0.18;
const between = (rand: () => number, a: number, b: number) =>
  a + (b - a) * rand();
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.min(items.length - 1, Math.floor(rand() * items.length))];
}

/** เลือกแบบผีและตำแหน่ง (ไม่สุ่มเองข้างใน รับ rand เข้ามาเพื่อให้เทสต์ซ้ำได้) */
export function planGhost(
  stats: MaskStats | null,
  w: number,
  h: number,
  sprites: GhostSprite[],
  opts: { figure: boolean; rand: () => number },
): Placement {
  const { rand } = opts;
  const of = (k: GhostKind) => sprites.filter((s) => s.kind === k);
  const faint = () => ({
    opacity: between(rand, 0.28, 0.45),
    blurPx: between(rand, 1.5, 4),
  });

  if (opts.figure) {
    if (!stats) {
      const fh = h * 0.8;
      return {
        variant: "figure",
        sprite: null,
        box: { x: (w - fh * 0.5) / 2, y: h * 0.95 - fh, w: fh * 0.5, h: fh },
        flipX: false,
        opacity: 0.85,
        blurPx: 2,
      };
    }
    const p = stats.person;
    const fh = Math.min(p.h * 1.05, h * 0.98);
    const fw = fh * 0.5;
    const cx =
      stats.freeLeft >= stats.freeRight ? p.x + p.w * 0.15 : p.x + p.w * 0.85;
    return {
      variant: "figure",
      sprite: null,
      box: { x: cx - fw / 2, y: p.y + p.h - fh, w: fw, h: fh },
      flipX: false,
      opacity: 0.85,
      blurPx: 2,
    };
  }

  const edge = (): Placement => {
    const sprite = pick(rand, of("edge").length ? of("edge") : sprites);
    const right = rand() < 0.5;
    let eh = h * between(rand, 0.45, 0.6);
    let y = between(rand, h * 0.05, h - eh);
    const out = between(rand, 0.4, 0.6);
    const place = () => {
      const ew = eh * 0.6;
      return { x: right ? w - ew * (1 - out) : -ew * out, y, w: ew, h: eh };
    };
    let box = place();
    if (stats && overlaps(box, stats.head)) {
      y = stats.head.y + stats.head.h + 1;
      eh = Math.min(eh, h - y);
      box = place();
    }
    return {
      variant: "edge",
      sprite,
      box,
      flipX: right && sprite.flippable,
      ...faint(),
    };
  };

  if (!stats) return edge();
  const p = stats.person;
  const head = stats.head;
  const leftOk = stats.freeLeft >= w * MIN_FREE;
  const rightOk = stats.freeRight >= w * MIN_FREE;
  if (!leftOk && !rightOk) return edge();

  const choices: [Variant, number][] = [];
  if (of("behind").length) {
    if (leftOk) choices.push(["behind-left", 5]);
    if (rightOk) choices.push(["behind-right", 5]);
  }
  if (of("far").length) choices.push(["far", 2]);
  // สเปกนับ "โผล่มุมจอ" เป็นแบบที่สุ่มได้ด้วย ไม่ใช่แค่ทางสำรอง
  if (of("edge").length) choices.push(["edge", 2]);
  if (of("hand").length) choices.push(["hand", 1]);
  if (!choices.length) return edge();
  let r = rand() * choices.reduce((a, [, n]) => a + n, 0);
  let variant = choices[0][0];
  for (const [v, n] of choices) {
    if ((r -= n) < 0) {
      variant = v;
      break;
    }
  }

  if (variant === "edge") return edge();

  if (variant === "behind-left" || variant === "behind-right") {
    const sprite = pick(rand, of("behind"));
    const bh = p.h * between(rand, 0.9, 1.1);
    const bw = bh * 0.6;
    const lap = bw * between(rand, 0.15, 0.3);
    const y = Math.max(0, p.y + bh * between(rand, -0.05, 0.1));
    // ซ้อนเข้าไปหลังตัวคนได้ แต่ไม่เกินขอบหัว (ตัวคนจะถูกวาดทับอยู่แล้ว)
    const x =
      variant === "behind-left"
        ? Math.min(p.x + lap, head.x) - bw
        : Math.max(p.x + p.w - lap, head.x + head.w);
    return {
      variant,
      sprite,
      box: { x, y, w: bw, h: bh },
      flipX: variant === "behind-right" && sprite.flippable,
      ...faint(),
    };
  }

  if (variant === "far") {
    const sprite = pick(rand, of("far"));
    const fh = p.h * between(rand, 0.25, 0.4);
    const fw = fh * 0.5;
    const useLeft = stats.freeLeft >= stats.freeRight;
    const lo = useLeft ? 0 : p.x + p.w;
    const hi = useLeft ? Math.max(0, p.x - fw) : Math.max(lo, w - fw);
    return {
      variant,
      sprite,
      box: {
        x: between(rand, lo, hi),
        y: between(rand, 0, Math.max(0, h / 3 - fh / 2)),
        w: fw,
        h: fh,
      },
      flipX: sprite.flippable && rand() < 0.5,
      ...faint(),
    };
  }

  // hand: มือแตะไหล่ อยู่หน้าตัวคน (ตัวคนไม่ถูกวาดทับ) จึงต้องจางมาก
  const sprite = pick(rand, of("hand"));
  const hh = p.h * 0.3;
  const hw = hh * 0.6;
  return {
    variant: "hand",
    sprite,
    box: {
      x: p.x + p.w * between(rand, 0.05, 0.6),
      y: p.y + head.h * 0.9,
      w: hw,
      h: hh,
    },
    flipX: sprite.flippable && rand() < 0.5,
    ...faint(),
  };
}
