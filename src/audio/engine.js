import { makeSaturationCurve } from "./effects/saturation.js";
import { createWowFlutter } from "./effects/wowFlutter.js";
import { createTapeNoise } from "./effects/tapeNoise.js";

let ctx = null;
let master = null;
let masterGain = null;
let ambienceGain = null;

export function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  return ctx;
}

// Cadena del bus master:
// sum -> wow/flutter -> lowpass -> saturacion -> compresor -> gain -> destino
function buildMaster() {
  const c = getContext();

  master = c.createGain();

  const wow = createWowFlutter(c);

  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 7500;
  tone.Q.value = 0.4;

  const sat = c.createWaveShaper();
  sat.curve = makeSaturationCurve(1.6);
  sat.oversample = "2x";

  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 30;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;

  masterGain = c.createGain();
  masterGain.gain.value = 0.8;

  master.connect(wow.input);
  wow.output.connect(tone);
  tone.connect(sat);
  sat.connect(comp);
  comp.connect(masterGain);
  masterGain.connect(c.destination);

  const noise = createTapeNoise(c);
  ambienceGain = c.createGain();
  ambienceGain.gain.value = 0;
  noise.output.connect(ambienceGain);
  ambienceGain.connect(master);

  return master;
}

export function getMaster() {
  if (!master) buildMaster();

  return master;
}

export function setVolume(value) {
  if (!masterGain) getMaster();

  masterGain.gain.setTargetAtTime(value, getContext().currentTime, 0.01);
}

export function setAmbience(active) {
  if (!ambienceGain) return;

  const target = active ? 1 : 0;
  ambienceGain.gain.setTargetAtTime(target, getContext().currentTime, 0.1);
}

export async function unlock() {
  const c = getContext();
  if (c.state === "suspended") {
    await c.resume();
  }
}
