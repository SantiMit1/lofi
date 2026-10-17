import { getContext } from "../audio/engine.js";
import { playKeys } from "../audio/instruments/keys.js";
import { playBass } from "../audio/instruments/bass.js";
import { playKick, playSnare, playHat, playOpenHat } from "../audio/instruments/drums.js";
import { createComposer } from "../compose/composer.js";

let tempo = 90;
let nextNoteTime = 0;
let current16th = 0;
let timerID = null;
let isRunning = false;

let composer = createComposer(1);

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

const DRUM_VOICES = {
  kick: playKick,
  snare: playSnare,
  hat: playHat,
  openHat: playOpenHat,
};

function advance() {
  nextNoteTime += 0.25 * (60 / tempo);
  current16th = (current16th + 1) % 16;
}

function playEvent(event, time) {
  const beat = 60 / tempo;

  if (event.instrument === "keys") {
    playKeys(event.midi, time, event.length * beat, event.vel);
  } else if (event.instrument === "bass") {
    playBass(event.midi, time, event.length * beat, event.vel);
  } else if (event.instrument === "drum") {
    DRUM_VOICES[event.voice](time, event.vel);
  }
}

function scheduleBar(barStart) {
  const beat = 60 / tempo;
  const { events } = composer.nextBar();

  for (const event of events) {
    playEvent(event, barStart + event.at * beat);
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
  nextNoteTime = getContext().currentTime + 0.05;
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

export function setSeed(seed) {
  composer = createComposer(seed);
}

export function isPlaying() {
  return isRunning;
}
