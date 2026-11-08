/**
 * รูปของกล้องแฟลชบนหน้าแรก — วันงานแก้แค่ไฟล์นี้ + วางรูปใหม่ใน public/images/
 * ทุกตัวเลขเป็นสัดส่วน 0–1 ของรูปเต็ม (ก่อนครอป) กล้องครอปรูปเป็น 3:4 ตรงกลาง
 * เลยควรวางจุดไว้ช่วงกลางรูป (แนวตั้งประมาณ 0.2–0.8 สำหรับรูปสูง 1:2)
 */
export type Spot = {
  /** ตำแหน่งเท้า */
  x: number;
  y: number;
  /** ความสูงร่าง (สัดส่วนของความสูงรูป) */
  h: number;
};
export type CameraPhoto = { src: string; alt: string; spots: Spot[] };
export type MirrorShot = {
  src: string;
  alt: string;
  /** กรอบกระจกในรูป */
  mirror: { x: number; y: number; w: number; h: number };
  /** true = รูปยังไม่มีกระจกจริง ให้กล้องวาดกรอบกระจกเอง (ใช้กับรูป mock) */
  mockFrame: boolean;
};

export const cameraConfig: { photos: CameraPhoto[]; mirrorShot: MirrorShot } = {
  photos: [
    {
      src: "/images/hallway.jpg",
      alt: "ทางเดินมืดในบ้านเก่า มีแสงเทียน",
      spots: [
        { x: 0.58, y: 0.57, h: 0.1 },
        { x: 0.46, y: 0.7, h: 0.2 },
        { x: 0.3, y: 0.64, h: 0.17 },
      ],
    },
    {
      src: "/images/room.jpg",
      alt: "ห้องนอนเก่าในบ้านร้าง",
      spots: [
        { x: 0.3, y: 0.63, h: 0.3 },
        { x: 0.6, y: 0.56, h: 0.2 },
      ],
    },
    {
      src: "/images/ritual.jpg",
      alt: "ห้องที่จุดเทียนไว้เป็นวง",
      spots: [
        { x: 0.47, y: 0.55, h: 0.22 },
        { x: 0.56, y: 0.78, h: 0.36 },
      ],
    },
  ],
  mirrorShot: {
    src: "/images/room.jpg",
    alt: "กระจกบานใหญ่ในห้องมืด",
    mirror: { x: 0.35, y: 0.24, w: 0.3, h: 0.42 },
    mockFrame: true,
  },
};
