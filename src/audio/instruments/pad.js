import { getContext } from "../engine.js";
import { getTrack } from "../mixer.js";
import { midiToFreq } from "../../theory/notes.js";

// Dos voces por nota, desafinadas unos cents: da el ancho y el batido lento
// de un pad de cuerdas.
const DETUNE_CENTS = 7;
const ATTACK = 0.6;
const RELEASE = 0.9;

export function playPad(midi, time, duration, velocity = 0.3) {
  const ctx = getContext();
  const freq = midiToFreq(midi);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.6;
  filter.frequency.value = Math.min(3200, freq * 6);

  const amp = ctx.createGain();
  const peak = time + Math.min(duration * 0.5, ATTACK);
  const end = time + duration + RELEASE;

  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, peak);
  amp.gain.setValueAtTime(velocity, time + duration);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  filter.connect(amp);
  amp.connect(getTrack("pad").input);

  for (const sign of [-1, 1]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq * Math.pow(2, (sign * DETUNE_CENTS) / 1200);
    osc.connect(filter);
    osc.start(time);
    osc.stop(end + 0.05);
  }
}
