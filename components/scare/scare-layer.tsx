"use client";
import { ScareProvider } from "./scare-provider";
import { EntryGate } from "./entry-gate";
import { MuteButton } from "./mute-button";

/** ลูกเล่นความน่ากลัวทั้งหมด ใช้เฉพาะหน้าแรก ออกจากหน้าแรกแล้วทุกอย่างหยุด */
export function ScareLayer({ children }: { children: React.ReactNode }) {
  return (
    <ScareProvider>
      {children}
      <EntryGate />
      <MuteButton />
    </ScareProvider>
  );
}
