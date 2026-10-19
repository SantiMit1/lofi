import { getContext, getMaster } from "../engine.js";
import { getNoiseBuffer } from "../noise.js";

// SFX sueltos: no pasan por el mixer, salen directo al master (como click.js).
// Son color, van con poca frecuencia y baja probabilidad.

// Tape stop: la cinta frena y el tono cae hasta apagarse.
export function playTapeStop(time, duration = 1, velocity = 0.5) {
  const ctx = getContext();
  const end = time + duration;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, time);
  osc.frequency.exponentialRampToValueAtTime(30, end);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2500, time);
  filter.frequency.exponentialRampToValueAtTime(200, end);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity * 0.5, time + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(getMaster());
  osc.start(time);
  osc.stop(end + 0.05);
}

// Rebobinado: siseo de banda que sube de frecuencia.
export function playRewind(time, duration = 0.5, velocity = 0.3) {
  const ctx = getContext();
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer();

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 4;
  bp.frequency.setValueAtTime(900, time);
  bp.frequency.exponentialRampToValueAtTime(4200, time + duration);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  noise.connect(bp);
  bp.connect(amp);
  amp.connect(getMaster());
  noise.start(time);
  noise.stop(time + duration + 0.02);
}

// Lluvia: ruido filtrado con fade de entrada y salida.
export function playRain(time, duration = 2, velocity = 0.25) {
  const ctx = getContext();
  const end = time + duration;
  const fade = Math.min(0.6, duration * 0.3);

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  noise.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 800;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6000;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + fade);
  amp.gain.setValueAtTime(velocity, end - fade);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  noise.connect(hp);
  hp.connect(lp);
  lp.connect(amp);
  amp.connect(getMaster());
  noise.start(time);
  noise.stop(end + 0.02);
}
