import type { CupSize, Education, EyeColor, HairColor, Woman } from './types';
import { clamp, lerp, mulberry32, randn, sampleCategorical } from './rng';

export const POPULATION_SIZE = 100_000;
export const POPULATION_SEED = 20260915;

/** Generate a large synthetic US adult women population with chained conditionals. */
export function generatePopulation(
  n = POPULATION_SIZE,
  seed = POPULATION_SEED,
): Woman[] {
  const rng = mulberry32(seed);
  const out: Woman[] = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = generateOne(rng);
  }
  return out;
}

function generateOne(rng: () => number): Woman {
  // Age 18–65 (adults only). Mild skew toward younger adults.
  const age = sampleAge(rng);

  // Height: NHANES-ish adult US women ~ 63.7 in, SD ~ 2.7
  const heightIn = clamp(63.7 + 2.7 * randn(rng), 54, 78);

  // BMI: overall mean ~28–29 for US adult women (NHANES era); log-ish right skew
  // Mild age effect: BMI drifts up slightly with age.
  const bmiMean = 27.5 + 0.05 * (age - 35);
  const bmiSd = 6.2;
  let bmi = bmiMean + bmiSd * randn(rng);
  // Soft floor/ceiling; allow overweight/obesity mass
  bmi = clamp(bmi, 16.5, 55);

  const heightM = heightIn * 0.0254;
  const weightKg = bmi * heightM * heightM;
  const weightLb = clamp(weightKg * 2.20462262, 80, 420);

  const hair = sampleHair(rng, age);
  const eye = sampleEye(rng, hair);
  const education = sampleEducation(rng, age);
  const incomeUsd = sampleIncome(rng, education, age);
  const available = sampleAvailable(rng, age);

  // Body mods: younger → more likely
  const tattoos = rng() < tattooProb(age, education);
  const facePiercings = rng() < facePiercingProb(age);
  const bodyPiercings = rng() < bodyPiercingProb(age, tattoos);

  const cup = sampleCup(rng, bmi, weightLb);

  return {
    age: Math.round(age),
    heightIn: Math.round(heightIn * 10) / 10,
    weightLb: Math.round(weightLb),
    bmi: Math.round(bmi * 10) / 10,
    hair,
    eye,
    education,
    incomeUsd: Math.round(incomeUsd / 100) * 100,
    tattoos,
    facePiercings,
    bodyPiercings,
    cup,
    available,
  };
}

function sampleAge(rng: () => number): number {
  // Mixture: more mass 18–34, tapering to 65
  const u = rng();
  if (u < 0.42) return 18 + rng() * 12; // 18–30
  if (u < 0.72) return 30 + rng() * 15; // 30–45
  if (u < 0.9) return 45 + rng() * 12; // 45–57
  return 57 + rng() * 8; // 57–65
}

function sampleHair(rng: () => number, age: number): HairColor {
  // Approximate natural + appearance frequencies for US women.
  // Gray rises with age.
  const grayBoost = clamp((age - 40) / 40, 0, 0.55);
  const base: { value: HairColor; p: number }[] = [
    { value: 'brown', p: 0.45 },
    { value: 'black', p: 0.22 },
    { value: 'blonde', p: 0.16 },
    { value: 'red', p: 0.04 },
    { value: 'other', p: 0.08 },
    { value: 'gray', p: 0.05 },
  ];
  const adjusted = base.map((x) => {
    if (x.value === 'gray') return { ...x, p: x.p + grayBoost };
    return { ...x, p: x.p * (1 - grayBoost * 0.85) };
  });
  const sum = adjusted.reduce((s, x) => s + x.p, 0);
  return sampleCategorical(
    rng,
    adjusted.map((x) => ({ value: x.value, p: x.p / sum })),
  );
}

function sampleEye(rng: () => number, hair: HairColor): EyeColor {
  // Marginals ~ brown majority; conditional tilt by hair.
  let brown = 0.55;
  let blue = 0.18;
  let hazel = 0.12;
  let green = 0.09;
  let gray = 0.03;
  let other = 0.03;

  if (hair === 'black' || hair === 'brown') {
    brown += 0.12;
    blue -= 0.06;
    green -= 0.03;
    hazel -= 0.02;
  } else if (hair === 'blonde') {
    brown -= 0.15;
    blue += 0.12;
    green += 0.03;
    hazel += 0.02;
  } else if (hair === 'red') {
    brown -= 0.08;
    green += 0.06;
    hazel += 0.04;
    blue -= 0.02;
  } else if (hair === 'gray') {
    // older — slight shift toward lighter eyes already set at birth; mild
    blue += 0.02;
    gray += 0.02;
    brown -= 0.03;
  }

  const items: { value: EyeColor; p: number }[] = [
    { value: 'brown', p: Math.max(0.02, brown) },
    { value: 'blue', p: Math.max(0.02, blue) },
    { value: 'hazel', p: Math.max(0.02, hazel) },
    { value: 'green', p: Math.max(0.02, green) },
    { value: 'gray', p: Math.max(0.01, gray) },
    { value: 'other', p: Math.max(0.01, other) },
  ];
  const sum = items.reduce((s, x) => s + x.p, 0);
  return sampleCategorical(
    rng,
    items.map((x) => ({ value: x.value, p: x.p / sum })),
  );
}

function sampleEducation(rng: () => number, age: number): Education {
  // ACS-ish female attainment; older cohorts slightly less BA+
  const young = age < 35;
  const items: { value: Education; p: number }[] = young
    ? [
        { value: 'less_than_hs', p: 0.07 },
        { value: 'hs', p: 0.24 },
        { value: 'some_college', p: 0.28 },
        { value: 'bachelors', p: 0.27 },
        { value: 'graduate', p: 0.14 },
      ]
    : [
        { value: 'less_than_hs', p: 0.09 },
        { value: 'hs', p: 0.28 },
        { value: 'some_college', p: 0.27 },
        { value: 'bachelors', p: 0.23 },
        { value: 'graduate', p: 0.13 },
      ];
  return sampleCategorical(rng, items);
}

function sampleIncome(rng: () => number, education: Education, age: number): number {
  // Conditional means (personal income, directional ACS/CPS)
  const base: Record<Education, number> = {
    less_than_hs: 22_000,
    hs: 32_000,
    some_college: 40_000,
    bachelors: 58_000,
    graduate: 78_000,
  };
  const ageFactor = clamp(0.7 + ((age - 22) / 40) * 0.55, 0.65, 1.25);
  const mean = base[education] * ageFactor;
  // Lognormal-ish
  const sigma = 0.55;
  const logMean = Math.log(mean) - 0.5 * sigma * sigma;
  const income = Math.exp(logMean + sigma * randn(rng));
  return clamp(income, 0, 750_000);
}

function sampleAvailable(rng: () => number, age: number): boolean {
  // P(currently married) rises with age — ACS-shaped for US women.
  // Available = not currently married.
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

function tattooProb(age: number, education: Education): number {
  // Harris-ish: younger adults much higher; modeled.
  let p = 0.3;
  if (age < 25) p = 0.42;
  else if (age < 30) p = 0.4;
  else if (age < 40) p = 0.35;
  else if (age < 50) p = 0.22;
  else p = 0.12;
  if (education === 'graduate') p *= 0.85;
  if (education === 'less_than_hs') p *= 1.05;
  return clamp(p, 0.05, 0.55);
}

function facePiercingProb(age: number): number {
  // Excl. ears — nose/lip/brow etc. Modeled; young skew.
  if (age < 25) return 0.12;
  if (age < 30) return 0.09;
  if (age < 40) return 0.05;
  if (age < 50) return 0.02;
  return 0.01;
}

function bodyPiercingProb(age: number, tattoos: boolean): number {
  // Mild positive association with tattoos (lifestyle clustering).
  let p = age < 30 ? 0.14 : age < 40 ? 0.08 : 0.03;
  if (tattoos) p *= 1.7;
  return clamp(p, 0.01, 0.35);
}

const CUP_ORDER: CupSize[] = ['AA', 'A', 'B', 'C', 'D', 'DD', 'DDD+'];

function sampleCup(rng: () => number, bmi: number, weightLb: number): CupSize {
  // MODELED: shift distribution toward larger cups as BMI / weight rises.
  // Index center moves from ~B at BMI 20 toward D/DD at BMI 35+.
  const t = clamp((bmi - 18) / 22, 0, 1);
  const center = lerp(1.6, 4.6, t); // index into CUP_ORDER
  // Extra nudge from absolute weight (for a given BMI, heavier ≈ taller → mild)
  const weightNudge = clamp((weightLb - 140) / 200, -0.3, 0.5);
  const mu = center + weightNudge;
  const sigma = 1.15;
  const z = mu + sigma * randn(rng);
  const idx = clamp(Math.round(z), 0, CUP_ORDER.length - 1);
  return CUP_ORDER[idx]!;
}

/** Singleton cache so UI doesn't regenerate 100k rows every render. */
let cached: Woman[] | null = null;

export function getPopulation(): Woman[] {
  if (!cached) cached = generatePopulation();
  return cached;
}
