import { getContext } from "../engine.js";
import { getTrack } from "../mixer.js";
import { midiToFreq } from "../../theory/notes.js";

export function playKeys(midi, time, duration, velocity = 0.5, track = "keys") {
  const ctx = getContext();
  const freq = midiToFreq(midi);

  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const amp = ctx.createGain();

  carrier.type = "sine";
  modulator.type = "sine";
  carrier.frequency.value = freq;
  modulator.frequency.value = freq * 2; // ratio 2:1

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);

  carrier.connect(amp);
  amp.connect(getTrack(track).input);

  const attack = 0.008;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(velocity, time + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  modGain.gain.setValueAtTime(freq * 2, time);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, time + duration * 0.4);

  const stop = time + duration + 0.05;
  carrier.start(time);
  modulator.start(time);
  carrier.stop(stop);
  modulator.stop(stop);
}
