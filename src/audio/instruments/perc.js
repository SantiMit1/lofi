import { getContext } from "../engine.js";
import { getTrack } from "../mixer.js";
import { getNoiseBuffer } from "../noise.js";

function noiseSource(ctx) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer();
  return src;
}

// Shaker: ruido agudo con ataque cortisimo y cola muy breve.
export function playShaker(time, velocity = 0.3) {
  const ctx = getContext();
  const noise = noiseSource(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 5000;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

  noise.connect(hp);
  hp.connect(amp);
  amp.connect(getTrack("perc").input);
  noise.start(time);
  noise.stop(time + 0.1);
}

// Pandereta: banda metalica mas larga que el shaker.
export function playTambourine(time, velocity = 0.3) {
  const ctx = getContext();
  const noise = noiseSource(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 6000;
  bp.Q.value = 0.8;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  noise.connect(bp);
  bp.connect(amp);
  amp.connect(getTrack("perc").input);
  noise.start(time);
  noise.stop(time + 0.2);
}

// Rimshot: golpe tonal corto (el aro) mas un click de ruido.
export function playRimshot(time, velocity = 0.35) {
  const ctx = getContext();

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1700, time);
  osc.frequency.exponentialRampToValueAtTime(900, time + 0.03);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.002);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

  osc.connect(amp);
  amp.connect(getTrack("perc").input);
  osc.start(time);
  osc.stop(time + 0.1);

  const click = noiseSource(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3000;

  const clickAmp = ctx.createGain();
  clickAmp.gain.setValueAtTime(velocity * 0.5, time);
  clickAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

  click.connect(hp);
  hp.connect(clickAmp);
  clickAmp.connect(getTrack("perc").input);
  click.start(time);
  click.stop(time + 0.04);
}
