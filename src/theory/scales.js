// Escala mayor en semitonos desde la tónica.
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

// Grado de la escala (0..6) que corresponde a cada numeral romano.
export const ROMAN_TO_DEGREE = {
  I: 0,
  ii: 1,
  iii: 2,
  IV: 3,
  V: 4,
  vi: 5,
  vii: 6,
};

// Semitono de un índice de escala arbitrario, saltando de octava cuando
// el índice se pasa de 7 (p. ej. el índice 8 = grado 1 una octava arriba).
export function scaleSemitone(scaleIndex) {
  const len = MAJOR_SCALE.length;
  const octave = Math.floor(scaleIndex / len);
  const i = ((scaleIndex % len) + len) % len;
  return MAJOR_SCALE[i] + 12 * octave;
}

// Tríada (3 notas MIDI) construida sobre el numeral romano, relativa a rootMidi.
export function chordNotes(roman, rootMidi) {
  const degree = ROMAN_TO_DEGREE[roman];
  return [degree, degree + 2, degree + 4].map((i) => rootMidi + scaleSemitone(i));
}

// Voicing abierto: baja la nota del medio una octava. Da un color más
// jazzy/lo-fi que la tríada cerrada y deja respirar el registro medio.
export function voiceOpen(notes) {
  const [root, middle, top] = notes;
  return [root, middle - 12, top];
}
