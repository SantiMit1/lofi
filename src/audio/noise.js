import { getContext } from "./engine.js";

let buffer = null;

export function getNoiseBuffer() {
  if (buffer) return buffer;

  const ctx = getContext();
  const length = Math.floor(ctx.sampleRate);
  buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  return buffer;
}
