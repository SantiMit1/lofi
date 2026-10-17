import { MarkovChain } from "../markov/MarkovChain.js";
import { CHORD_TRANSITIONS } from "../markov/tables.js";
import { chordNotes, voiceOpen } from "../theory/scales.js";
import { createRng } from "../core/rng.js";

const KEY_ROOT = 60; // C4

export function createComposer(seed = 1) {
  const rng = createRng(seed);
  const chords = new MarkovChain(CHORD_TRANSITIONS);
  let current = "I";

  function nextChord() {
    current = chords.sample(current, rng);
    return { degree: current, notes: voiceOpen(chordNotes(current, KEY_ROOT)) };
  }

  return { nextChord };
}
