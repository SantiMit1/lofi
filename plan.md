# Plan: instrumentos opcionales por canción

## Objetivo

Ampliar la paleta sin engordar todas las canciones: agregar instrumentos nuevos y que las capas
**no esenciales** aparezcan solo en algunas canciones (elegidas por seed) y solo en algunas secciones.

## Punto de partida

Hoy hay 4 pistas siempre activas: `drums`, `bass`, `keys`, `lead`. Un instrumento se cablea en 5 puntos:

| Punto | Archivo | Qué se agrega |
|---|---|---|
| Voz / síntesis | `src/audio/instruments/<x>.js` | `playX(midi, time, dur, vel)` que arma nodos y conecta a una pista |
| Bus de mezcla | `src/audio/mixer.js` → `CONFIG` | `{ level, pan, reverb }`; de ahí sale el track |
| Generación | `src/compose/composer.js` → `nextBar()` | eventos `{ instrument, midi/voice, at, length, vel }` (+ entrada en `HUMANIZE`) |
| Despacho | `src/core/scheduler.js` → `playEvent()` | rama que llama al `playX` |
| Patrón (opcional) | `src/markov/tables.js` | cadena propia si el instrumento necesita ritmo |

Atajos:

- `playKeys(midi, time, dur, vel, track)` recibe el track como parámetro: una segunda capa de teclas
  (rhodes, órgano, vibráfono) **no necesita voz nueva**, solo mixer + composer + scheduler.
- `click.js` es la plantilla para SFX sueltos: no pasa por el mixer, va directo a `getMaster()`.

## Decisiones acordadas

- **Determinismo:** un solo stream de `createRng(seed)`. El `lineup` se sortea al inicio de
  `createComposer`. Implica que **todas las seeds existentes cambian de sonido** (tocar el modelo
  cambia las seeds; ya es así por AGENTS.md).
- **UI:** sin cambios en `main.js` / `index.html`. La instrumentación vive en el composer y se
  reproduce sola con la seed; los links (`seed`/`tempo`/`swing`) no cambian.
- Los esenciales (`drums`, `bass`, `keys`, `lead`) suenan en todas las canciones; el resto es opcional.

## Infraestructura (base común a todos los milestones)

### 1. `lineup` en `src/compose/composer.js`

```js
// Capas opcionales: probabilidad de que entren en esta canción.
const OPTIONAL = {
  arp: 0.45,
  pad: 0.5,
  perc: 0.4,
  guitar: 0.35,
  keys2: 0.35,
};

function pickLineup(rng) {
  const lineup = new Set();
  for (const [name, chance] of Object.entries(OPTIONAL)) {
    if (rng.next() < chance) lineup.add(name);
  }
  return lineup;
}
```

En `createComposer`, sortear `const lineup = pickLineup(rng);` **antes** de la primera llamada a
`nextBar()` (el orden de consumo del rng define la canción).

### 2. `layers` por sección en `src/compose/sections.js`

Extender `SECTION_RULES` con una lista `layers` (qué capas opcionales suenan en cada sección):

```js
export const SECTION_RULES = {
  intro: { drums: [], density: 0.45, openHat: false, layers: [] },
  A:     { drums: ["kick", "snare", "hat"], density: 1,   openHat: false, layers: ["arp"] },
  B:     { drums: ["kick", "snare", "hat"], density: 1.4, openHat: true,  layers: ["arp", "pad"] },
  outro: { drums: [], density: 0.45, openHat: false, layers: [] },
};
```

### 3. Gate en `nextBar()`

Una capa se emite solo si está en el `lineup` **y** en `rules.layers`:

```js
function active(layer, rules) {
  return lineup.has(layer) && rules.layers.includes(layer);
}
```

Opcional: probabilidad por compás con el mismo `rng` para que la capa no sea constante.

## Milestones

Un commit por milestone, en español, conventional commits, asunto ASCII sin tildes.

### M0 — Infraestructura de capas opcionales

- Agregar `pickLineup`, `OPTIONAL` y el helper `active()` en `composer.js`.
- Extender `SECTION_RULES` con `layers`.
- Sin sonido nuevo todavía: deja el andamiaje listo y verifica que `nextBar()` sigue devolviendo
  eventos válidos.
- Verificación: `node --check` sobre una copia `.mjs` de `composer.js`/`sections.js`.

### M1 — Arpegio

- **Por qué primero:** cero síntesis nueva (reusa `playKeys`), es 100% capa de `composer.js`.
  Máximo resultado, mínimo riesgo; estrena el mecanismo de `lineup`.
- `mixer.js`: `arp: { level: 0.5, pan: 0.25, reverb: 0.5 }`.
- `composer.js`: `HUMANIZE.arp`; en `nextBar()` recorrer las notas del acorde y emitir
  `{ instrument: "arp", midi, at, length, vel }` en semicorcheas/corcheas con el rng.
- `scheduler.js`: rama `else if (event.instrument === "arp") playKeys(..., "arp")`.
- Verificación: `node --check`; el audio se escucha en el navegador (no validable desde Node).

### M2 — Pad / cuerdas

- Voz nueva `src/audio/instruments/pad.js`: oscilador filtrado (lowpass) con ataque lento
  (~0.5–0.8 s) y release largo; sumar reverb alta en el bus.
- `mixer.js`: `pad: { level: 0.35, pan: 0.1, reverb: 0.6 }`.
- `composer.js`: acorde largo por compás, típicamente en `A/B`.
- `scheduler.js`: rama `else if (event.instrument === "pad") playPad(...)`.
- Detalle: para ancho estéreo conviene un par de osciladores desafinados; ajustar a oído.

### M3 — Percusión suelta (shaker / tambourine / rimshot)

- Voz de ruido + envelope en `src/audio/instruments/perc.js` (reusa `noise.js`).
- `mixer.js`: `perc: { level: 0.4, pan: 0.3, reverb: 0.2 }`.
- `composer.js`: patrón en corcheas con rng; entra sobre todo en secciones densas.
- `scheduler.js`: despacho por `event.voice` (como los drums).
- Alternativa: puede vivir dentro del track de drums en vez de una pista propia.

### M4 — Guitarra pluck (Karplus-Strong)

- Voz nueva con línea de delay corta + filtro (Karplus-Strong) o ruido + filtro con decaimiento.
- `mixer.js`: `guitar: { level: 0.45, pan: -0.2, reverb: 0.45 }`.
- `composer.js`: arpegios/voicings del acorde, alternativa al arpegio de teclas.
- `scheduler.js`: rama `playGuitar`.
- Verificación: es la capa con más riesgo tímbrico; escuchar antes de subir probabilidad.

### M5 — Segunda capa de teclas (rhodes / vibráfono)

- Sin voz nueva: reusar `playKeys` con `track = "keys2"` y ajustar el timbre por parámetros si hace falta.
- `mixer.js`: `keys2: { level: 0.4, pan: -0.25, reverb: 0.5 }`.
- `composer.js`: doblar o responder al comping en algunas secciones.
- `scheduler.js`: rama `playKeys(..., "keys2")`.

### M6 — SFX decorativos (tape stop / rebobinado / lluvia)

- Plantilla `click.js`: sin mixer, salida directa a `getMaster()`.
- Disparar en bordes de sección (inicio/fin) desde `composer.js` con eventos propios.
- Poca frecuencia y baja probabilidad: son color, no base.

## Verificación (todos los milestones)

- Sintaxis: copiar el archivo a `.mjs` y `node --check <archivo>.mjs`.
- Módulos puros (`src/compose/*`, `src/markov/*`, `src/theory/*`): importables en Node copiando `src/`
  a un dir temporal con `package.json` = `{"type":"module"}`.
- Audio (síntesis/scheduler): **no validable desde acá**; hay que escucharlo en el navegador
  (`python -m http.server 8000`).
- Revisar que "misma seed = misma canción" siga valiendo tras cada milestone.

## Trampas a recordar

- Unidades en **beats**, nunca segundos (humanización incluida).
- Toda aleatoriedad de `compose/` y `markov/` sale de `createRng(seed)`; nada de `Math.random()`
  salvo en `main.js` y generadores de material de audio.
- Tocar tablas o el orden/cantidad de llamadas al `rng` cambia todas las seeds (links viejos suenan
  distinto). Al agregar el `lineup` ya se asume este cambio una vez.
- Sin build, sin dependencias, sin `package.json` en el repo.
