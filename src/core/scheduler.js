import { getContext } from "../audio/engine.js";
import { scheduleClick } from "../audio/instruments/click.js";

let tempo = 90;
let nextNoteTime = 0;
let current16th = 0;
let timerID = null;
let isRunning = false;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

// Avanza exactamente una 16th.
function advance() {
  nextNoteTime += 0.25 * (60 / tempo);
  current16th = (current16th + 1) % 16;
}

function scheduler() {
  const ctx = getContext();

  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    if (current16th % 4 === 0) {
      scheduleClick(nextNoteTime, current16th === 0);
    }
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

export function isPlaying() {
  return isRunning;
}
