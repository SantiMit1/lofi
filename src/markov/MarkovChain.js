export class MarkovChain {
  constructor(transitions, { states = null } = {}) {
    this.transitions = transitions;
    this.states = states ?? Object.keys(transitions);
  }

  // Elige el próximo estado de forma ponderada a partir del estado actual.
  sample(state, rng) {
    const row = this.transitions[state] ?? this.transitions[this.states[0]];
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
