import { unlock, setVolume } from "./audio/engine.js";
import { start, stop, setTempo, setSeed, isPlaying } from "./core/scheduler.js";

const toggleButton = document.querySelector("#toggleButton");
const tempoInput = document.querySelector("#tempo");
const volumeInput = document.querySelector("#volume");
const seedInput = document.querySelector("#seed");
const randomSeedButton = document.querySelector("#randomSeed");

function randomSeed() {
  return String(Math.floor(Math.random() * 1000000));
}

function applySeed(value) {
  const seed = value.trim();
  if (seed) setSeed(seed);
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
});

volumeInput.addEventListener("input", () => {
  setVolume(Number(volumeInput.value));
});

seedInput.addEventListener("change", () => applySeed(seedInput.value));

randomSeedButton.addEventListener("click", () => {
  seedInput.value = randomSeed();
  applySeed(seedInput.value);
});

seedInput.value = randomSeed();
applySeed(seedInput.value);
