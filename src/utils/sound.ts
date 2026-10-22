let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playSoftTick(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch {
    // Silent fallback
  }
}

export function playWishDrop(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const freqs = [392.0, 293.66];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f * 1.15, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(f * 0.75, now + 0.55 + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.055, now + idx * 0.08 + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7 + idx * 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + 0.75 + idx * 0.08);
    });
  } catch {
    // Silent fallback
  }
}

export function playSacredChime(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Warm golden Lydian/Major-9 harmonic arpeggio
    const notes = [261.63, 329.63, 392.0, 493.88, 587.33];
    notes.forEach((freq, i) => {
      const start = now + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.045 / (1 + i * 0.15), start + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 2.5);
    });
  } catch {
    // Silent fallback
  }
}
