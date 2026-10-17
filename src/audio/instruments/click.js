import { getContext, getMaster } from '../engine.js';

export function scheduleClick(time, accent) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.frequency.value = accent ? 880: 440;
  osc.connect(g);
  g.connect(getMaster());

  const peak = accent ? 0.9 : 0.5;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

  osc.start(time);
  osc.stop(time + 0.06);
}