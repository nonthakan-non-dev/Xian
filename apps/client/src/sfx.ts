const MUTE_KEY = "xian-sfx-mute";

let ctx: AudioContext | undefined;

function getCtx(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return undefined;
    }
  }
  return ctx;
}

export function isSfxMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setSfxMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

/** Short placeholder beep — no asset files. */
export function playSfx(kind: "hit" | "skill" | "pickup") {
  if (isSfxMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  const freq = kind === "skill" ? 440 : kind === "pickup" ? 660 : 220;
  osc.frequency.value = freq;
  gain.gain.value = 0.04;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
  osc.stop(ac.currentTime + 0.09);
}
