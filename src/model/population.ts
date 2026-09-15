import type { CityConfig, CityId } from './cities';
import { CITIES, getCity } from './cities';
import { clamp, lerp, mulberry32, randn } from './rng';
import {
  CUP_FROM_INDEX,
  ETHNICITY_INDEX,
  FLAG_AVAILABLE,
  FLAG_BODY,
  FLAG_FACE,
  FLAG_TATTOOS,
  type PackedPop,
} from './types';

export const POPULATION_SEED = 20260915;

/** @deprecated Fixed-N sample is gone; N = selected city's female count. */
export const POPULATION_SIZE = 0;

const CHUNK = 24_576;

const CITY_SEED: Record<CityId, number> = {
  tyler_tx: POPULATION_SEED,
  houston_tx: POPULATION_SEED + 1,
  dallas_tx: POPULATION_SEED + 2,
};

function allocPop(cityId: CityId, n: number): PackedPop {
  return {
    cityId,
    n,
    age: new Uint8Array(n),
    heightTenthIn: new Uint16Array(n),
    weightLb: new Uint16Array(n),
    ethnicity: new Uint8Array(n),
    hair: new Uint8Array(n),
    eye: new Uint8Array(n),
    education: new Uint8Array(n),
    incomeUsd: new Uint32Array(n),
    flags: new Uint8Array(n),
    cup: new Uint8Array(n),
  };
}

function ethnicityCdf(city: CityConfig): Float64Array {
  const e = city.ethnicity;
  const c = new Float64Array(6);
  c[0] = e.white_nh;
  c[1] = c[0] + e.black;
  c[2] = c[1] + e.hispanic;
  c[3] = c[2] + e.asian;
  c[4] = c[3] + e.indian;
  c[5] = 1;
  return c;
}

function sampleCdf6(rng: () => number, cdf: Float64Array): number {
  const r = rng();
  if (r <= cdf[0]!) return 0;
  if (r <= cdf[1]!) return 1;
  if (r <= cdf[2]!) return 2;
  if (r <= cdf[3]!) return 3;
  if (r <= cdf[4]!) return 4;
  return 5;
}

function sampleAge(
  rng: () => number,
  under18: number,
  age65: number,
): number {
  const u = rng();
  if (u < under18) return (rng() * 18) | 0; // 0–17
  if (u < under18 + age65) return 65 + ((rng() * 26) | 0); // 65–90
  const a = rng();
  if (a < 0.42) return (18 + rng() * 12) | 0;
  if (a < 0.72) return (30 + rng() * 15) | 0;
  if (a < 0.9) return (45 + rng() * 12) | 0;
  return (57 + rng() * 8) | 0;
}

/**
 * Hair bases by ethnicity (6 colors: black, brown, blonde, red, gray, other).
 * Indian (Asian Indian) is its own row — not East/Southeast Asian.
 */
const HAIR_BASE: number[][] = [
  // white_nh
  [0.08, 0.42, 0.26, 0.06, 0.08, 0.1],
  // black
  [0.68, 0.18, 0.015, 0.01, 0.015, 0.1],
  // hispanic
  [0.36, 0.44, 0.05, 0.02, 0.04, 0.09],
  // asian East/SE
  [0.82, 0.1, 0.01, 0.005, 0.015, 0.05],
  // indian (Asian Indian)
  [0.78, 0.16, 0.005, 0.005, 0.02, 0.03],
  // other
  [0.28, 0.4, 0.12, 0.03, 0.05, 0.12],
];

function sampleHair(rng: () => number, age: number, eth: number): number {
  const base = HAIR_BASE[eth]!;
  const grayBoost = clamp((age - 40) / 40, 0, 0.55);
  const g0 = base[0]! * (1 - grayBoost * 0.85);
  const g1 = base[1]! * (1 - grayBoost * 0.85);
  const g2 = base[2]! * (1 - grayBoost * 0.85);
  const g3 = base[3]! * (1 - grayBoost * 0.85);
  const g4 = base[4]! + grayBoost;
  const g5 = base[5]! * (1 - grayBoost * 0.85);
  const sum = g0 + g1 + g2 + g3 + g4 + g5;
  let r = rng() * sum;
  if ((r -= g0) <= 0) return 0;
  if ((r -= g1) <= 0) return 1;
  if ((r -= g2) <= 0) return 2;
  if ((r -= g3) <= 0) return 3;
  if ((r -= g4) <= 0) return 4;
  return 5;
}

/** Eye bases: brown, blue, hazel, green, gray, other. */
const EYE_BASE: number[][] = [
  [0.34, 0.3, 0.14, 0.12, 0.05, 0.05], // white_nh
  [0.82, 0.02, 0.07, 0.025, 0.015, 0.05], // black
  [0.68, 0.06, 0.12, 0.06, 0.03, 0.05], // hispanic
  [0.88, 0.015, 0.03, 0.015, 0.01, 0.05], // asian East/SE
  [0.86, 0.015, 0.05, 0.02, 0.015, 0.04], // indian
  [0.55, 0.12, 0.14, 0.09, 0.04, 0.06], // other
];

function sampleEye(rng: () => number, hair: number, eth: number): number {
  const b = EYE_BASE[eth]!;
  let brown = b[0]!;
  let blue = b[1]!;
  let hazel = b[2]!;
  let green = b[3]!;
  let gray = b[4]!;
  let other = b[5]!;
  if (hair === 0 || hair === 1) {
    brown += 0.08;
    blue -= 0.04;
    green -= 0.02;
    hazel -= 0.01;
  } else if (hair === 2) {
    brown -= 0.1;
    blue += 0.08;
    green += 0.02;
    hazel += 0.01;
  } else if (hair === 3) {
    brown -= 0.06;
    green += 0.04;
    hazel += 0.03;
    blue -= 0.01;
  } else if (hair === 4) {
    blue += 0.015;
    gray += 0.015;
    brown -= 0.02;
  }
  brown = brown > 0.02 ? brown : 0.02;
  blue = blue > 0.01 ? blue : 0.01;
  hazel = hazel > 0.02 ? hazel : 0.02;
  green = green > 0.01 ? green : 0.01;
  gray = gray > 0.005 ? gray : 0.005;
  other = other > 0.01 ? other : 0.01;
  const sum = brown + blue + hazel + green + gray + other;
  let r = rng() * sum;
  if ((r -= brown) <= 0) return 0;
  if ((r -= blue) <= 0) return 1;
  if ((r -= hazel) <= 0) return 2;
  if ((r -= green) <= 0) return 3;
  if ((r -= gray) <= 0) return 4;
  return 5;
}

function sampleEducation(rng: () => number, age: number): number {
  if (age < 18) return 0;
  const young = age < 35;
  let r = rng();
  if (young) {
    if ((r -= 0.07) <= 0) return 0;
    if ((r -= 0.24) <= 0) return 1;
    if ((r -= 0.28) <= 0) return 2;
    if ((r -= 0.27) <= 0) return 3;
    return 4;
  }
  if ((r -= 0.09) <= 0) return 0;
  if ((r -= 0.28) <= 0) return 1;
  if ((r -= 0.27) <= 0) return 2;
  if ((r -= 0.23) <= 0) return 3;
  return 4;
}

const INCOME_BASE = [22_000, 32_000, 40_000, 58_000, 78_000];

function sampleIncome(rng: () => number, edu: number, age: number): number {
  if (age < 18) return 0;
  const ageFactor = clamp(0.7 + ((age - 22) / 40) * 0.55, 0.65, 1.25);
  const mean = INCOME_BASE[edu]! * ageFactor;
  const sigma = 0.55;
  const logMean = Math.log(mean) - 0.5 * sigma * sigma;
  const income = Math.exp(logMean + sigma * randn(rng));
  return clamp(income, 0, 750_000) | 0;
}

function sampleAvailable(rng: () => number, age: number): boolean {
  if (age < 18) return false;
  let pMarried: number;
  if (age < 25) pMarried = 0.12;
  else if (age < 30) pMarried = 0.32;
  else if (age < 35) pMarried = 0.48;
  else if (age < 40) pMarried = 0.55;
  else if (age < 50) pMarried = 0.58;
  else if (age < 60) pMarried = 0.56;
  else pMarried = 0.52;
  return rng() >= pMarried;
}

function tattooProb(age: number, edu: number): number {
  if (age < 18) return 0;
  let p = 0.3;
  if (age < 25) p = 0.42;
  else if (age < 30) p = 0.4;
  else if (age < 40) p = 0.35;
  else if (age < 50) p = 0.22;
  else p = 0.12;
  if (edu === 4) p *= 0.85;
  if (edu === 0) p *= 1.05;
  return clamp(p, 0.05, 0.55);
}

function facePiercingProb(age: number): number {
  if (age < 18) return 0;
  if (age < 25) return 0.12;
  if (age < 30) return 0.09;
  if (age < 40) return 0.05;
  if (age < 50) return 0.02;
  return 0.01;
}

function bodyPiercingProb(age: number, tattoos: boolean): number {
  if (age < 18) return 0;
  let p = age < 30 ? 0.14 : age < 40 ? 0.08 : 0.03;
  if (tattoos) p *= 1.7;
  return clamp(p, 0.01, 0.35);
}

function sampleCup(rng: () => number, bmi: number, weightLb: number): number {
  const t = clamp((bmi - 18) / 22, 0, 1);
  const center = lerp(1.6, 4.6, t);
  const weightNudge = clamp((weightLb - 140) / 200, -0.3, 0.5);
  const z = center + weightNudge + 1.15 * randn(rng);
  const idx = Math.round(z);
  if (idx < 0) return 0;
  if (idx >= CUP_FROM_INDEX.length) return CUP_FROM_INDEX.length - 1;
  return idx;
}

function writeOne(
  pop: PackedPop,
  i: number,
  rng: () => number,
  cdf: Float64Array,
  under18: number,
  age65: number,
): void {
  const age = sampleAge(rng, under18, age65);
  const eth = sampleCdf6(rng, cdf);

  const heightIn = clamp(63.7 + 2.7 * randn(rng), 54, 78);
  const bmiMean = 27.5 + 0.05 * (age - 35);
  let bmi = bmiMean + 6.2 * randn(rng);
  bmi = clamp(bmi, 16.5, 55);
  const heightM = heightIn * 0.0254;
  const weightLb = clamp(bmi * heightM * heightM * 2.20462262, 80, 420);

  const hair = sampleHair(rng, age, eth);
  const eye = sampleEye(rng, hair, eth);
  const edu = sampleEducation(rng, age);
  const income = sampleIncome(rng, edu, age);
  const available = sampleAvailable(rng, age);
  const tattoos = rng() < tattooProb(age, edu);
  const face = rng() < facePiercingProb(age);
  const body = rng() < bodyPiercingProb(age, tattoos);
  const cup = sampleCup(rng, bmi, weightLb);

  pop.age[i] = age;
  pop.heightTenthIn[i] = Math.round(heightIn * 10);
  pop.weightLb[i] = Math.round(weightLb);
  pop.ethnicity[i] = eth;
  pop.hair[i] = hair;
  pop.eye[i] = eye;
  pop.education[i] = edu;
  pop.incomeUsd[i] = Math.round(income / 100) * 100;
  pop.cup[i] = cup;
  let flags = 0;
  if (tattoos) flags |= FLAG_TATTOOS;
  if (face) flags |= FLAG_FACE;
  if (body) flags |= FLAG_BODY;
  if (available) flags |= FLAG_AVAILABLE;
  pop.flags[i] = flags;
}

export function generatePopulationSync(
  city: CityConfig,
  seed = CITY_SEED[city.id],
): PackedPop {
  const n = city.femaleCount;
  const pop = allocPop(city.id, n);
  const rng = mulberry32(seed);
  const cdf = ethnicityCdf(city);
  for (let i = 0; i < n; i++) {
    writeOne(pop, i, rng, cdf, city.under18Pct, city.age65PlusPct);
  }
  return pop;
}

export async function generatePopulationAsync(
  city: CityConfig,
  seed = CITY_SEED[city.id],
  onProgress?: (done: number, total: number) => void,
): Promise<PackedPop> {
  const n = city.femaleCount;
  const pop = allocPop(city.id, n);
  const rng = mulberry32(seed);
  const cdf = ethnicityCdf(city);
  const under18 = city.under18Pct;
  const age65 = city.age65PlusPct;
  for (let i = 0; i < n; ) {
    const end = Math.min(n, i + CHUNK);
    for (; i < end; i++) writeOne(pop, i, rng, cdf, under18, age65);
    onProgress?.(i, n);
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return pop;
}

const cache = new Map<CityId, PackedPop>();
const inflight = new Map<CityId, Promise<PackedPop>>();

export function peekPopulation(cityId: CityId): PackedPop | null {
  return cache.get(cityId) ?? null;
}

export function getPopulationAsync(
  cityId: CityId,
  onProgress?: (done: number, total: number) => void,
): Promise<PackedPop> {
  const hit = cache.get(cityId);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(cityId);
  if (pending) return pending;
  const city = getCity(cityId);
  const p = generatePopulationAsync(city, CITY_SEED[cityId], onProgress).then(
    (pop) => {
      cache.set(cityId, pop);
      inflight.delete(cityId);
      return pop;
    },
    (err) => {
      inflight.delete(cityId);
      throw err;
    },
  );
  inflight.set(cityId, p);
  return p;
}

/** Sync helper for tests / first paint if already cached. */
export function getPopulation(cityId: CityId = 'tyler_tx'): PackedPop {
  const hit = cache.get(cityId);
  if (hit) return hit;
  const pop = generatePopulationSync(CITIES[cityId], CITY_SEED[cityId]);
  cache.set(cityId, pop);
  return pop;
}

export { ETHNICITY_INDEX };
