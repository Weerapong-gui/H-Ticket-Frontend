/** เสียงกระซิบไม่เป็นคำ สร้างจาก noise สด ๆ ไม่ใช้ไฟล์เสียง (client only) */

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const PEAK_GAIN = 0.35;

export class WhisperEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private live = new Set<AudioBufferSourceNode>();

  /** ต้องเรียกตรง ๆ จาก gesture ของผู้ใช้ (แตะ/คลิก) ไม่งั้นเบราว์เซอร์ไม่ให้เล่นเสียง */
  unlock(opts: { overrideSilent: boolean }): Promise<void> {
    if (opts.overrideSilent) {
      const session = (navigator as AudioSessionNavigator).audioSession;
      if (session) {
        try {
          // ให้ดังแม้ iPhone เปิดโหมดเงียบ — ใช้เฉพาะเมื่อผู้ใช้เลือกฟังเสียงเอง
          session.type = "playback";
        } catch {
          // Safari รุ่นที่ไม่รองรับ ปล่อยตามค่าปกติของเครื่อง
        }
      }
    }
    if (!this.ctx) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      const noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.noise = noise;
    }
    return this.ctx.state === "suspended"
      ? this.ctx.resume()
      : Promise.resolve();
  }

  get unlocked(): boolean {
    return this.ctx?.state === "running";
  }

  /** เสียงกระซิบ 1 วลี 2–4 พยางค์ จากทิศสุ่มรอบหัว บางครั้งจ่อหูข้างเดียว */
  play(): void {
    const { ctx, master, noise } = this;
    if (!ctx || !master || !noise || this.muted || ctx.state !== "running")
      return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    const env = ctx.createGain();
    env.gain.value = 0;
    const pan = ctx.createPanner();
    pan.panningModel = "HRTF";
    pan.distanceModel = "inverse";
    pan.refDistance = 0.4;
    const close = Math.random() < 0.25;
    const radius = close ? 0.25 : 1.6;
    const angle = Math.random() * Math.PI * 2;
    pan.positionX.value = Math.sin(angle) * radius;
    pan.positionY.value = 0;
    pan.positionZ.value = -Math.cos(angle) * radius;
    src.connect(hp).connect(bp).connect(env).connect(pan).connect(master);

    let t = ctx.currentTime + 0.05;
    const syllables = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < syllables; i++) {
      const len = 0.18 + Math.random() * 0.28;
      const peak = PEAK_GAIN * (0.7 + Math.random() * 0.3);
      bp.frequency.setValueAtTime(1800 + Math.random() * 2200, t);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.05);
      env.gain.setValueAtTime(peak, t + len - 0.08);
      env.gain.linearRampToValueAtTime(0, t + len);
      t += len + 0.06 + Math.random() * 0.1;
    }
    src.start();
    src.stop(t + 0.05);
    this.live.add(src);
    src.onended = () => {
      this.live.delete(src);
      src.disconnect();
    };
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(
        muted ? 0 : 1,
        this.ctx.currentTime,
        0.05,
      );
  }

  dispose(): void {
    for (const src of this.live) {
      try {
        src.stop();
      } catch {
        // หยุดไปแล้ว
      }
    }
    this.live.clear();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
  }
}
