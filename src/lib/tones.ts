/**
 * Little WebAudio "pop" chimes for room presence: a rising two-note pop when
 * someone joins and a falling one when someone leaves. Synthesized on the fly,
 * so the app carries no sound files. Safe to call from anywhere — the context
 * is created lazily and resumed on demand.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const Ctor =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One short note: oscillator with a fast attack and an exponential decay. */
function note(
  ac: AudioContext,
  destination: AudioNode,
  freq: number,
  start: number,
  duration: number,
  gain: number,
) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env);
  env.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Pop in: bubbly rising blip for a member joining the room. */
export function popIn() {
  const ac = context();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const bus = ac.createGain();
  bus.gain.value = 0.5;
  bus.connect(ac.destination);
  // Soft bubble: quick rise with a gentle "plup".
  oscSweep(ac, bus, 330, 520, t, 0.09, 0.5);
  note(ac, bus, 660, t + 0.1, 0.16, 0.45);
  note(ac, bus, 990, t + 0.16, 0.2, 0.2);
}

/** Pop out/drop: falling two-note descent for a member leaving the room. */
export function popOut() {
  const ac = context();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const bus = ac.createGain();
  bus.gain.value = 0.5;
  bus.connect(ac.destination);
  oscSweep(ac, bus, 520, 300, t, 0.1, 0.5);
  note(ac, bus, 330, t + 0.12, 0.18, 0.45);
}

/** A short swoop-shaped note (frequency glides from one pitch to another). */
function oscSweep(
  ac: AudioContext,
  destination: AudioNode,
  from: number,
  to: number,
  start: number,
  duration: number,
  gain: number,
) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env);
  env.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}
