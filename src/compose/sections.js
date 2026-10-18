// Forma de la cancion: bloques de compases con distinto caracter.
export const FORM = [
  { name: "intro", bars: 4 },
  { name: "A", bars: 8 },
  { name: "B", bars: 8 },
  { name: "A", bars: 8 },
  { name: "outro", bars: 4 },
];

// Reglas por seccion: voces de bateria que suenan, densidad de la melodia
// (divide el chance de silencio) y si entra el hi-hat abierto de pickup.
export const SECTION_RULES = {
  intro: { drums: [], density: 0.45, openHat: false, layers: [] },
  A: {
    drums: ["kick", "snare", "hat"],
    density: 1,
    openHat: false,
    layers: ["arp", "perc", "guitar", "keys2"],
  },
  B: {
    drums: ["kick", "snare", "hat"],
    density: 1.4,
    openHat: true,
    layers: ["arp", "pad", "perc", "guitar", "keys2"],
  },
  outro: { drums: [], density: 0.45, openHat: false, layers: [] },
};

// Nombre de la seccion que le toca a cada compas, de corrido.
export function sectionPlan() {
  return FORM.flatMap((section) => Array(section.bars).fill(section.name));
}
