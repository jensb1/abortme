let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playBeep(frequency = 660, durationMs = 180) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.3;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playPopupBeep() {
  playBeep(660, 150);
  setTimeout(() => playBeep(880, 150), 180);
}

export function playBreakEndBeep() {
  playBeep(523, 150);
  setTimeout(() => playBeep(659, 150), 180);
  setTimeout(() => playBeep(784, 200), 360);
}
