import { MarkovChain } from "../markov/MarkovChain.js";
import { CHORD_TRANSITIONS, CHORD_TRANSITIONS_2, DRUM_TRANSITIONS } from "../markov/tables.js";
import { DRUM_PATTERNS } from "./patterns.js";
import { createMelody } from "./melody.js";
import { chordNotes, voiceOpen } from "../theory/scales.js";
import { createRng } from "../core/rng.js";
import { sectionPlan, SECTION_RULES } from "./sections.js";

const KEY_ROOT = 60; // C4

// Humanizacion: jitter de timing (en beats) y de velocity por instrumento.
// Los drums quedan rectos en el tiempo y solo se les mueve la velocity.
const HUMANIZE = {
  keys: { time: 0.008, vel: 0.1 },
  lead: { time: 0.018, vel: 0.12 },
  arp: { time: 0.012, vel: 0.1 },
  pad: { time: 0.02, vel: 0.06 },
  perc: { time: 0.006, vel: 0.12 },
  guitar: { time: 0.015, vel: 0.12 },
  keys2: { time: 0.01, vel: 0.1 },
  bass: { time: 0.01, vel: 0.08 },
  drum: { time: 0, vel: 0.08 },
};

const STRUM_STEP = 0.02;

// Capas opcionales: probabilidad de que entren en esta cancion. Los esenciales
// (drums, bass, keys, lead) no pasan por aca.
const OPTIONAL = {
  arp: 0.45,
  pad: 0.5,
  perc: 0.4,
  guitar: 0.35,
  keys2: 0.35,
};

// Capas de OPTIONAL ya cableadas a audio. El resto se sigue sorteando (para no
// correr el stream del rng cuando se implementen) pero todavia no suena.
const LIVE_LAYERS = ["arp", "pad", "perc", "guitar", "keys2"];

// Instrumentos que suenan en toda cancion, en orden de presentacion.
const ESSENTIALS = ["drums", "bass", "keys", "lead"];

function pickLineup(rng) {
  const lineup = new Set();

  for (const [layer, chance] of Object.entries(OPTIONAL)) {
    if (rng.next() < chance) lineup.add(layer);
  }

  return lineup;
}

function humanize(events, rng) {
  for (const event of events) {
    const cfg = HUMANIZE[event.instrument];
    if (!cfg) continue;

    if (cfg.time > 0) {
      event.at = Math.max(0, event.at + (rng.next() * 2 - 1) * cfg.time);
    }

    const vel = event.vel * (1 + (rng.next() * 2 - 1) * cfg.vel);
    event.vel = Math.min(1, Math.max(0.05, vel));
  }
}

export function createComposer(seed = 1) {
  const rng = createRng(seed);
  const lineup = pickLineup(rng);
  const instruments = ESSENTIALS.concat(LIVE_LAYERS.filter((layer) => lineup.has(layer)));
  const chords = new MarkovChain(CHORD_TRANSITIONS_2, {
    fallback: (key) => CHORD_TRANSITIONS[key.split("|")[1]],
  });
  const drumPatterns = new MarkovChain(DRUM_TRANSITIONS);
  const melody = createMelody();
  const plan = sectionPlan();
  let barIndex = 0;
  let currentChord = "I";
  let previousChord = "I";
  let currentPattern = "boomBap";
  let previousSection = null;

  // Una capa opcional suena solo si entro en el lineup y la seccion la habilita.
  function active(layer, rules) {
    return lineup.has(layer) && rules.layers.includes(layer);
  }

  // Decide un compás completo. Devuelve eventos con offsets en beats.
  function nextBar() {
    const section = plan[barIndex];
    const rules = SECTION_RULES[section];
    barIndex++;

    const sectionChanged = section !== previousSection;
    previousSection = section;

    const key = `${previousChord}|${currentChord}`;
    previousChord = currentChord;
    currentChord = chords.sample(key, rng);

    currentPattern = drumPatterns.sample(currentPattern, rng);

    const triad = chordNotes(currentChord, KEY_ROOT);
    const root = triad[0];
    const events = [];

    // comping de teclas: acorde largo en beat 1, stab en beat 3
    voiceOpen(triad).forEach((midi, i) => {
      const roll = i * STRUM_STEP;
      events.push({ instrument: "keys", midi, at: roll, length: 1.9, vel: 0.45 });
      events.push({ instrument: "keys", midi, at: 2 + roll, length: 1.6, vel: 0.3 });
    });

    // bajo: raíz en beat 1, raíz o quinta en beat 3 (dos octavas abajo)
    const bassSecond = rng.next() < 0.5 ? root : root + 7;
    events.push({ instrument: "bass", midi: root - 24, at: 0, length: 1.8, vel: 0.6 });
    events.push({ instrument: "bass", midi: bassSecond - 24, at: 2, length: 1.6, vel: 0.5 });

    // arpegio: recorre el voicing abierto del acorde, una octava arriba, en corcheas
    if (active("arp", rules)) {
      const tones = voiceOpen(triad).map((midi) => midi + 12);

      for (let step = 0; step < 8; step++) {
        if (rng.next() < 0.25) continue;

        events.push({
          instrument: "arp",
          midi: tones[step % tones.length],
          at: step * 0.5,
          length: 0.45,
          vel: 0.3,
        });
      }
    }

    // pad: acorde largo sostenido casi todo el compás
    if (active("pad", rules)) {
      voiceOpen(triad).forEach((midi, i) => {
        events.push({ instrument: "pad", midi, at: i * 0.06, length: 3.7, vel: 0.3 });
      });
    }

    // percusión suelta: shaker o pandereta en corcheas, más un rimshot de color
    if (active("perc", rules)) {
      const hat = rng.next() < 0.5 ? "shaker" : "tambourine";

      for (let step = 0; step < 8; step++) {
        const onBeat = step % 2 === 0;
        if (rng.next() >= (onBeat ? 0.75 : 0.5)) continue;

        events.push({
          instrument: "perc",
          voice: hat,
          at: step * 0.5,
          length: 0.2,
          vel: onBeat ? 0.3 : 0.2,
        });
      }

      if (rng.next() < 0.3) {
        events.push({ instrument: "perc", voice: "rimshot", at: 2.5, length: 0.2, vel: 0.35 });
      }
    }

    // guitarra: punteo del voicing, otra textura sobre el mismo acorde
    if (active("guitar", rules)) {
      const tones = voiceOpen(triad).map((midi) => midi + 12);
      const pattern = [0, 2, 1, 2];

      for (let step = 0; step < 8; step++) {
        if (rng.next() < 0.35) continue;

        events.push({
          instrument: "guitar",
          midi: tones[pattern[step % pattern.length]],
          at: step * 0.5,
          length: 0.9,
          vel: 0.3,
        });
      }
    }

    // segunda capa de teclas: responde al comping desde los contratiempos
    if (active("keys2", rules)) {
      const tones = voiceOpen(triad);
      const octave = rng.next() < 0.5 ? 12 : 0;

      events.push({
        instrument: "keys2",
        midi: tones[2] + octave,
        at: 1.5,
        length: 0.9,
        vel: 0.25,
      });

      if (rng.next() < 0.5) {
        events.push({
          instrument: "keys2",
          midi: tones[1] + octave,
          at: 3.5,
          length: 0.9,
          vel: 0.2,
        });
      }
    }

    for (const [voice, steps] of Object.entries(DRUM_PATTERNS[currentPattern])) {
      if (!rules.drums.includes(voice)) continue;

      steps.forEach((vel, step) => {
        if (vel > 0) events.push({ instrument: "drum", voice, at: step / 4, vel });
      });
    }

    if (rules.openHat) {
      events.push({ instrument: "drum", voice: "openHat", at: 3.25, vel: 0.25 });
    }

    events.push(...melody.phrase(currentChord, rng, rules.density));

    // SFX decorativos: rebobinado al abrir un extremo, tape stop al cerrar la
    // canción y lluvia sobre la intro. Salen directo al master, sin humanizar.
    if (sectionChanged && (section === "intro" || section === "outro") && rng.next() < 0.35) {
      events.push({ instrument: "sfx", voice: "rewind", at: 0, length: 0.5, vel: 0.3 });
    }

    if (sectionChanged && section === "intro" && rng.next() < 0.3) {
      events.push({ instrument: "sfx", voice: "rain", at: 0, length: 3.5, vel: 0.25 });
    }

    if (barIndex === plan.length && rng.next() < 0.6) {
      events.push({ instrument: "sfx", voice: "tapeStop", at: 3, length: 1, vel: 0.5 });
    }

    humanize(events, rng);

    return { degree: currentChord, pattern: currentPattern, section, events, last: barIndex === plan.length };
  }

  return { nextBar, instruments };
}
