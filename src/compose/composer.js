import { MarkovChain } from "../markov/MarkovChain.js";
import { CHORD_TRANSITIONS, DRUM_TRANSITIONS } from "../markov/tables.js";
import { DRUM_PATTERNS } from "./patterns.js";
import { createMelody } from "./melody.js";
import { chordNotes, voiceOpen } from "../theory/scales.js";
import { createRng } from "../core/rng.js";

const KEY_ROOT = 60; // C4

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
    for (const midi of voiceOpen(triad)) {
      events.push({ instrument: "keys", midi, at: 0, length: 1.9, vel: 0.45 });
      events.push({ instrument: "keys", midi, at: 2, length: 1.6, vel: 0.3 });
    }

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

    return { degree: currentChord, pattern: currentPattern, events };
  }

  return { nextBar };
}
