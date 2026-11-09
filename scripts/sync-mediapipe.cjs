/* eslint-disable @typescript-eslint/no-require-imports -- build helper */
// คัดไฟล์ wasm ของ MediaPipe ไปไว้ใน public/ ให้เว็บเสิร์ฟเอง (ไม่โหลดจาก CDN ของ Google ตอนใช้งาน)
const fs = require("node:fs");
const path = require("node:path");
const from = path.join("node_modules", "@mediapipe", "tasks-vision", "wasm");
const to = path.join("public", "mediapipe", "wasm");
fs.mkdirSync(to, { recursive: true });
for (const name of fs.readdirSync(from)) {
  const src = path.join(from, name);
  const dst = path.join(to, name);
  const same =
    fs.existsSync(dst) && fs.statSync(dst).size === fs.statSync(src).size;
  if (!same) fs.copyFileSync(src, dst);
}
console.log(`MediaPipe wasm synced to ${to}`);
