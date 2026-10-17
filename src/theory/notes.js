// Convierte una nota MIDI a frecuencia en Hz (A4 = MIDI 69 = 440 Hz).
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
