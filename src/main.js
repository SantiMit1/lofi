import { unlock, setVolume } from "./audio/engine.js";
import { start, stop, restart, setTempo, setSeed, setSwing, isPlaying } from "./core/scheduler.js";

const toggleButton = document.querySelector("#toggleButton");
const tempoInput = document.querySelector("#tempo");
const volumeInput = document.querySelector("#volume");
const swingInput = document.querySelector("#swing");
const seedInput = document.querySelector("#seed");
const randomSeedButton = document.querySelector("#randomSeed");
const themeToggle = document.querySelector("#themeToggle");

function randomSeed() {
  return String(Math.floor(Math.random() * 1000000));
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
    toggleButton.textContent = "Start";
    toggleButton.classList.remove("is-playing");
  } else {
    start();
    toggleButton.textContent = "Stop";
    toggleButton.classList.add("is-playing");
  }
});

tempoInput.addEventListener("change", () => {
  const bpm = Number(tempoInput.value);

  if (bpm > 0 && bpm <= 200) {
    setTempo(bpm);
  } else {
    setTempo(90);
    tempoInput.value = 90;
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
  seedInput.value = randomSeed();
  applySeed(seedInput.value);
});

seedInput.value = randomSeed();
applySeed(seedInput.value);


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
