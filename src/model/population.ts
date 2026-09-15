import type { CityConfig, CityId } from './cities';
import { CITIES, getCity, poolCount } from './cities';
import { clamp, lerp, mulberry32, randn } from './rng';
import {
  CUP_FROM_INDEX,
  ETHNICITY_INDEX,
  FLAG_AVAILABLE,
  FLAG_BODY,
  FLAG_FACE,
  FLAG_TATTOOS,
  poolKey,
  type PackedPop,
  type PoolKey,
  type Sex,
} from './types';

export const POPULATION_SEED = 20260915;

/** @deprecated Fixed-N sample is gone; N = selected city's sex count. */
export const POPULATION_SIZE = 0;

const CHUNK = 24_576;

const CITY_SEED: Record<CityId, number> = {
  tyler_tx: POPULATION_SEED,
  houston_tx: POPULATION_SEED + 1,
  dallas_tx: POPULATION_SEED + 2,
};

function seedFor(cityId: CityId, sex: Sex): number {
  return CITY_SEED[cityId] + (sex === 'male' ? 100 : 0);
}

function allocPop(cityId: CityId, sex: Sex, n: number): PackedPop {
  return {
    cityId,
    sex,
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
    penisLengthHundIn: new Uint16Array(n),
    penisGirthHundIn: new Uint16Array(n),
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
 * Same priors for men and women (appearance-frequency, not sex-split).
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

function sampleEducation(rng: () => number, age: number, sex: Sex): number {
  if (age < 18) return 0;
  const young = age < 35;
  let r = rng();
  // Women slightly higher BA+ share (ACS directional); men slightly higher HS-only.
  if (sex === 'female') {
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
  if (young) {
    if ((r -= 0.09) <= 0) return 0;
    if ((r -= 0.28) <= 0) return 1;
    if ((r -= 0.28) <= 0) return 2;
    if ((r -= 0.24) <= 0) return 3;
    return 4;
  }
  if ((r -= 0.11) <= 0) return 0;
  if ((r -= 0.3) <= 0) return 1;
  if ((r -= 0.26) <= 0) return 2;
  if ((r -= 0.21) <= 0) return 3;
  return 4;
}

/** Personal-income means by education; men slightly higher (ACS earnings gap directional). */
const INCOME_BASE_F = [22_000, 32_000, 40_000, 58_000, 78_000];
const INCOME_BASE_M = [26_000, 38_000, 48_000, 70_000, 95_000];

function sampleIncome(
  rng: () => number,
  edu: number,
  age: number,
  sex: Sex,
): number {
  if (age < 18) return 0;
  const ageFactor = clamp(0.7 + ((age - 22) / 40) * 0.55, 0.65, 1.25);
  const base = sex === 'female' ? INCOME_BASE_F : INCOME_BASE_M;
  const mean = base[edu]! * ageFactor;
  const sigma = 0.55;
  const logMean = Math.log(mean) - 0.5 * sigma * sigma;
  const income = Math.exp(logMean + sigma * randn(rng));
  return clamp(income, 0, 750_000) | 0;
}

function sampleAvailable(rng: () => number, age: number, sex: Sex): boolean {
  if (age < 18) return false;
  // Men marry slightly later on average (ACS marital status by sex/age directional).
  let pMarried: number;
  if (sex === 'female') {
    if (age < 25) pMarried = 0.12;
    else if (age < 30) pMarried = 0.32;
    else if (age < 35) pMarried = 0.48;
    else if (age < 40) pMarried = 0.55;
    else if (age < 50) pMarried = 0.58;
    else if (age < 60) pMarried = 0.56;
    else pMarried = 0.52;
  } else {
    if (age < 25) pMarried = 0.07;
    else if (age < 30) pMarried = 0.24;
    else if (age < 35) pMarried = 0.42;
    else if (age < 40) pMarried = 0.52;
    else if (age < 50) pMarried = 0.58;
    else if (age < 60) pMarried = 0.6;
    else pMarried = 0.58;
  }
  return rng() >= pMarried;
}

function tattooProb(age: number, edu: number, sex: Sex): number {
  if (age < 18) return 0;
  let p = 0.3;
  if (age < 25) p = 0.42;
  else if (age < 30) p = 0.4;
  else if (age < 40) p = 0.35;
  else if (age < 50) p = 0.22;
  else p = 0.12;
  if (sex === 'male') p *= 1.08; // mild male uplift (survey directional)
  if (edu === 4) p *= 0.85;
  if (edu === 0) p *= 1.05;
  return clamp(p, 0.05, 0.58);
}

function facePiercingProb(age: number, sex: Sex): number {
  if (age < 18) return 0;
  // Face piercings (excl. ears) less common among men — modeled.
  const scale = sex === 'male' ? 0.35 : 1;
  if (age < 25) return 0.12 * scale;
  if (age < 30) return 0.09 * scale;
  if (age < 40) return 0.05 * scale;
  if (age < 50) return 0.02 * scale;
  return 0.01 * scale;
}

function bodyPiercingProb(age: number, tattoos: boolean, sex: Sex): number {
  if (age < 18) return 0;
  let p = age < 30 ? 0.14 : age < 40 ? 0.08 : 0.03;
  if (sex === 'male') p *= 0.45; // modeled male-appropriate lower base rate
  if (tattoos) p *= 1.7;
  return clamp(p, 0.005, 0.35);
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

/**
 * calcSD / Veale et al. 2015 erect size (researcher-measured meta-analysis).
 * Length mean 13.12 cm (SD 1.66); girth mean 11.66 cm (SD 1.10).
 * Stored as hundredths of an inch. Mild height correlation (r≈0.25) —
 * Veale reported r≈0.2–0.6 for length×height; we keep the weak end.
 * No ethnicity×size claims. MODELED / HYPOTHETICAL — not Census.
 */
export const VEALE_ERECT_LENGTH_CM = { mean: 13.12, sd: 1.66 } as const;
export const VEALE_ERECT_GIRTH_CM = { mean: 11.66, sd: 1.1 } as const;
/** Weak length↔height correlation (literature range; we use mild). */
export const PENIS_HEIGHT_CORR = 0.25;
/** Mild length↔girth residual correlation. */
export const PENIS_LENGTH_GIRTH_CORR = 0.35;

const CM_PER_IN = 2.54;
const MALE_HEIGHT_MEAN_IN = 69.1;
const MALE_HEIGHT_SD_IN = 2.9;

function samplePenis(
  rng: () => number,
  heightIn: number,
): { lengthHundIn: number; girthHundIn: number } {
  // Height z for mild length shift
  const hz = (heightIn - MALE_HEIGHT_MEAN_IN) / MALE_HEIGHT_SD_IN;
  const zLenIndep = randn(rng);
  const zLen = PENIS_HEIGHT_CORR * hz + Math.sqrt(1 - PENIS_HEIGHT_CORR ** 2) * zLenIndep;
  const lengthCm = VEALE_ERECT_LENGTH_CM.mean + VEALE_ERECT_LENGTH_CM.sd * zLen;

  const zGirthIndep = randn(rng);
  const zGirth =
    PENIS_LENGTH_GIRTH_CORR * zLen +
    Math.sqrt(1 - PENIS_LENGTH_GIRTH_CORR ** 2) * zGirthIndep;
  const girthCm = VEALE_ERECT_GIRTH_CM.mean + VEALE_ERECT_GIRTH_CM.sd * zGirth;

  const lengthIn = clamp(lengthCm / CM_PER_IN, 2.0, 10.0);
  const girthIn = clamp(girthCm / CM_PER_IN, 2.0, 8.0);
  return {
    lengthHundIn: Math.round(lengthIn * 100),
    girthHundIn: Math.round(girthIn * 100),
  };
}

function sampleAnthropometrics(
  rng: () => number,
  age: number,
  sex: Sex,
): { heightIn: number; weightLb: number; bmi: number } {
  if (sex === 'female') {
    const heightIn = clamp(63.7 + 2.7 * randn(rng), 54, 78);
    const bmiMean = 27.5 + 0.05 * (age - 35);
    let bmi = bmiMean + 6.2 * randn(rng);
    bmi = clamp(bmi, 16.5, 55);
    const heightM = heightIn * 0.0254;
    const weightLb = clamp(bmi * heightM * heightM * 2.20462262, 80, 420);
    return { heightIn, weightLb, bmi };
  }
  // NHANES-directional adult men: taller/heavier means.
  const heightIn = clamp(MALE_HEIGHT_MEAN_IN + MALE_HEIGHT_SD_IN * randn(rng), 58, 84);
  const bmiMean = 28.2 + 0.04 * (age - 35);
  let bmi = bmiMean + 5.8 * randn(rng);
  bmi = clamp(bmi, 17, 55);
  const heightM = heightIn * 0.0254;
  const weightLb = clamp(bmi * heightM * heightM * 2.20462262, 100, 450);
  return { heightIn, weightLb, bmi };
}

function writeOne(
  pop: PackedPop,
  i: number,
  rng: () => number,
  cdf: Float64Array,
  under18: number,
  age65: number,
  sex: Sex,
): void {
  const age = sampleAge(rng, under18, age65);
  const eth = sampleCdf6(rng, cdf);
  const { heightIn, weightLb, bmi } = sampleAnthropometrics(rng, age, sex);

  const hair = sampleHair(rng, age, eth);
  const eye = sampleEye(rng, hair, eth);
  const edu = sampleEducation(rng, age, sex);
  const income = sampleIncome(rng, edu, age, sex);
  const available = sampleAvailable(rng, age, sex);
  const tattoos = rng() < tattooProb(age, edu, sex);
  const face = rng() < facePiercingProb(age, sex);
  const body = rng() < bodyPiercingProb(age, tattoos, sex);

  pop.age[i] = age;
  pop.heightTenthIn[i] = Math.round(heightIn * 10);
  pop.weightLb[i] = Math.round(weightLb);
  pop.ethnicity[i] = eth;
  pop.hair[i] = hair;
  pop.eye[i] = eye;
  pop.education[i] = edu;
  pop.incomeUsd[i] = Math.round(income / 100) * 100;

  if (sex === 'female') {
    pop.cup[i] = sampleCup(rng, bmi, weightLb);
    pop.penisLengthHundIn[i] = 0;
    pop.penisGirthHundIn[i] = 0;
  } else {
    pop.cup[i] = 0;
    // Under-18: still generate size for full-N universe; dating filter excludes them.
    const p = samplePenis(rng, heightIn);
    pop.penisLengthHundIn[i] = p.lengthHundIn;
    pop.penisGirthHundIn[i] = p.girthHundIn;
  }

  let flags = 0;
  if (tattoos) flags |= FLAG_TATTOOS;
  if (face) flags |= FLAG_FACE;
  if (body) flags |= FLAG_BODY;
  if (available) flags |= FLAG_AVAILABLE;
  pop.flags[i] = flags;
}

export function generatePopulationSync(
  city: CityConfig,
  sex: Sex = 'female',
  seed = seedFor(city.id, sex),
): PackedPop {
  const n = poolCount(city, sex);
  const pop = allocPop(city.id, sex, n);
  const rng = mulberry32(seed);
  const cdf = ethnicityCdf(city);
  for (let i = 0; i < n; i++) {
    writeOne(pop, i, rng, cdf, city.under18Pct, city.age65PlusPct, sex);
  }
  return pop;
}

export async function generatePopulationAsync(
  city: CityConfig,
  sex: Sex = 'female',
  seed = seedFor(city.id, sex),
  onProgress?: (done: number, total: number) => void,
): Promise<PackedPop> {
  const n = poolCount(city, sex);
  const pop = allocPop(city.id, sex, n);
  const rng = mulberry32(seed);
  const cdf = ethnicityCdf(city);
  const under18 = city.under18Pct;
  const age65 = city.age65PlusPct;
  for (let i = 0; i < n; ) {
    const end = Math.min(n, i + CHUNK);
    for (; i < end; i++) writeOne(pop, i, rng, cdf, under18, age65, sex);
    onProgress?.(i, n);
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return pop;
}

const cache = new Map<PoolKey, PackedPop>();
const inflight = new Map<PoolKey, Promise<PackedPop>>();

export function peekPopulation(
  cityId: CityId,
  sex: Sex = 'female',
): PackedPop | null {
  return cache.get(poolKey(cityId, sex)) ?? null;
}

export function getPopulationAsync(
  cityId: CityId,
  sex: Sex = 'female',
  onProgress?: (done: number, total: number) => void,
): Promise<PackedPop> {
  const key = poolKey(cityId, sex);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const city = getCity(cityId);
  const p = generatePopulationAsync(
    city,
    sex,
    seedFor(cityId, sex),
    onProgress,
  ).then(
    (pop) => {
      cache.set(key, pop);
      inflight.delete(key);
      return pop;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    },
  );
  inflight.set(key, p);
  return p;
}

/** Sync helper for tests / first paint if already cached. */
export function getPopulation(
  cityId: CityId = 'tyler_tx',
  sex: Sex = 'female',
): PackedPop {
  const key = poolKey(cityId, sex);
  const hit = cache.get(key);
  if (hit) return hit;
  const pop = generatePopulationSync(CITIES[cityId], sex, seedFor(cityId, sex));
  cache.set(key, pop);
  return pop;
}

export { ETHNICITY_INDEX, poolKey };
