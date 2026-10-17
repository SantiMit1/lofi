// Tablas de transición hardcodeadas. Los pesos están afinados a oído para
// que suenen a progresiones lo-fi / jazz
//
// Estado = numeral romano en modo mayor. Cada fila lista [siguiente, peso].
// TODO: subir a orden 2 (estado = par de grados) en un milestone posterior.
export const CHORD_TRANSITIONS = {
  I: [["vi", 3], ["IV", 3], ["ii", 2], ["V", 2], ["iii", 1]],
  ii: [["V", 5], ["vii", 1], ["IV", 1]],
  iii: [["vi", 3], ["IV", 2], ["ii", 1]],
  IV: [["V", 3], ["I", 3], ["ii", 2], ["vi", 1]],
  V: [["I", 4], ["vi", 3], ["ii", 1], ["IV", 1]],
  vi: [["ii", 3], ["IV", 3], ["V", 2], ["I", 1]],
  vii: [["I", 4], ["iii", 2], ["vi", 1]],
};

// Estado = nombre de patrón de batería (ver compose/patterns.js).
export const DRUM_TRANSITIONS = {
  boomBap: [["boomBap", 3], ["halfTime", 2], ["sparse", 1]],
  halfTime: [["halfTime", 2], ["boomBap", 3], ["sparse", 1]],
  sparse: [["boomBap", 3], ["halfTime", 2], ["sparse", 1]],
};

// Estado = grado de la escala (1..7). Los pesos favorecen movimiento por
// grados contiguos y evitan saltos grandes (más cantable).
export const MELODY_TRANSITIONS = {
  1: [[1, 1], [2, 3], [3, 3], [4, 1], [5, 2], [6, 1], [7, 1]],
  2: [[1, 3], [2, 1], [3, 3], [4, 2], [5, 1], [7, 1]],
  3: [[1, 2], [2, 3], [3, 1], [4, 3], [5, 2], [6, 1]],
  4: [[1, 1], [2, 2], [3, 2], [4, 1], [5, 3], [6, 2]],
  5: [[1, 2], [3, 2], [4, 3], [5, 1], [6, 3], [7, 1]],
  6: [[1, 2], [2, 1], [4, 2], [5, 3], [6, 1], [7, 2]],
  7: [[1, 4], [2, 1], [5, 1], [6, 1]],
};

// Estado = duración en beats. Mezcla corcheas, negras y figuras largas.
export const RHYTHM_TRANSITIONS = {
  "0.5": [["0.5", 2], ["1", 3], ["1.5", 1], ["2", 1]],
  "1": [["0.5", 2], ["1", 2], ["1.5", 2], ["2", 1]],
  "1.5": [["0.5", 2], ["1", 3], ["1.5", 1], ["2", 1]],
  "2": [["0.5", 2], ["1", 2], ["1.5", 1], ["2", 1]],
};
