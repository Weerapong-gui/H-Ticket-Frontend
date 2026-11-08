import * as THREE from "three";
import { drawGhost } from "@/lib/scare/ghost-shape";
import { FIGURE_GONE } from "@/lib/scare/figure-state";

/** ระยะของร่างชุดดำตาม step 0–5 (ยิ่งใกล้ 0 ยิ่งใกล้กล้อง) */
export const FIGURE_Z: readonly number[] = [-28, -21, -15, -10, -6, -3];

export type FogScene = {
  setStep(step: number): void;
  setRunning(on: boolean): void;
  resize(): void;
  dispose(): void;
};

function figureTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");
  if (ctx) drawGhost(ctx, 128, 500, 480, "#050505", 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** throw ถ้าสร้าง WebGL context ไม่ได้ — ผู้เรียกจะใช้รูปนิ่งแทน */
export function createFogScene(
  container: HTMLElement,
  opts: { reducedMotion: boolean },
): FogScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.append(renderer.domElement);

  const fog = 0x11151a;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(fog);
  scene.fog = new THREE.FogExp2(fog, 0.055);
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.1,
    200,
  );
  camera.position.set(0, 1.6, 6);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x1b1f17, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.HemisphereLight(0x5a6a80, 0x0a0a08, 0.5));

  const bark = new THREE.MeshStandardMaterial({
    color: 0x14100d,
    roughness: 1,
  });
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 5, 7);
  const branchGeo = new THREE.CylinderGeometry(0.05, 0.14, 3, 5);
  const tree = (x: number, z: number, s: number, seed: number) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, bark);
    trunk.position.y = 2.5;
    g.add(trunk);
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(branchGeo, bark);
      b.position.set(0, 3.2 + i * 0.35, 0);
      b.rotation.z = (i % 2 ? 1 : -1) * (0.6 + ((seed * (i + 3)) % 5) / 10);
      b.rotation.y = i * 1.3;
      b.translateY(1.3);
      g.add(b);
    }
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
  };
  tree(0.8, -30, 1.4, 1);
  [
    [-9, -22, 1.2],
    [8, -40, 1.4],
    [-14, -45, 1.3],
    [14, -18, 1.1],
    [-5, -60, 1.5],
  ].forEach(([x, z, s], i) => tree(x, z, s, i + 2));

  const texture = figureTexture();
  const figure = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  figure.scale.set(0.9, 1.8, 1);
  scene.add(figure);

  let raf = 0;
  let running = false;
  const frame = (t: number) => {
    if (!opts.reducedMotion) camera.position.y = 1.6 + Math.sin(t / 900) * 0.02;
    camera.lookAt(0, 1.4, -20);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const api: FogScene = {
    setStep(step) {
      figure.visible = step < FIGURE_GONE;
      const i = Math.min(Math.max(step, 0), FIGURE_Z.length - 1);
      figure.position.set(i < 5 ? (i % 2 ? 0.3 : -0.3) : 0, 0.95, FIGURE_Z[i]);
      if (!running) renderer.render(scene, camera);
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    },
    resize() {
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!running) renderer.render(scene, camera);
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      bark.dispose();
      texture.dispose();
      figure.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return api;
}
