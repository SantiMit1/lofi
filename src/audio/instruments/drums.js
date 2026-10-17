import { getContext, getMaster } from "../engine.js";
import { getNoiseBuffer } from "../noise.js";

export function playKick(time, velocity = 1) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.08);

  amp.gain.setValueAtTime(velocity * 0.9, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

  osc.connect(amp);
  amp.connect(getMaster());

  osc.start(time);
  osc.stop(time + 0.4);
}

export function playSnare(time, velocity = 1) {
  const ctx = getContext();

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  const noiseAmp = ctx.createGain();
  noiseAmp.gain.setValueAtTime(velocity * 0.6, time);
  noiseAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  noise.connect(hp);
  hp.connect(noiseAmp);
  noiseAmp.connect(getMaster());
  noise.start(time);
  noise.stop(time + 0.2);

  // cuerpo tonal del redoblante
  const osc = ctx.createOscillator();
  const oscAmp = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 180;
  oscAmp.gain.setValueAtTime(velocity * 0.35, time);
  oscAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

  osc.connect(oscAmp);
  oscAmp.connect(getMaster());
  osc.start(time);
  osc.stop(time + 0.12);
}

export function playHat(time, velocity = 1, open = false) {
  const ctx = getContext();
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const amp = ctx.createGain();

  const dur = open ? 0.3 : 0.05;
  amp.gain.setValueAtTime(velocity * 0.25, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  noise.connect(hp);
  hp.connect(amp);
  amp.connect(getMaster());

  noise.start(time);
  noise.stop(time + dur + 0.02);
}

export function playOpenHat(time, velocity = 1) {
  playHat(time, velocity, true);
}
