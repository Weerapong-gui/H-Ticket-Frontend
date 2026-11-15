"use client";
// หน้าทดสอบชั่วคราว (ไม่ commit): ประกอบผีลงรูปทดสอบหลาย ๆ แบบ
import { useEffect, useState } from "react";
import {
  ANALYSIS_H,
  ANALYSIS_W,
  OUT_H,
  OUT_W,
} from "@/lib/ghost-cam/compose-math";
import { composeGhostPhoto } from "@/lib/ghost-cam/compose";
import { ghostSprites } from "@/lib/ghost-cam/ghost-config";
import { maskStats } from "@/lib/ghost-cam/mask";
import { planGhost } from "@/lib/ghost-cam/placement";
import { segmentPerson } from "@/lib/ghost-cam/segmenter";

const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

export default function Lab() {
  const [out, setOut] = useState<{ url: string; label: string }[]>([]);
  const [info, setInfo] = useState("working…");
  useEffect(() => {
    (async () => {
      const img = await load("/ghost-lab/test.png");
      const photo = document.createElement("canvas");
      photo.width = OUT_W;
      photo.height = OUT_H;
      const zoom = new URLSearchParams(location.search).get("zoom") ? 2.2 : 1;
      const s = Math.max(OUT_W / img.width, OUT_H / img.height) * zoom;
      photo
        .getContext("2d")!
        .drawImage(
          img,
          (OUT_W - img.width * s) / 2,
          (OUT_H - img.height * s) / 2.6,
          img.width * s,
          img.height * s,
        );
      const small = document.createElement("canvas");
      small.width = ANALYSIS_W;
      small.height = ANALYSIS_H;
      small.getContext("2d")!.drawImage(photo, 0, 0, ANALYSIS_W, ANALYSIS_H);
      const seg = await segmentPerson(small);
      const stats = seg ? maskStats(seg.mask, seg.w, seg.h) : null;
      setInfo(JSON.stringify({ seg: !!seg, w: seg?.w, h: seg?.h, stats }));
      const res: { url: string; label: string }[] = [];
      const want = ["behind-left", "behind-right", "far", "edge", "figure"];
      for (const v of want) {
        let p = null;
        for (let i = 0; i < 400 && !p; i++) {
          const c = planGhost(
            stats,
            seg?.w ?? ANALYSIS_W,
            seg?.h ?? ANALYSIS_H,
            ghostSprites,
            { figure: v === "figure", rand: Math.random },
          );
          if (c.variant === v) p = c;
        }
        if (!p) {
          res.push({ url: "", label: v + " (none)" });
          continue;
        }
        const sprite = p.sprite ? await load(p.sprite.src) : null;
        const c = await composeGhostPhoto(photo, seg, p, sprite);
        res.push({
          url: c.toDataURL("image/jpeg", 0.85),
          label: `${v} · ${p.sprite?.id ?? "figure"} · op ${p.opacity.toFixed(2)} · front ${p.front} · box ${[p.box.x, p.box.y, p.box.w, p.box.h].map((n) => Math.round(n)).join(",")}`,
        });
      }
      setOut(res);
    })().catch((e) => setInfo(String(e)));
  }, []);
  return (
    <main style={{ padding: 20, background: "#111" }}>
      <p
        id="lab-info"
        style={{ fontSize: 11, color: "#aaa", wordBreak: "break-all" }}
      >
        {info}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {out.map((o) => (
          <figure key={o.label} style={{ margin: 0, width: 300 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {o.url && <img src={o.url} alt={o.label} style={{ width: 300 }} />}
            <figcaption style={{ color: "#ccc", fontSize: 12 }}>
              {o.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
