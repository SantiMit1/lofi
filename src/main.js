import { unlock, setVolume } from "./audio/engine.js";
import { start, stop, restart, setTempo, setSeed, setSwing, setOnSongEnd, isPlaying, getInstruments } from "./core/scheduler.js";
import { init as initVisualizer, start as startVisualizer, stop as stopVisualizer, refreshTheme } from "./visualizer.js";

const toggleButton = document.querySelector("#toggleButton");
const tempoInput = document.querySelector("#tempo");
const volumeInput = document.querySelector("#volume");
const swingInput = document.querySelector("#swing");
const seedInput = document.querySelector("#seed");
const randomSeedButton = document.querySelector("#randomSeed");
const themeToggle = document.querySelector("#themeToggle");
const focusToggle = document.querySelector("#focusToggle");
const focusHud = document.querySelector("#focusHud");
const nowPlaying = document.querySelector("#nowPlaying");
const historyList = document.querySelector("#historyList");
const instrumentsList = document.querySelector("#instruments");

// Nombre visible de cada instrumento interno.
const INSTRUMENT_LABELS = {
  drums: "Batería",
  bass: "Bajo",
  keys: "Teclas",
  lead: "Melodía",
  arp: "Arpegio",
  pad: "Pad",
  perc: "Percusión",
  guitar: "Guitarra",
  keys2: "Rhodes",
};

const HISTORY_MAX = 5;
const HISTORY_KEY = "lofi-history";
const VOLUME_KEY = "lofi-volume";
const DEFAULT_SWING = 0.2;

let history = loadHistory();

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (!Array.isArray(saved)) return [];

    return saved
      .filter((entry) => entry && typeof entry.seed === "string" && Number.isFinite(entry.tempo))
      .slice(0, HISTORY_MAX)
      .map((entry) => ({
        seed: entry.seed,
        tempo: entry.tempo,
        swing: Number.isFinite(entry.swing) ? entry.swing : DEFAULT_SWING,
      }));
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function randomSeed() {
  return String(Math.floor(Math.random() * 1000000));
}

function randomTempo() {
  return 70 + Math.floor(Math.random() * 26);
}

function currentSeed() {
  return seedInput.value.trim();
}

function currentTempo() {
  return Number(tempoInput.value);
}

function currentSwing() {
  return Number(swingInput.value);
}

function songUrl(seed, tempo, swing) {
  const params = new URLSearchParams({ seed, tempo, swing });
  return `${location.origin}${location.pathname}?${params}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.append(area);
    area.select();

    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

function copySongLink(button, seed, tempo, swing) {
  copyText(songUrl(seed, tempo, swing)).then((copied) => {
    if (!copied) return;

    button.textContent = "✓";
    button.classList.add("is-copied");
    setTimeout(() => {
      button.textContent = "🔗";
      button.classList.remove("is-copied");
    }, 1200);
  });
}

function renderHistory() {
  historyList.replaceChildren();

  history.forEach((entry) => {
    const item = document.createElement("li");
    const playButton = document.createElement("button");
    const copyButton = document.createElement("button");

    item.className = "history__item";
    if (entry.seed === currentSeed() && entry.tempo === currentTempo()) item.classList.add("is-current");

    playButton.type = "button";
    playButton.className = "history__play";
    playButton.textContent = `${entry.seed} · ${entry.tempo} bpm`;
    playButton.addEventListener("click", () => play(entry.seed, entry.tempo, entry.swing));

    copyButton.type = "button";
    copyButton.className = "history__copy";
    copyButton.textContent = "🔗";
    copyButton.title = "Copiar link de este tema";
    copyButton.setAttribute("aria-label", "Copiar link de este tema");
    copyButton.addEventListener("click", () => copySongLink(copyButton, entry.seed, entry.tempo, entry.swing));

    item.append(playButton, copyButton);
    historyList.append(item);
  });

  updateNowPlaying();
}

function setPlayingUI(playing) {
  toggleButton.textContent = playing ? "Stop" : "Start";
  toggleButton.classList.toggle("is-playing", playing);
  if (playing) startVisualizer();
  else stopVisualizer();
  renderHistory();
  renderInstruments();
  updateNowPlaying();
}

function updateNowPlaying() {
  const seed = currentSeed() || "—";
  nowPlaying.textContent = `now playing: ${seed} - ${currentTempo()}bpm`;
}

function setFocusMode(on) {
  document.body.classList.toggle("is-focus", on);
  focusHud.hidden = !on;
  if (on) updateNowPlaying();
}

function renderInstruments() {
  instrumentsList.replaceChildren(
    ...getInstruments().map((name) => {
      const item = document.createElement("li");
      item.className = "lineup__item";
      item.textContent = INSTRUMENT_LABELS[name] ?? name;
      return item;
    })
  );
}

function record(seed, tempo, swing) {
  const index = history.findIndex((entry) => entry.seed === seed && entry.tempo === tempo);
  if (index !== -1) history.splice(index, 1);

  history.unshift({ seed, tempo, swing });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  saveHistory();
}

function play(seed, tempo, swing) {
  seedInput.value = seed;
  tempoInput.value = tempo;
  swingInput.value = swing;
  setSeed(seed);
  setTempo(tempo);
  setSwing(Number(swingInput.value));

  if (isPlaying()) {
    restart();
  } else {
    start();
  }

  setPlayingUI(true);
}

function applySeed(value) {
  const seed = value.trim();
  if (!seed) return;

  setSeed(seed);
  restart();
  renderInstruments();
  updateNowPlaying();
}

toggleButton.addEventListener("click", async () => {
  await unlock();

  if (isPlaying()) {
    stop();
    setPlayingUI(false);
  } else {
    play(currentSeed(), currentTempo(), currentSwing());
  }
});

tempoInput.addEventListener("change", () => {
  const bpm = Number(tempoInput.value);

  if (bpm > 0 && bpm <= 200) {
    setTempo(bpm);
  } else {
    tempoInput.value = 90;
    setTempo(90);
  }

  restart();
  updateNowPlaying();
});

volumeInput.addEventListener("input", () => {
  setVolume(Number(volumeInput.value));
  localStorage.setItem(VOLUME_KEY, volumeInput.value);
});

swingInput.addEventListener("input", () => {
  setSwing(Number(swingInput.value));
});

seedInput.addEventListener("change", () => applySeed(seedInput.value));

randomSeedButton.addEventListener("click", () => {
  const seed = randomSeed();
  seedInput.value = seed;
  applySeed(seed);
});

setOnSongEnd(() => {
  record(currentSeed(), currentTempo(), currentSwing());
  play(randomSeed(), randomTempo(), currentSwing());
});

const params = new URLSearchParams(location.search);
const seedParam = params.get("seed");
const tempoParam = Number(params.get("tempo"));
const swingRaw = params.get("swing");
const swingParam = Number(swingRaw);
const savedVolume = localStorage.getItem(VOLUME_KEY);

seedInput.value = seedParam?.trim() || randomSeed();
if (tempoParam > 0 && tempoParam <= 200) tempoInput.value = tempoParam;
if (swingRaw && swingParam >= 0 && swingParam <= 1) swingInput.value = swingParam;
if (savedVolume && Number(savedVolume) >= 0 && Number(savedVolume) <= 1) volumeInput.value = savedVolume;

applySeed(seedInput.value);
setTempo(Number(tempoInput.value));
setSwing(Number(swingInput.value));
setVolume(Number(volumeInput.value));
renderHistory();

// El visualizador de fondo queda listo (y en reposo) apenas carga la pagina.
initVisualizer();


//TEMA
const THEME_KEY = "lofi-theme";

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }

  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
  refreshTheme();
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark";
  applyTheme(isDark ? "light" : "dark");
});

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");


// MODO VISUALIZADOR
focusToggle.addEventListener("click", () => setFocusMode(true));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setFocusMode(false);
});
