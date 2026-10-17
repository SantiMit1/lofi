export class MarkovChain {
  constructor(transitions, { states = null, fallback = null } = {}) {
    this.transitions = transitions;
    this.states = states ?? Object.keys(transitions);
    this.fallback = fallback;
  }

  // Fila del estado: directa, por fallback, o la primera como último recurso.
  rowFor(state) {
    const row = this.transitions[state];
    if (row) return row;

    const alt = this.fallback ? this.fallback(state) : null;
    return alt ?? this.transitions[this.states[0]];
  }

  // Elige el próximo estado de forma ponderada a partir del estado actual.
  sample(state, rng) {
    const row = this.rowFor(state);
    const total = row.reduce((sum, [, weight]) => sum + weight, 0);

    let r = rng.next() * total;
    for (const [next, weight] of row) {
      r -= weight;
      if (r <= 0) return next;
    }

    // Solo se llega acá por error
    return row[row.length - 1][0];
  }
}
