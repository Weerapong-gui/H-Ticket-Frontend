"use client";
import { Volume2, VolumeX } from "lucide-react";
import { useScare } from "./scare-provider";
import { useT } from "@/lib/i18n/client";

export function MuteButton() {
  const { entered, muted, toggleMute } = useScare();
  const t = useT();
  if (entered !== true) return null;
  return (
    <button
      type="button"
      className="mute-button"
      aria-label={muted ? t.common.unmute : t.common.mute}
      aria-pressed={muted}
      onClick={toggleMute}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
