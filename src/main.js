import { unlock, setVolume } from "./audio/engine.js";
import { start, stop, setTempo, isPlaying } from "./core/scheduler.js";

const toggleButton = document.querySelector("#toggleButton");
const tempoInput = document.querySelector("#tempo");
const volumeInput = document.querySelector("#volume");

toggleButton.addEventListener("click", async () => {
  await unlock();

  if (isPlaying()) {
    stop();
    toggleButton.textContent = "Start";
  } else {
    start();
    toggleButton.textContent = "Stop";
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
