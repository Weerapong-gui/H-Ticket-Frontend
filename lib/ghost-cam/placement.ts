import type { Box, MaskStats } from "./mask";
import type { GhostKind, GhostSprite } from "./ghost-config";

export type Variant =
  "behind-left" | "behind-right" | "far" | "edge" | "hand" | "figure";
export type Placement = {
  variant: Variant;
  /** null = ไม่มีไฟล์ผี วาดร่างผีด้วยโค้ดแทน */
  sprite: GhostSprite | null;
  box: Box;
  flipX: boolean;
  opacity: number;
  blurPx: number;
  /** true = วาดทับตัวคน (ไม่มีที่ว่างข้างหลัง หรือเป็นมือแตะไหล่) */
  front: boolean;
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
    opacity: between(rand, 0.45, 0.7),
    blurPx: between(rand, 1.5, 4),
  });

  /** ไม่มีที่ว่างข้างหัว (หน้าเต็มจอ): วางผีที่ขอบภาพทับไหล่ด้านหน้า ใต้แนวหัว ไม่ทับหน้า */
  const frontFallback = (
    variant: "edge" | "figure",
    sprite: GhostSprite | null,
  ): Placement => {
    const stats0 = stats as MaskStats;
    const top = stats0.head.y + stats0.head.h + 1;
    const fh = Math.max(
      h * 0.3,
      Math.min(h - top, h * between(rand, 0.35, 0.5)),
    );
    const fw = fh * 0.6;
    const right =
      stats0.freeRight === stats0.freeLeft
        ? rand() < 0.5
        : stats0.freeRight > stats0.freeLeft;
    return {
      variant,
      sprite,
      box: {
        x: right ? w - fw * 0.7 : -fw * 0.3,
        y: Math.min(top, h - fh),
        w: fw,
        h: fh,
      },
      flipX: right && !!sprite?.flippable,
      ...(variant === "figure" ? { opacity: 0.85, blurPx: 1.5 } : faint()),
      front: true,
    };
  };

  if (opts.figure) {
    // ฉากจบเรื่องผีชุดดำ: "อยู่ข้างหลังคุณ" — ผีผมยาวยืนชิดหัว ใหญ่และชัดกว่าผีปกติ
    // (เงาดำล้วนมองไม่เห็นในรูปที่ฉากหลังมืด จึงใช้ผีหน้าซีดแทน)
    const behind = of("behind");
    const sprite =
      behind.find((s) => s.id === "long-hair") ?? behind[0] ?? null;
    if (!stats) {
      const fh = h * 0.7;
      return {
        variant: "figure",
        sprite,
        box: { x: w * 0.05, y: h * 0.05, w: fh * 0.6, h: fh },
        flipX: false,
        opacity: 0.85,
        blurPx: 1.5,
        front: false,
      };
    }
    const head = stats.head;
    const left = stats.freeLeft >= stats.freeRight;
    const fh = head.h * between(rand, 3.6, 4.2);
    const fw = fh * 0.6;
    // ต้องเห็นได้อย่างน้อย 12% ของความกว้างภาพ ไม่งั้นฉากจบหายไปเฉย ๆ
    if (Math.max(stats.freeLeft, stats.freeRight) < w * 0.12)
      return frontFallback("figure", sprite);
    return {
      variant: "figure",
      sprite,
      box: {
        x: left ? head.x - fw : head.x + head.w,
        y: Math.max(0, head.y - fh * 0.08),
        w: fw,
        h: fh,
      },
      flipX: !left && !!sprite?.flippable,
      opacity: 0.85,
      blurPx: 1.5,
      front: false,
    };
  }

  const edge = (): Placement => {
    const sprite = pick(rand, of("edge").length ? of("edge") : sprites);
    // ฝั่งที่มีที่ว่างมากกว่า (ไม่รู้ตำแหน่งคนก็สุ่ม)
    const right =
      !stats || stats.freeLeft === stats.freeRight
        ? rand() < 0.5
        : stats.freeRight > stats.freeLeft;
    let eh = h * between(rand, 0.45, 0.6);
    const out = between(rand, 0.4, 0.6);
    if (stats) {
      // ส่วนที่โผล่เข้ามาต้องไม่เกินที่ว่างข้างหัว ไม่งั้นโดนตัวคนบังหมด
      const free = right ? stats.freeRight : stats.freeLeft;
      eh = Math.min(eh, (free * 0.95) / (1 - out) / 0.6);
      // ที่ว่างน้อยเกินจนผีเล็กมองไม่เห็น → วางด้านหน้าแทน
      if (eh * 0.6 * (1 - out) < w * 0.12 || eh < h * 0.3)
        return frontFallback("edge", sprite);
    }
    // อยู่ช่วงข้างหัว (ด้านล่างมักโดนไหล่บัง)
    const y = stats
      ? between(rand, 0, Math.max(0, stats.head.y + stats.head.h * 0.6))
      : between(rand, h * 0.05, h - eh);
    const place = () => {
      const ew = eh * 0.6;
      return { x: right ? w - ew * (1 - out) : -ew * out, y, w: ew, h: eh };
    };
    const box = place();
    if (stats && overlaps(box, stats.head))
      return frontFallback("edge", sprite);
    return {
      variant: "edge",
      sprite,
      box,
      flipX: right && sprite.flippable,
      ...faint(),
      front: false,
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
    const free = variant === "behind-left" ? stats.freeLeft : stats.freeRight;
    // ขนาดอิงหัว (เซลฟี่ตัวคนเต็มจอ ใช้ความสูงตัวไม่ได้) และต้องอยู่ในภาพอย่างน้อยครึ่งตัว
    const bh = Math.min(head.h * between(rand, 2.6, 3.4), (2 * free) / 0.6);
    const bw = bh * 0.6;
    const y = Math.max(0, head.y - bh * between(rand, 0, 0.15));
    // ชิดข้างหัวพอดี ส่วนล่างของผีจะถูกไหล่บัง (ตัวคนวาดทับ)
    const x = variant === "behind-left" ? head.x - bw : head.x + head.w;
    return {
      variant,
      sprite,
      box: { x, y, w: bw, h: bh },
      flipX: variant === "behind-right" && sprite.flippable,
      ...faint(),
      front: false,
    };
  }

  if (variant === "far") {
    // ผีทั้งตัวเล็ก ๆ ไกลในฉาก: อยู่ในที่ว่างข้างหัว ระดับเดียวกับหัว (ด้านล่างโดนไหล่บัง)
    const sprite = pick(rand, of("far"));
    const useLeft = stats.freeLeft >= stats.freeRight;
    const free = useLeft ? stats.freeLeft : stats.freeRight;
    const fh = Math.min(p.h * between(rand, 0.3, 0.45), h * 0.5);
    const fw = Math.min(fh * 0.5, free * 0.9);
    const lo = useLeft ? free * 0.05 : head.x + head.w;
    const hi = useLeft ? head.x - fw : w - fw - free * 0.05;
    const yLo = Math.max(h * 0.05, head.y - fh * 0.4);
    return {
      variant,
      sprite,
      box: {
        x: between(rand, lo, Math.max(lo, hi)),
        y: between(rand, yLo, Math.max(yLo, head.y + head.h - fh * 0.5)),
        w: fw,
        h: fh,
      },
      flipX: sprite.flippable && rand() < 0.5,
      ...faint(),
      front: false,
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
    front: true,
  };
}
