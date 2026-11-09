/**
 * รูปผีสำหรับกล้องผี: ทุกรูปเป็นผีจาง ๆ บนพื้นดำสนิท (ผสมแบบ screen ไม่ต้องตัดขอบ)
 * kind: behind = ครึ่งตัวยืนหลังไหล่ · far = ทั้งตัวไกลในฉาก · edge = ครึ่งหน้าโผล่จากขอบซ้าย · hand = มือแตะไหล่
 * src "procedural:<kind>" = ยังไม่มีไฟล์ ให้วาดร่างผีด้วยโค้ดแทน
 */
export type GhostKind = "behind" | "far" | "edge" | "hand";
export type GhostSprite = {
  id: string;
  src: string;
  kind: GhostKind;
  /** กลับซ้ายขวาได้โดยไม่ดูแปลก */
  flippable: boolean;
};

export const ghostSprites: GhostSprite[] = [
  {
    id: "placeholder-behind",
    src: "procedural:behind",
    kind: "behind",
    flippable: true,
  },
  {
    id: "placeholder-far",
    src: "procedural:far",
    kind: "far",
    flippable: true,
  },
  {
    id: "placeholder-edge",
    src: "procedural:edge",
    kind: "edge",
    flippable: true,
  },
];
