import { getContext, getMaster } from "../engine.js";
import { midiToFreq } from "../../theory/notes.js";

export function playBass(midi, time, duration, velocity = 0.6) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = midiToFreq(midi);

  filter.type = "lowpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(500, time);
  filter.frequency.exponentialRampToValueAtTime(150, time + duration * 0.5);

  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(getMaster());

  osc.start(time);
  osc.stop(time + duration + 0.05);
}
