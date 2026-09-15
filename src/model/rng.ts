/** Mulberry32 PRNG — deterministic, fast, good enough for synthetic demography. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number): number {
  // Box–Muller
  const u = Math.max(1e-12, rng());
  const v = Math.max(1e-12, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function sampleCategorical<T extends string>(
  rng: () => number,
  items: { value: T; p: number }[],
): T {
  let r = rng();
  for (const item of items) {
    r -= item.p;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
