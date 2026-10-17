# LoFi Gen

Generador de lo-fi en el navegador: nada de samples, todo se sintetiza en vivo con la Web Audio API
y se decide con cadenas de Markov. Cada canción dura 32 compases, tiene intro, estribillos y outro,
y cuando termina arranca sola una nueva con otra semilla.

▶️ **[santimit1.github.io/lofi](https://santimit1.github.io/lofi/)**

## Cómo se arma una canción

La pieza va de una semilla a sonido en etapas bien separadas. Cada una alimenta a la siguiente:

```
semilla ─▶ PRNG determinista
             │
             ▼
        forma (32 compases)
             │
             ▼
   ┌── por compás ───────────────────────────┐
   │  acorde (Markov orden 2) ─▶ voicing      │
   │  bajo · arpegio · batería · melodía      │
   └──────────────┬───────────────────────────┘
                  ▼
           humanización (timing/velocity)
                  ▼
      scheduler de lookahead ─▶ síntesis ─▶ bus master
```

1. **Semilla → PRNG.** Toda la aleatoriedad sale de un generador mulberry32 sembrado. La semilla es un
   número o cualquier texto, y es lo único que decide *qué* notas suenan: el mismo PRNG reparte las
   mismas decisiones en el mismo orden.
2. **Forma.** La canción se divide en bloques de compases (`intro` 4, `A` 8, `B` 8, `A` 8, `outro` 4).
   Cada sección tiene reglas propias: qué voces de batería entran, cuánta melódica se permite y qué
   capas opcionales (arpegio, pad) suenan. Introducción y outro van casi desnudos, sin batería.
3. **Compás a compás.** Antes de cada compás se elige el próximo acorde, el próximo patrón de batería
   y se genera la frase de melodía. Con eso se escriben todas las notas del compás: comping de teclas
   (acorde largo + stab), bajo en la raíz o la quinta, arpegio sobre el voicing y batería según patrón.
4. **Humanización.** A cada nota se le suma un pequeño desvío de *timing* y de velocity. La batería
   queda recta en el tiempo a propósito y solo se le mueve la intensidad.
5. **Scheduler.** Un reloj con lookahead mira las notas en beats, las convierte a segundos y las mete
   en el audio con antelación. El *swing* retrasa las semicorcheas impares sin mover el inicio del compás.
6. **Síntesis.** Cada instrumento se genera por síntesis (osciladores, ruido, envolventes) y todo pasa
   por un bus master que le da el carácter: wow/flutter de cinta, lowpass, saturación y compresor.

## Las cadenas de Markov

Una cadena de Markov es un modelo donde el próximo valor depende solo del valor actual: hay un conjunto
de **estados** y, para cada uno, una fila de **transiciones posibles con un peso**. Para avanzar se
elige al azar de forma proporcional a esos pesos: la probabilidad de cada salto es su peso dividido por
la suma de la fila.

```
I   ──3──▶ vi        P(vi)   = 3 / 11
    ──3──▶ IV        P(IV)   = 3 / 11
    ──2──▶ ii        P(ii)   = 2 / 11
    ──2──▶ V         P(V)    = 2 / 11
    ──1──▶ iii       P(iii)  = 1 / 11
```

El peso es la "fuerza de la costumbre": reglas escritas a mano para que la música camine por donde
suena bien. Las cadenas se **encadenan entre sí**: el acorde que sale hoy es el estado de entrada de
mañana, y así la canción tiene continuidad en vez de ser una tirada de dados por compás.

La cantidad de memoria del modelo es su **orden**. Acá conviven varias cadenas:

| Cadena | Estado | Orden | Qué logra |
| --- | --- | --- | --- |
| Acordes | numeral romano (`I`, `ii`, `iii`, `IV`, `V`, `vi`, `vii`) | **2** (`anterior\|actual`) | Progresiones con sentido armónico, no saltos sueltos |
| Melodía | grado de la escala (1..7) | 1 | Movimiento por grados vecinos, cantable |
| Ritmo | duración en beats | 1 | Mezcla corcheas, negras y notas largas |
| Batería | nombre del patrón (`boomBap`, `halfTime`, `sparse`) | 1 | Que el groove evolucione sin cortarse |

El orden 2 es el truco armónico: mirar **dos** acordes atrás alcanza para que aparezcan cadencias
(`ii → V → I`), y al mismo tiempo deja variedad suficiente. Si un par no tuviera fila propia, la cadena
cae a la tabla de orden 1 usando solo el último acorde, así nunca se queda trabada.

La teoría arma el resto: los numerales se traducen a grados de la escala mayor, los acordes son tríadas
y las voces se abren bajando la nota del medio una octava. La melodía, en cambio, no puede divagar: en
las notas largas se corrige al tono del acorde más cercano, para que resuelva en lugar de chocar.

## Qué define una canción

Una canción queda fijada por **tres** valores, no solo por la semilla:

- **la semilla** decide las notas y la estructura: qué acordes, qué patrones, qué melodía;
- **el tempo** decide a qué velocidad suenan;
- **el swing** decide cuánto se retrasan las semicorcheas impares.

Los tres juntos son la canción: el mismo trío reproduce exactamente la misma pieza, y cambiar cualquiera
de ellos da otra. Como todo el azar viene del PRNG sembrado, dentro de eso no hay sorpresas.

El link del reproductor guarda los tres valores en la URL, así que se puede compartir o volver a una
canción más tarde; las últimas cinco quedan además en el navegador.

Un detalle a tener en cuenta: el orden de las llamadas al azar es parte de la canción. Cambiar una
tabla de transición, o incluso generar una nota de más en algún momento, hace que todas las semillas
suenen distinto.
