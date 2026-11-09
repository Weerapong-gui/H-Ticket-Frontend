import type { ImageSegmenter } from "@mediapipe/tasks-vision";

export type PersonMask = { mask: Float32Array; w: number; h: number };

let loading: Promise<ImageSegmenter | null> | null = null;
let warned = false;

function warnOnce(e: unknown) {
  if (warned) return;
  warned = true;
  console.warn("[ghost-cam] หาตัวคนไม่ได้ จะใช้ผีมุมจอแทน", e);
}

/** โหลดโมเดลครั้งเดียว (wasm + โมเดลเสิร์ฟจาก public/ ของเว็บเราเอง) */
function load(): Promise<ImageSegmenter | null> {
  loading ??= (async () => {
    try {
      const { FilesetResolver, ImageSegmenter } =
        await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return await ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/mediapipe/selfie_segmenter.tflite" },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    } catch (e) {
      warnOnce(e);
      return null;
    }
  })();
  return loading;
}

/** เริ่มโหลดตอนกดเปิดกล้อง ไม่ต้องรอ */
export function preloadSegmenter(): void {
  void load();
}

/** ความมั่นใจว่าเป็นคนรายพิกเซล 0–1 ขนาดเท่า src · ไม่ throw: พลาดอะไรคืน null */
export async function segmentPerson(
  src: HTMLCanvasElement,
): Promise<PersonMask | null> {
  const seg = await load();
  if (!seg) return null;
  try {
    const result = seg.segment(src);
    const masks = result.confidenceMasks ?? [];
    const labels = seg.getLabels().map((l) => l.toLowerCase());
    const i = labels.indexOf("person");
    const m = masks[i >= 0 ? i : masks.length - 1];
    if (!m) {
      result.close();
      return null;
    }
    const out = {
      mask: new Float32Array(m.getAsFloat32Array()),
      w: m.width,
      h: m.height,
    };
    result.close();
    return out;
  } catch (e) {
    warnOnce(e);
    return null;
  }
}
