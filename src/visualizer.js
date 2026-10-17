import { getAnalyser } from "./audio/engine.js";

const BARS = 56;
const BAND_MIN_HZ = 40;
const BAR_MAX = 0.62; // fraccion de la altura que pueden ocupar las barras
const WAVE_AMP = 0.22; // fraccion de la altura de la onda
const SMOOTHING = 0.28; // cuanto persiguen las barras al dato nuevo
const DPR_CAP = 2;
const FADE_MS = 300;

let canvas = null;
let g = null;
let analyser = null;
let freqData = null;
let timeData = null;
let levels = null;
let bandStart = null;
let gradient = null;
let rafID = null;
let running = false;
let width = 0;
let height = 0;
let accent = "#b4794a";
let ink = "#1b1a18";
let reducedMotion = false;

function readColors() {
  const styles = getComputedStyle(document.documentElement);
  accent = styles.getPropertyValue("--accent").trim() || accent;
  ink = styles.getPropertyValue("--ink").trim() || ink;
}

function resize() {
  if (!canvas) return;

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  gradient = g.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, accent + "00");
  gradient.addColorStop(1, accent + "cc");
}

// Reparto logaritmico de los bins entre bandas: el lo-fi vive casi todo por
// debajo de los 8 kHz, un reparto lineal dejaria media pantalla muerta.
function buildBands() {
  const nyquist = analyser.context.sampleRate / 2;
  const binCount = analyser.frequencyBinCount;
  const hzPerBin = nyquist / binCount;

  bandStart = new Int32Array(BARS + 1);

  for (let i = 0; i <= BARS; i++) {
    const t = i / BARS;
    const hz = BAND_MIN_HZ * Math.pow(nyquist / BAND_MIN_HZ, t);
    bandStart[i] = Math.min(binCount - 1, Math.max(0, Math.round(hz / hzPerBin)));
  }

  levels = new Float32Array(BARS);
}

function drawBars() {
  const barWidth = width / BARS;
  const gap = Math.max(1, barWidth * 0.25);

  g.fillStyle = gradient;

  for (let i = 0; i < BARS; i++) {
    const from = bandStart[i];
    const to = Math.max(from + 1, bandStart[i + 1]);

    let sum = 0;
    for (let b = from; b < to; b++) sum += freqData[b];

    const target = sum / (to - from) / 255;
    levels[i] += (target - levels[i]) * SMOOTHING;

    const barHeight = levels[i] * height * BAR_MAX;
    if (barHeight < 0.5) continue;

    const x = i * barWidth + gap / 2;
    g.fillRect(x, height - barHeight, barWidth - gap, barHeight);
  }
}

function drawWave() {
  g.beginPath();

  for (let i = 0; i < timeData.length; i += 2) {
    const x = (i / (timeData.length - 1)) * width;
    const y = height / 2 + ((timeData[i] - 128) / 128) * height * WAVE_AMP;

    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }

  g.strokeStyle = ink + "55";
  g.lineWidth = 1.5;
  g.stroke();
}

function draw() {
  g.clearRect(0, 0, width, height);

  analyser.getByteFrequencyData(freqData);
  analyser.getByteTimeDomainData(timeData);

  drawBars();
  drawWave();
}

function loop() {
  draw();
  rafID = requestAnimationFrame(loop);
}

export function init() {
  canvas = document.querySelector("#viz");
  if (!canvas) return;

  g = canvas.getContext("2d");
  analyser = getAnalyser();
  freqData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);
  reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  buildBands();
  readColors();
  resize();

  window.addEventListener("resize", resize);
}

export function refreshTheme() {
  if (!canvas) return;

  readColors();
  resize();
}

export function start() {
  if (!canvas || running) return;

  running = true;
  readColors();
  canvas.classList.add("is-visible");

  // Con "reduced motion" dibujamos un solo cuadro, sin animar.
  if (reducedMotion) draw();
  else loop();
}

export function stop() {
  if (!canvas) return;

  running = false;
  canvas.classList.remove("is-visible");

  if (rafID !== null) {
    cancelAnimationFrame(rafID);
    rafID = null;
  }

  setTimeout(() => {
    if (!running) g.clearRect(0, 0, width, height);
  }, FADE_MS);
}
