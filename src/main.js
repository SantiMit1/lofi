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

function songUrl(seed, tempo) {
  const params = new URLSearchParams({ seed, tempo });
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

function copySongLink(button, seed, tempo) {
  copyText(songUrl(seed, tempo)).then((copied) => {
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
    playButton.addEventListener("click", () => play(entry.seed, entry.tempo));

    copyButton.type = "button";
    copyButton.className = "history__copy";
    copyButton.textContent = "🔗";
    copyButton.title = "Copiar link de este tema";
    copyButton.setAttribute("aria-label", "Copiar link de este tema");
    copyButton.addEventListener("click", () => copySongLink(copyButton, entry.seed, entry.tempo));

    item.append(playButton, copyButton);
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

const params = new URLSearchParams(location.search);
const seedParam = params.get("seed");
const tempoParam = Number(params.get("tempo"));

seedInput.value = seedParam?.trim() || randomSeed();
if (tempoParam > 0 && tempoParam <= 200) tempoInput.value = tempoParam;

applySeed(seedInput.value);
setTempo(Number(tempoInput.value));
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
