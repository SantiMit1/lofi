export function createTapeNoise(ctx) {
  const output = ctx.createGain();

  const hiss = ctx.createBufferSource();
  hiss.buffer = makeHiss(ctx, 2);
  hiss.loop = true;
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = "highpass";
  hissFilter.frequency.value = 3000;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.012;
  hiss.connect(hissFilter);
  hissFilter.connect(hissGain);
  hissGain.connect(output);
  hiss.start();

  const crackle = ctx.createBufferSource();
  crackle.buffer = makeCrackle(ctx, 3);
  crackle.loop = true;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.25;
  crackle.connect(crackleGain);
  crackleGain.connect(output);
  crackle.start();

  return { output };
}

function makeHiss(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  return buffer;
}

function makeCrackle(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    if (Math.random() < 0.0002) {
      const amp = (Math.random() * 2 - 1) * 0.6;
      const dur = 20 + Math.floor(Math.random() * 60);
      for (let j = 0; j < dur && i + j < length; j++) {
        data[i + j] += amp * (1 - j / dur);
      }
    }
  }

  return buffer;
}
