// Tablas de transición hardcodeadas. Los pesos están afinados a oído para
// que suenen a progresiones lo-fi / jazz
//
// Estado = numeral romano en modo mayor. Cada fila lista [siguiente, peso].
export const CHORD_TRANSITIONS = {
  I: [["vi", 3], ["IV", 3], ["ii", 2], ["V", 2], ["iii", 1]],
  ii: [["V", 5], ["vii", 1], ["IV", 1]],
  iii: [["vi", 3], ["IV", 2], ["ii", 1]],
  IV: [["V", 3], ["I", 3], ["ii", 2], ["vi", 1]],
  V: [["I", 4], ["vi", 3], ["ii", 1], ["IV", 1]],
  vi: [["ii", 3], ["IV", 3], ["V", 2], ["I", 1]],
  vii: [["I", 4], ["iii", 2], ["vi", 1]],
};

// Cadena de acordes de orden 2: el estado es el par "anterior|actual".
// Mirar dos acordes atrás hace que suene a progresión y no a caminata
// aleatoria. Cubre todos los pares alcanzables; si faltara una fila, el
// sampler cae a CHORD_TRANSITIONS (orden 1) usando el último acorde.
export const CHORD_TRANSITIONS_2 = {
  "I|vi": [["ii", 4], ["IV", 3], ["V", 2]],
  "I|IV": [["V", 4], ["I", 3], ["ii", 2]],
  "I|ii": [["V", 5], ["IV", 2], ["vii", 1]],
  "I|V": [["I", 5], ["vi", 3], ["IV", 1]],
  "I|iii": [["vi", 4], ["IV", 3], ["ii", 2]],

  "ii|V": [["I", 6], ["vi", 2], ["IV", 1]],
  "ii|vii": [["I", 5], ["iii", 2], ["vi", 1]],
  "ii|IV": [["V", 4], ["I", 3], ["ii", 1]],

  "iii|vi": [["ii", 4], ["IV", 3], ["V", 2]],
  "iii|IV": [["V", 4], ["I", 3]],
  "iii|ii": [["V", 5], ["IV", 2]],

  "IV|V": [["I", 6], ["vi", 2], ["IV", 1]],
  "IV|I": [["IV", 3], ["vi", 3], ["ii", 2], ["V", 2], ["iii", 2]],
  "IV|ii": [["V", 4], ["IV", 2], ["vii", 1]],
  "IV|vi": [["ii", 4], ["V", 3], ["I", 2]],

  "V|I": [["vi", 4], ["IV", 3], ["ii", 2], ["iii", 1], ["V", 1]],
  "V|vi": [["IV", 4], ["ii", 3], ["V", 2]],
  "V|ii": [["V", 5], ["IV", 2]],
  "V|IV": [["V", 4], ["I", 3]],

  "vi|ii": [["V", 4], ["IV", 2], ["vii", 1]],
  "vi|IV": [["V", 4], ["I", 3], ["ii", 1]],
  "vi|V": [["I", 4], ["vi", 3], ["IV", 1]],
  "vi|I": [["IV", 4], ["vi", 2], ["ii", 2], ["iii", 1], ["V", 1]],

  "vii|I": [["IV", 4], ["vi", 2], ["ii", 2], ["iii", 1], ["V", 1]],
  "vii|iii": [["vi", 4], ["IV", 3], ["ii", 2]],
  "vii|vi": [["ii", 4], ["IV", 3], ["V", 2]],
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
