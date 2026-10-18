import { getContext } from "../engine.js";
import { getTrack } from "../mixer.js";
import { midiToFreq } from "../../theory/notes.js";

const RING_TIME = 1.4; // segundos de cuerda que se generan por nota
const DECAY = 0.998; // pérdida por vuelta de la línea de delay
const cache = new Map();

// Karplus-Strong: el periodo de la nota es una línea de delay llena de ruido
// que se realimenta con un filtro promedio. Genera la cuerda entera en un
// buffer. Se cachea por nota porque el buffer no depende del tiempo ni del vel.
function pluckBuffer(ctx, midi) {
  const cached = cache.get(midi);
  if (cached) return cached;

  const rate = ctx.sampleRate;
  const period = Math.max(2, Math.round(rate / midiToFreq(midi)));
  const length = Math.floor(rate * RING_TIME);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;

  let idx = 0;
  let prev = 0;

  for (let i = 0; i < length; i++) {
    const current = ring[idx];
    ring[idx] = (current + prev) * 0.5 * DECAY;
    prev = current;
    data[i] = current;
    idx = (idx + 1) % period;
  }

  cache.set(midi, buffer);
  return buffer;
}

export function playGuitar(midi, time, duration, velocity = 0.4) {
  const ctx = getContext();
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(ctx, midi);

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = Math.min(6500, midiToFreq(midi) * 8);

  const amp = ctx.createGain();
  const tail = Math.min(RING_TIME, duration + 0.5);

  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + tail);

  src.connect(tone);
  tone.connect(amp);
  amp.connect(getTrack("guitar").input);
  src.start(time);
  src.stop(time + tail + 0.05);
}
