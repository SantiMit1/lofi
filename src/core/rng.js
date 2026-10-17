// PRNG determinista (mulberry32). Toda aleatoriedad del proyecto pasa por acá,
// así una misma semilla produce siempre la misma canción.
export function createRng(seed) {
  let a = seed >>> 0;

  return {
    // Devuelve un float en [0, 1).
    next() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
