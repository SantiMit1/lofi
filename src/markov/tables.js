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
