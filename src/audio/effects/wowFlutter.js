// Wow (0.5 Hz) y flutter (6.5 Hz): un LFO modulando un delay node produce el
// vaivén de tono del cassette. Largos de ~2ms se oyen como desafinación, no eco.
export function createWowFlutter(ctx) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(0.05);
  delay.delayTime.value = 0.004;

  const wow = ctx.createOscillator();
  const wowGain = ctx.createGain();
  wow.frequency.value = 0.5;
  wowGain.gain.value = 0.0015;

  const flutter = ctx.createOscillator();
  const flutterGain = ctx.createGain();
  flutter.frequency.value = 6.5;
  flutterGain.gain.value = 0.0004;

  wow.connect(wowGain);
  wowGain.connect(delay.delayTime);
  flutter.connect(flutterGain);
  flutterGain.connect(delay.delayTime);

  input.connect(delay);
  delay.connect(output);

  wow.start();
  flutter.start();

  return { input, output };
}
