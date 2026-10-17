import { getContext } from "../audio/engine.js";
import { playKeys } from "../audio/instruments/keys.js";
import { createComposer } from "../compose/composer.js";

let tempo = 90;
let nextNoteTime = 0;
let current16th = 0;
let timerID = null;
let isRunning = false;

let composer = createComposer(1);

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

function advance() {
  nextNoteTime += 0.25 * (60 / tempo);
  current16th = (current16th + 1) % 16;
}

function scheduleBar(barStart) {
  const beat = 60 / tempo;
  const { notes } = composer.nextChord();

  for (const midi of notes) {
    playKeys(midi, barStart, beat * 2 * 0.95, 0.45);
    playKeys(midi, barStart + beat * 2, beat * 1.6, 0.3);
  }
}

function scheduler() {
  const ctx = getContext();

  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    if (current16th === 0) scheduleBar(nextNoteTime);
    advance();
  }
}

export function start() {
  if (isRunning) return;

  isRunning = true;
  current16th = 0;
  nextNoteTime = getContext().currentTime + 0.05; // arranca un pelín a futuro
  timerID = setInterval(scheduler, LOOKAHEAD_MS);
}

export function stop() {
  clearInterval(timerID);
  timerID = null;
  isRunning = false;
}

export function setTempo(bpm) {
  tempo = bpm;
}

export function regenerate(seed) {
  composer = createComposer(seed);
}

export function isPlaying() {
  return isRunning;
}
