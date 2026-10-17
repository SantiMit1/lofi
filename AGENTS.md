# AGENTS.md

Generador de lo-fi en JS vanilla (Web Audio API + cadenas de Markov). Corre entero en el navegador.

**Sin build, sin dependencias, sin tests, sin `package.json`.** Es una restricción del proyecto: no
agregues npm, bundlers, transpiladores ni un `package.json`. Los módulos ES se sirven tal cual.

## Correr

```bash
python -m http.server 8000   # http://localhost:8000/
```

`file://` no sirve: el navegador bloquea los módulos ES por CORS.

## Verificar sin navegador

No hay runner de tests; la verificación se arma a mano:

- Sintaxis: copiar el archivo a `.mjs` y `node --check <archivo>.mjs`.
- **Módulos puros** (importables en Node): `src/core/rng.js`, `src/markov/*`, `src/theory/*`,
  `src/compose/*`. Para importarlos, copiar `src/` a un dir temporal con `package.json` =
  `{"type":"module"}`.
- **No puros**: `src/core/scheduler.js` (importa audio), `src/audio/**` (necesita `AudioContext`),
  `src/main.js` (necesita DOM). Ojo: `core/` mezcla `rng.js` (puro) con `scheduler.js` (solo navegador).
- Para ejercitar módulos de audio en Node: stubbear `globalThis.window.AudioContext` **antes** de un
  `import()` dinámico.
- El audio no se puede validar desde acá. Si tocás síntesis o el scheduler, decí que no pudiste
  escucharlo en vez de afirmar que suena bien.

## Arquitectura

`index.html` → `src/main.js` (UI, localStorage, auto-avance) → `src/core/scheduler.js` (lookahead,
beats→segundos, swing, fin de canción) → `src/compose/composer.js` (un compás por vez: acordes Markov
de orden 2, batería, bajo, melodía, humanización) → `src/audio/*` (síntesis + bus master).

- `src/markov/tables.js`: todas las tablas de transición.
- `src/compose/sections.js`: la forma (`FORM` = 32 compases, intro/A/B/A/outro) y las reglas por
  sección. Cambiar `FORM` cambia el largo de cada canción. `composer.nextBar()` marca el último compás
  con `last`; el scheduler avisa por `setOnSongEnd()` y `main.js` arranca otra con seed y tempo al azar.
- `src/audio/instruments/click.js` (metrónomo) no está cableado a nada.
- `src/visualizer.js`: el visualizador de fondo (barras + onda en un `<canvas>`). `main.js` lo arranca y
  lo para junto con la reproducción. Toma el audio del `AnalyserNode` que `engine.js` engancha **después
  de `masterGain`**, así que refleja el volumen; usa datos en bytes (escala dB) para que a volumen bajo
  siga viéndose. Las constantes de calibración están arriba del módulo.

## Trampas

- **Unidades en beats, nunca segundos.** Los eventos del composer traen `at` y `length` en beats; el
  scheduler los pasa a segundos con `60/tempo`. La humanización también es en beats, a propósito, para
  que escale con el tempo.
- **El azar generativo sale solo de `createRng(seed)`.** `Math.random()` aparece únicamente en
  `main.js` (elegir seed/tempo de la próxima canción) y en generadores de material de audio
  (`noise.js`, `reverb.js`, `tapeNoise.js`). Si agregás `Math.random()` en `compose/` o `markov/`,
  "misma seed = misma canción" deja de valer.
- **Cambiar el modelo cambia todas las seeds.** Tocar las tablas, o incluso el orden o la cantidad de
  llamadas al `rng`, cambia lo que produce cada seed: los links compartidos viejos suenan distinto.
- **El swing solo retrasa las semicorcheas impares**; la grilla del reloj sigue recta y el inicio del
  compás nunca se mueve.
- **`lofi-theme` está duplicado**: lo lee el script inline anti-flash de `index.html` y `THEME_KEY` en
  `main.js`. Si lo renombrás, van los dos. Lo mismo con los colores: toda variable nueva va en `:root`
  **y** en `:root[data-theme="dark"]`.
- `core.autocrlf=true`: los avisos "LF will be replaced by CRLF" al `git add` son normales.
- No pushees sin que te lo pidan (origin: `github.com/SantiMit1/lofi`, rama `main`).

## Estilo

- Comentarios en español, solo donde la lógica no es obvia (decisiones musicales, de timing o de DSP).
  La mayoría del código no lleva comentarios y está bien así.
- Commits en español, conventional commits (`feat:`, `fix:`), asunto **sin tildes** (todos los del
  historial son ASCII), en minúscula después de los dos puntos y sin punto final; cuerpo con viñetas `-`.
  Un commit por milestone.
- El usuario escribe en español: respondé en español.
