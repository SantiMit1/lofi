import { MarkovChain } from "../markov/MarkovChain.js";
import { MELODY_TRANSITIONS, RHYTHM_TRANSITIONS } from "../markov/tables.js";
import { ROMAN_TO_DEGREE, scaleSemitone } from "../theory/scales.js";

const MELODY_ROOT = 72; // C5, una octava arriba del comping
const REST_CHANCE = 0.25;

// Grados de la escala (1..7) que forman el acorde del numeral dado.
function chordTones(roman) {
  const dc = ROMAN_TO_DEGREE[roman];
  return [(dc % 7) + 1, ((dc + 2) % 7) + 1, ((dc + 4) % 7) + 1];
}

// Grado del acorde más cercano, midiendo la distancia de forma circular.
function nearestChordTone(degree, tones) {
  let best = tones[0];
  let bestDist = 8;

  for (const tone of tones) {
    const raw = Math.abs(tone - degree);
    const dist = Math.min(raw, 7 - raw);
    if (dist < bestDist) {
      bestDist = dist;
      best = tone;
    }
  }

  return best;
}

export function createMelody() {
  const notes = new MarkovChain(MELODY_TRANSITIONS);
  const rhythm = new MarkovChain(RHYTHM_TRANSITIONS);
  let degree = 1;
  let duration = "1";

  // Frase de un compás sobre el acorde dado. Devuelve eventos con offsets en beats.
  function phrase(roman, rng, density = 1) {
    const tones = chordTones(roman);
    const restChance = Math.min(0.8, REST_CHANCE / density);
    const events = [];
    let pos = 0;

    degree = tones[Math.floor(rng.next() * tones.length)];

    while (pos < 3.75) {
      duration = rhythm.sample(duration, rng);
      const len = Number(duration);
      if (pos + len > 4) break;

      if (rng.next() >= restChance) {
        const picked = notes.sample(degree, rng);
        // En notas largas (tiempos fuertes) resolvemos a un tono del acorde.
        degree = len >= 1 ? nearestChordTone(picked, tones) : picked;
        events.push({
          instrument: "lead",
          midi: MELODY_ROOT + scaleSemitone(degree - 1),
          at: pos,
          length: len * 0.9,
          vel: 0.4,
        });
      }

      pos += len;
    }

    return events;
  }

  return { phrase };
}
