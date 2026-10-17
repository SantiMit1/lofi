export function makeSaturationCurve(amount = 1.6, n = 1024) {
  const curve = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount);
  }

  return curve;
}
