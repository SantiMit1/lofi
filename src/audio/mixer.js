import { getContext, getMaster } from "./engine.js";
import { createReverb } from "./effects/reverb.js";

// Nivel, paneo y envío a reverb por pista.
const CONFIG = {
  keys: { level: 0.9, pan: -0.15, reverb: 0.35 },
  lead: { level: 0.7, pan: 0.2, reverb: 0.5 },
  arp: { level: 0.5, pan: 0.25, reverb: 0.5 },
  pad: { level: 0.35, pan: 0.1, reverb: 0.6 },
  perc: { level: 0.4, pan: 0.3, reverb: 0.2 },
  guitar: { level: 0.45, pan: -0.2, reverb: 0.45 },
  keys2: { level: 0.4, pan: -0.25, reverb: 0.5 },
  bass: { level: 1.0, pan: 0.0, reverb: 0.05 },
  drums: { level: 0.9, pan: 0.0, reverb: 0.15 },
};

const tracks = {};
let reverb = null;
let initialized = false;

export function initMixer() {
  if (initialized) return;

  const ctx = getContext();

  reverb = createReverb(ctx);
  reverb.output.connect(getMaster());

  for (const name of Object.keys(CONFIG)) {
    const cfg = CONFIG[name];

    const input = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const level = ctx.createGain();
    const send = ctx.createGain();

    pan.pan.value = cfg.pan;
    level.gain.value = cfg.level;
    send.gain.value = cfg.reverb;

    input.connect(pan);
    pan.connect(level);
    level.connect(getMaster());
    level.connect(send);
    send.connect(reverb.input);

    tracks[name] = input;
  }

  initialized = true;
}

export function getTrack(name) {
  if (!initialized) initMixer();

  return { input: tracks[name] };
}
