let ctx = null;
let master = null;

export function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  return ctx;
}

export function getMaster() {
  if (!master) {
    master = getContext().createGain();
    master.gain.value = 0.8;
    master.connect(getContext().destination);
  }

  return master;
}

export async function unlock() {
  const c = getContext();
  if (c.state === 'suspended') {
    await c.resume();
  }
}