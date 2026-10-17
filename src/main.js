import { unlock, setVolume } from "./audio/engine.js";
import { start, stop, restart, setTempo, setSeed, setSwing, setOnSongEnd, isPlaying } from "./core/scheduler.js";

const toggleButton = document.querySelector("#toggleButton");
const tempoInput = document.querySelector("#tempo");
const volumeInput = document.querySelector("#volume");
const swingInput = document.querySelector("#swing");
const seedInput = document.querySelector("#seed");
const randomSeedButton = document.querySelector("#randomSeed");
const themeToggle = document.querySelector("#themeToggle");
const historyList = document.querySelector("#historyList");

const HISTORY_MAX = 5;
const HISTORY_KEY = "lofi-history";

let history = loadHistory();

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved.slice(0, HISTORY_MAX) : [];
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

function renderHistory() {
  historyList.replaceChildren();

  history.forEach((entry) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = "history__item";
    if (entry.seed === currentSeed() && entry.tempo === currentTempo()) button.classList.add("is-current");
    button.textContent = `${entry.seed} · ${entry.tempo} bpm`;
    button.addEventListener("click", () => play(entry.seed, entry.tempo));

    item.append(button);
    historyList.append(item);
  });
}

function setPlayingUI(playing) {
  toggleButton.textContent = playing ? "Stop" : "Start";
  toggleButton.classList.toggle("is-playing", playing);
  renderHistory();
}

function record(seed, tempo) {
  const index = history.findIndex((entry) => entry.seed === seed && entry.tempo === tempo);
  if (index !== -1) history.splice(index, 1);

  history.unshift({ seed, tempo });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  saveHistory();
}

function play(seed, tempo) {
  seedInput.value = seed;
  tempoInput.value = tempo;
  setSeed(seed);
  setTempo(tempo);

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
}

toggleButton.addEventListener("click", async () => {
  await unlock();

  if (isPlaying()) {
    stop();
    setPlayingUI(false);
  } else {
    play(currentSeed(), currentTempo());
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
});

volumeInput.addEventListener("input", () => {
  setVolume(Number(volumeInput.value));
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
  record(currentSeed(), currentTempo());
  play(randomSeed(), randomTempo());
});

seedInput.value = randomSeed();
applySeed(seedInput.value);
renderHistory();


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
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark";
  applyTheme(isDark ? "light" : "dark");
});

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
