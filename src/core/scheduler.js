import { getContext, setAmbience } from "../audio/engine.js";
import { playKeys } from "../audio/instruments/keys.js";
import { playBass } from "../audio/instruments/bass.js";
import { playKick, playSnare, playHat, playOpenHat } from "../audio/instruments/drums.js";
import { initMixer } from "../audio/mixer.js";
import { createComposer } from "../compose/composer.js";

let tempo = 90;
let nextNoteTime = 0;
let current16th = 0;
let timerID = null;
let isRunning = false;

let composer = createComposer(1);

// Eventos del compás ya generado, esperando entrar en la ventana de lookahead.
let barQueue = [];
let queueIndex = 0;

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

// Genera el compás completo en la frontera, pero solo lo deja en la cola.
function generateBar(barStart) {
  const beat = 60 / tempo;
  const { events } = composer.nextBar();

  barQueue = events
    .map((event) => ({ ...event, time: barStart + event.at * beat }))
    .sort((a, b) => a.time - b.time);
  queueIndex = 0;
}

// Manda al audio solo lo que cae dentro de la ventana (<= SCHEDULE_AHEAD).
function flushQueue(until) {
  while (queueIndex < barQueue.length && barQueue[queueIndex].time < until) {
    const event = barQueue[queueIndex++];
    playEvent(event, event.time);
  }
}

function scheduler() {
  const ctx = getContext();
  const until = ctx.currentTime + SCHEDULE_AHEAD;

  while (nextNoteTime < until) {
    flushQueue(until);

    if (current16th === 0) {
      generateBar(nextNoteTime);
      flushQueue(until);
    }

    advance();
  }
}

export function start() {
  if (isRunning) return;

  initMixer();
  setAmbience(true);
  isRunning = true;
  current16th = 0;
  barQueue = [];
  queueIndex = 0;
  nextNoteTime = getContext().currentTime + 0.05;
  timerID = setInterval(scheduler, LOOKAHEAD_MS);
}

export function stop() {
  clearInterval(timerID);
  timerID = null;
  isRunning = false;
  barQueue = [];
  queueIndex = 0;
  setAmbience(false);
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
