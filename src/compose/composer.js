import { MarkovChain } from "../markov/MarkovChain.js";
import { CHORD_TRANSITIONS, DRUM_TRANSITIONS } from "../markov/tables.js";
import { DRUM_PATTERNS } from "./patterns.js";
import { createMelody } from "./melody.js";
import { chordNotes, voiceOpen } from "../theory/scales.js";
import { createRng } from "../core/rng.js";

const KEY_ROOT = 60; // C4

// Humanizacion: jitter de timing (en beats) y de velocity por instrumento.
// Los drums quedan rectos en el tiempo y solo se les mueve la velocity.
const HUMANIZE = {
  keys: { time: 0.008, vel: 0.1 },
  lead: { time: 0.018, vel: 0.12 },
  bass: { time: 0.01, vel: 0.08 },
  drum: { time: 0, vel: 0.08 },
};

const STRUM_STEP = 0.02;

function humanize(events, rng) {
  for (const event of events) {
    const cfg = HUMANIZE[event.instrument];
    if (!cfg) continue;

    if (cfg.time > 0) {
      event.at = Math.max(0, event.at + (rng.next() * 2 - 1) * cfg.time);
    }

    const vel = event.vel * (1 + (rng.next() * 2 - 1) * cfg.vel);
    event.vel = Math.min(1, Math.max(0.05, vel));
  }
}

export function createComposer(seed = 1) {
  const rng = createRng(seed);
  const chords = new MarkovChain(CHORD_TRANSITIONS);
  const drumPatterns = new MarkovChain(DRUM_TRANSITIONS);
  const melody = createMelody();
  let currentChord = "I";
  let currentPattern = "boomBap";

  // Decide un compás completo. Devuelve eventos con offsets en beats.
  function nextBar() {
    currentChord = chords.sample(currentChord, rng);
    currentPattern = drumPatterns.sample(currentPattern, rng);

    const triad = chordNotes(currentChord, KEY_ROOT);
    const root = triad[0];
    const events = [];

    // comping de teclas: acorde largo en beat 1, stab en beat 3
    voiceOpen(triad).forEach((midi, i) => {
      const roll = i * STRUM_STEP;
      events.push({ instrument: "keys", midi, at: roll, length: 1.9, vel: 0.45 });
      events.push({ instrument: "keys", midi, at: 2 + roll, length: 1.6, vel: 0.3 });
    });

    // bajo: raíz en beat 1, raíz o quinta en beat 3 (dos octavas abajo)
    const bassSecond = rng.next() < 0.5 ? root : root + 7;
    events.push({ instrument: "bass", midi: root - 24, at: 0, length: 1.8, vel: 0.6 });
    events.push({ instrument: "bass", midi: bassSecond - 24, at: 2, length: 1.6, vel: 0.5 });

    for (const [voice, steps] of Object.entries(DRUM_PATTERNS[currentPattern])) {
      steps.forEach((vel, step) => {
        if (vel > 0) events.push({ instrument: "drum", voice, at: step / 4, vel });
      });
    }

    events.push(...melody.phrase(currentChord, rng));
    humanize(events, rng);

    return { degree: currentChord, pattern: currentPattern, events };
  }

  return { nextBar };
}
