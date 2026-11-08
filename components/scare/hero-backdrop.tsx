"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useScare } from "./scare-provider";
import type { FogScene } from "./fog-scene";

/**
 * พื้นหลัง hero: รูปนิ่ง (SSR, LCP และ fallback) + ทุ่งหมอก Three.js ที่โหลดทีหลัง
 * ถ้าเครื่องรัน WebGL ไม่ได้ จะเหลือรูปนิ่ง และร่างชุดดำไม่เดินเข้ามา
 */
export function HeroBackdrop() {
  const { entered, figure, heroVisible, reducedMotion } = useScare();
  const host = useRef<HTMLDivElement>(null);
  const blink = useRef<HTMLDivElement>(null);
  const scene = useRef<FogScene | null>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const shownStep = useRef<number | null>(null);

  // โหลด three หลัง mount เท่านั้น ไม่ให้ถ่วงข้อความ/ปุ่มใน hero
  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;
    import("./fog-scene")
      .then(({ createFogScene }) => {
        if (cancelled) return;
        try {
          scene.current = createFogScene(el, { reducedMotion });
          setReady(true);
        } catch {
          // ไม่มี WebGL — ใช้รูปนิ่งต่อ
        }
      })
      .catch(() => {});
    const onResize = () => scene.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [reducedMotion]);

  // หยุด render เมื่อ hero พ้นจอหรือแท็บถูกซ่อน
  useEffect(() => {
    const el = host.current?.closest(".hero");
    if (!el || !ready) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const sync = () => scene.current?.setRunning(inView && !document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [ready, inView]);

  // ร่างขยับให้เห็นเฉพาะตอน hero อยู่บนจอ
  useEffect(() => {
    if (ready && inView && figure.pending > 0) heroVisible();
  }, [ready, inView, figure.pending, heroVisible]);

  // เปลี่ยนตำแหน่งร่างแบบ "กะพริบตา": มืด 0.6 วิ แล้วร่างอยู่ที่ใหม่ ไม่เห็นตอนเดิน
  useEffect(() => {
    const s = scene.current;
    // entered === null = ยังไม่ได้อ่านค่าที่เก็บไว้ ถ้าวางร่างตอนนี้จะได้ step 0 แล้วกะพริบตอนโหลดเสร็จ
    if (!ready || !s || entered === null) return;
    const step = figure.step;
    if (shownStep.current === null || reducedMotion) {
      shownStep.current = step;
      s.setStep(step);
      return;
    }
    if (shownStep.current === step) return;
    shownStep.current = step;
    const b = blink.current;
    if (!b) {
      s.setStep(step);
      return;
    }
    b.style.opacity = "1";
    const t = window.setTimeout(() => {
      s.setStep(step);
      b.style.opacity = "0";
    }, 600);
    return () => window.clearTimeout(t);
  }, [ready, entered, figure.step, reducedMotion]);

  return (
    <>
      <Image
        src="/images/mansion.jpg"
        alt="บ้านเก่าทรุดโทรมใต้พระจันทร์สีแดง"
        fill
        loading="eager"
        sizes="100vw"
        className="hero-image"
      />
      <div
        ref={host}
        className={ready ? "hero-scene ready" : "hero-scene"}
        aria-hidden="true"
      />
      <div ref={blink} className="hero-blink" aria-hidden="true" />
    </>
  );
}
