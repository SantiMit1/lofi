export function createReverb(ctx, { seconds = 2.2, decay = 3, damp = 2500 } = {}) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Filtro previo al convolver: deja la reverb oscura y "vieja".
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = damp;

  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(ctx, seconds, decay);

  input.connect(tone);
  tone.connect(convolver);
  convolver.connect(output);

  return { input, output };
}

function makeImpulse(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);

    // Normalizar a energía unitaria: sin esto la convolucion dispara la
    // ganancia ~100x y satura todo.
    let energy = 0;
    for (let i = 0; i < length; i++) {
      const s = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      data[i] = s;
      energy += s * s;
    }

    const norm = 1 / Math.sqrt(energy);
    for (let i = 0; i < length; i++) data[i] *= norm;
  }

  return buffer;
}
