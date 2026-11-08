"use client";
import { Volume2, VolumeX } from "lucide-react";
import { useScare } from "./scare-provider";

export function MuteButton() {
  const { entered, muted, toggleMute } = useScare();
  if (entered !== true) return null;
  return (
    <button
      type="button"
      className="mute-button"
      aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
      aria-pressed={muted}
      onClick={toggleMute}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
