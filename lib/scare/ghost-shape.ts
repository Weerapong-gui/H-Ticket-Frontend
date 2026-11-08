/**
 * ร่างผีที่ออกแบบเอง: ผมยาวคลุมไหล่ ชุดยาวชายไม่เท่ากัน แขนห้อย
 * (x, y) = กึ่งกลางใต้เท้า, height = ความสูงทั้งร่าง (px)
 * เบลอด้วยเงา (shadowBlur) แทน ctx.filter เพราะ Safari รุ่นเก่าไม่รองรับ filter บน canvas
 */
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  fill: string,
  blurPx: number,
): void {
  const h = height;
  const w = h / 2;
  const OFF = 100_000; // วาดรูปจริงไว้นอกจอ ให้เห็นแค่เงาที่เบลอแล้ว
  const ox = x - w / 2 - OFF;
  const oy = y - h;
  const X = (f: number) => ox + w * f;
  const Y = (f: number) => oy + h * f;

  ctx.save();
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.shadowBlur = blurPx * 2;
  ctx.shadowOffsetX = OFF;
  ctx.beginPath();
  // หัว
  ctx.ellipse(X(0.5), Y(0.16), w * 0.13, h * 0.075, 0, 0, Math.PI * 2);
  // ผมยาวคลุมไหล่
  ctx.moveTo(X(0.36), Y(0.15));
  ctx.quadraticCurveTo(X(0.3), Y(0.35), X(0.34), Y(0.48));
  ctx.lineTo(X(0.66), Y(0.48));
  ctx.quadraticCurveTo(X(0.7), Y(0.35), X(0.64), Y(0.15));
  ctx.closePath();
  // ชุดยาว ชายไม่เท่ากัน
  ctx.moveTo(X(0.4), Y(0.25));
  ctx.lineTo(X(0.6), Y(0.25));
  ctx.quadraticCurveTo(X(0.72), Y(0.6), X(0.7), Y(0.97));
  ctx.lineTo(X(0.58), Y(0.94));
  ctx.lineTo(X(0.47), Y(0.98));
  ctx.lineTo(X(0.3), Y(0.95));
  ctx.quadraticCurveTo(X(0.28), Y(0.6), X(0.4), Y(0.25));
  ctx.closePath();
  // แขนห้อย
  ctx.rect(X(0.33), Y(0.27), w * 0.05, h * 0.33);
  ctx.rect(X(0.62), Y(0.27), w * 0.05, h * 0.33);
  ctx.fill();
  ctx.restore();
}
