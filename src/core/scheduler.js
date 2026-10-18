import { getContext, setAmbience } from "../audio/engine.js";
import { playKeys } from "../audio/instruments/keys.js";
import { playPad } from "../audio/instruments/pad.js";
import { playBass } from "../audio/instruments/bass.js";
import { playKick, playSnare, playHat, playOpenHat } from "../audio/instruments/drums.js";
import { playShaker, playTambourine, playRimshot } from "../audio/instruments/perc.js";
import { playGuitar } from "../audio/instruments/guitar.js";
import { initMixer } from "../audio/mixer.js";
import { createComposer } from "../compose/composer.js";

let tempo = 90;
let swing = 0.2;
let seed = 1;
let nextNoteTime = 0;
let current16th = 0;
let timerID = null;
let isRunning = false;
let songEndAt = null;
let onSongEnd = null;

let composer = createComposer(seed);

// Eventos del compás ya generado, esperando entrar en la ventana de lookahead.
let barQueue = [];
let queueIndex = 0;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;
const SONG_GAP = 2;

const DRUM_VOICES = {
  kick: playKick,
  snare: playSnare,
  hat: playHat,
  openHat: playOpenHat,
};

const PERC_VOICES = {
  shaker: playShaker,
  tambourine: playTambourine,
  rimshot: playRimshot,
};

function advance() {
  nextNoteTime += 0.25 * (60 / tempo);
  current16th = (current16th + 1) % 16;
}

// Retrasa las semicorcheas impares. La grilla del reloj queda recta: el swing
// solo mueve notas dentro del compás, nunca el inicio del compás.
function swingDelay(atBeats, beat) {
  const step = Math.round(atBeats * 4);
  return step % 2 === 1 ? swing * 0.125 * beat : 0;
}

function playEvent(event, time) {
  const beat = 60 / tempo;

  if (event.instrument === "keys") {
    playKeys(event.midi, time, event.length * beat, event.vel, "keys");
  } else if (event.instrument === "lead") {
    playKeys(event.midi, time, event.length * beat, event.vel, "lead");
  } else if (event.instrument === "arp") {
    playKeys(event.midi, time, event.length * beat, event.vel, "arp");
  } else if (event.instrument === "pad") {
    playPad(event.midi, time, event.length * beat, event.vel);
  } else if (event.instrument === "bass") {
    playBass(event.midi, time, event.length * beat, event.vel);
  } else if (event.instrument === "guitar") {
    playGuitar(event.midi, time, event.length * beat, event.vel);
  } else if (event.instrument === "perc") {
    PERC_VOICES[event.voice](time, event.vel);
  } else if (event.instrument === "drum") {
    DRUM_VOICES[event.voice](time, event.vel);
  }
}

// Genera el compás completo en la frontera, pero solo lo deja en la cola.
function generateBar(barStart) {
  const beat = 60 / tempo;
  const bar = composer.nextBar();

  barQueue = bar.events
    .map((event) => ({ ...event, time: barStart + event.at * beat + swingDelay(event.at, beat) }))
    .sort((a, b) => a.time - b.time);
  queueIndex = 0;

  // El compás final marca cuando termina la canción (arranque del siguiente).
  if (bar.last) songEndAt = barStart + 4 * beat;
}

// Manda al audio solo lo que cae dentro de la ventana (<= SCHEDULE_AHEAD).
function flushQueue(until) {
  while (queueIndex < barQueue.length && barQueue[queueIndex].time < until) {
    const event = barQueue[queueIndex++];
    playEvent(event, event.time);
  }
}

function scheduler() {
  const now = getContext().currentTime;

  // Canción terminada: esperar a que se despache el último compás y, tras la
  // pausa, avisar. El vinilo sigue sonando (no se toca la ambience).
  if (songEndAt !== null && now >= songEndAt - SCHEDULE_AHEAD) {
    if (now >= songEndAt + SONG_GAP) {
      const callback = onSongEnd;
      halt();
      if (callback) callback();
    }
    return;
  }

  const until = now + SCHEDULE_AHEAD;

  while (nextNoteTime < until) {
    flushQueue(until);

    if (current16th === 0 && songEndAt === null) {
      generateBar(nextNoteTime);
      flushQueue(until);
    }

    advance();
  }
}

function resetQueue() {
  barQueue = [];
  queueIndex = 0;
  songEndAt = null;
}

function run() {
  current16th = 0;
  resetQueue();
  nextNoteTime = getContext().currentTime + 0.05;
  timerID = setInterval(scheduler, LOOKAHEAD_MS);
}

function halt() {
  clearInterval(timerID);
  timerID = null;
  isRunning = false;
  resetQueue();
}

export function start() {
  if (isRunning) return;

  initMixer();
  setAmbience(true);
  isRunning = true;
  run();
}

export function restart() {
  if (!isRunning) return;

  clearInterval(timerID);
  composer = createComposer(seed);
  run();
}

export function stop() {
  halt();
  setAmbience(false);
}

export function setTempo(bpm) {
  tempo = bpm;
}

export function setSwing(value) {
  swing = value;
}

export function setSeed(value) {
  seed = value;
  composer = createComposer(seed);
}

export function getInstruments() {
  return composer.instruments;
}

export function setOnSongEnd(callback) {
  onSongEnd = callback;
}

export function isPlaying() {
  return isRunning;
}
