let ctx: AudioContext | null = null;

// Call from a tap: Safari blocks audio until the user interacts.
export function unlockAudio() {
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  ctx ??= new Ctor();
  void ctx.resume();
}

export function chime(level: 'caution' | 'danger') {
  if (!ctx) return;
  const audio = ctx;
  const notes = level === 'danger' ? [880, 880, 880] : [660, 880];
  const start = audio.currentTime;
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = start + i * 0.18;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  });
}
