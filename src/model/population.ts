import type {
  CupSize,
  Education,
  Ethnicity,
  EyeColor,
  HairColor,
  Woman,
} from './types';
import { clamp, lerp, mulberry32, randn, sampleCategorical } from './rng';
import {
  TYLER_ACS_ETHNICITY,
  TYLER_ACS_FEMALE_COUNT,
  TYLER_ADULT_SHARE,
} from './sources';

export const POPULATION_SIZE = 100_000;
export const POPULATION_SEED = 20260915;

/** Estimated Tyler adult (18+) women used to scale synthetic % → city counts. */
export const TYLER_ADULT_WOMEN_ESTIMATE = Math.round(
  TYLER_ACS_FEMALE_COUNT * TYLER_ADULT_SHARE,
);

/** Generate a large synthetic Tyler, TX adult women population with chained conditionals. */
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

  // Ethnicity first (Tyler ACS mutually exclusive shares) → hair/eyes.
  const ethnicity = sampleEthnicity(rng);

  // Height: NHANES-ish adult US women ~ 63.7 in, SD ~ 2.7 (national anthropometrics)
  const heightIn = clamp(63.7 + 2.7 * randn(rng), 54, 78);

  // BMI: overall mean ~28–29 for US adult women (NHANES era); log-ish right skew
  const bmiMean = 27.5 + 0.05 * (age - 35);
  const bmiSd = 6.2;
  let bmi = bmiMean + bmiSd * randn(rng);
  bmi = clamp(bmi, 16.5, 55);

  const heightM = heightIn * 0.0254;
  const weightKg = bmi * heightM * heightM;
  const weightLb = clamp(weightKg * 2.20462262, 80, 420);

  const hair = sampleHair(rng, age, ethnicity);
  const eye = sampleEye(rng, hair, ethnicity);
  const education = sampleEducation(rng, age);
  const incomeUsd = sampleIncome(rng, education, age);
  const available = sampleAvailable(rng, age);

  const tattoos = rng() < tattooProb(age, education);
  const facePiercings = rng() < facePiercingProb(age);
  const bodyPiercings = rng() < bodyPiercingProb(age, tattoos);

  const cup = sampleCup(rng, bmi, weightLb);

  return {
    age: Math.round(age),
    heightIn: Math.round(heightIn * 10) / 10,
    weightLb: Math.round(weightLb),
    bmi: Math.round(bmi * 10) / 10,
    ethnicity,
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
  const u = rng();
  if (u < 0.42) return 18 + rng() * 12; // 18–30
  if (u < 0.72) return 30 + rng() * 15; // 30–45
  if (u < 0.9) return 45 + rng() * 12; // 45–57
  return 57 + rng() * 8; // 57–65
}

function sampleEthnicity(rng: () => number): Ethnicity {
  return sampleCategorical(rng, [
    { value: 'white_nh', p: TYLER_ACS_ETHNICITY.white_nh },
    { value: 'black', p: TYLER_ACS_ETHNICITY.black },
    { value: 'hispanic', p: TYLER_ACS_ETHNICITY.hispanic },
    { value: 'asian', p: TYLER_ACS_ETHNICITY.asian },
    { value: 'other', p: TYLER_ACS_ETHNICITY.other },
  ]);
}

/** Mild ethnicity → hair base (appearance frequencies; not a stereotype caricature). */
function hairBaseForEthnicity(
  ethnicity: Ethnicity,
): { value: HairColor; p: number }[] {
  switch (ethnicity) {
    case 'white_nh':
      return [
        { value: 'brown', p: 0.42 },
        { value: 'blonde', p: 0.26 },
        { value: 'black', p: 0.08 },
        { value: 'red', p: 0.06 },
        { value: 'other', p: 0.1 },
        { value: 'gray', p: 0.08 },
      ];
    case 'black':
      return [
        { value: 'black', p: 0.68 },
        { value: 'brown', p: 0.18 },
        { value: 'other', p: 0.1 },
        { value: 'blonde', p: 0.015 },
        { value: 'red', p: 0.01 },
        { value: 'gray', p: 0.015 },
      ];
    case 'hispanic':
      return [
        { value: 'brown', p: 0.44 },
        { value: 'black', p: 0.36 },
        { value: 'other', p: 0.09 },
        { value: 'blonde', p: 0.05 },
        { value: 'red', p: 0.02 },
        { value: 'gray', p: 0.04 },
      ];
    case 'asian':
      return [
        { value: 'black', p: 0.82 },
        { value: 'brown', p: 0.1 },
        { value: 'other', p: 0.05 },
        { value: 'blonde', p: 0.01 },
        { value: 'red', p: 0.005 },
        { value: 'gray', p: 0.015 },
      ];
    case 'other':
    default:
      return [
        { value: 'brown', p: 0.4 },
        { value: 'black', p: 0.28 },
        { value: 'blonde', p: 0.12 },
        { value: 'other', p: 0.12 },
        { value: 'red', p: 0.03 },
        { value: 'gray', p: 0.05 },
      ];
  }
}

function sampleHair(
  rng: () => number,
  age: number,
  ethnicity: Ethnicity,
): HairColor {
  const grayBoost = clamp((age - 40) / 40, 0, 0.55);
  const base = hairBaseForEthnicity(ethnicity);
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

/** Mild ethnicity eye priors, then light hair→eye tilt. */
function eyeBaseForEthnicity(ethnicity: Ethnicity): Record<EyeColor, number> {
  switch (ethnicity) {
    case 'white_nh':
      return {
        brown: 0.34,
        blue: 0.3,
        hazel: 0.14,
        green: 0.12,
        gray: 0.05,
        other: 0.05,
      };
    case 'black':
      return {
        brown: 0.82,
        hazel: 0.07,
        other: 0.05,
        green: 0.025,
        blue: 0.02,
        gray: 0.015,
      };
    case 'hispanic':
      return {
        brown: 0.68,
        hazel: 0.12,
        other: 0.05,
        green: 0.06,
        blue: 0.06,
        gray: 0.03,
      };
    case 'asian':
      return {
        brown: 0.88,
        other: 0.05,
        hazel: 0.03,
        blue: 0.015,
        green: 0.015,
        gray: 0.01,
      };
    case 'other':
    default:
      return {
        brown: 0.55,
        hazel: 0.14,
        blue: 0.12,
        green: 0.09,
        other: 0.06,
        gray: 0.04,
      };
  }
}

function sampleEye(
  rng: () => number,
  hair: HairColor,
  ethnicity: Ethnicity,
): EyeColor {
  const base = eyeBaseForEthnicity(ethnicity);
  let brown = base.brown;
  let blue = base.blue;
  let hazel = base.hazel;
  let green = base.green;
  let gray = base.gray;
  let other = base.other;

  // Mild hair→eye tilt (same direction as genetics summaries; kept small).
  if (hair === 'black' || hair === 'brown') {
    brown += 0.08;
    blue -= 0.04;
    green -= 0.02;
    hazel -= 0.01;
  } else if (hair === 'blonde') {
    brown -= 0.1;
    blue += 0.08;
    green += 0.02;
    hazel += 0.01;
  } else if (hair === 'red') {
    brown -= 0.06;
    green += 0.04;
    hazel += 0.03;
    blue -= 0.01;
  } else if (hair === 'gray') {
    blue += 0.015;
    gray += 0.015;
    brown -= 0.02;
  }

  const items: { value: EyeColor; p: number }[] = [
    { value: 'brown', p: Math.max(0.02, brown) },
    { value: 'blue', p: Math.max(0.01, blue) },
    { value: 'hazel', p: Math.max(0.02, hazel) },
    { value: 'green', p: Math.max(0.01, green) },
    { value: 'gray', p: Math.max(0.005, gray) },
    { value: 'other', p: Math.max(0.01, other) },
  ];
  const sum = items.reduce((s, x) => s + x.p, 0);
  return sampleCategorical(
    rng,
    items.map((x) => ({ value: x.value, p: x.p / sum })),
  );
}

function sampleEducation(rng: () => number, age: number): Education {
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
  const base: Record<Education, number> = {
    less_than_hs: 22_000,
    hs: 32_000,
    some_college: 40_000,
    bachelors: 58_000,
    graduate: 78_000,
  };
  const ageFactor = clamp(0.7 + ((age - 22) / 40) * 0.55, 0.65, 1.25);
  const mean = base[education] * ageFactor;
  const sigma = 0.55;
  const logMean = Math.log(mean) - 0.5 * sigma * sigma;
  const income = Math.exp(logMean + sigma * randn(rng));
  return clamp(income, 0, 750_000);
}

function sampleAvailable(rng: () => number, age: number): boolean {
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
  if (age < 25) return 0.12;
  if (age < 30) return 0.09;
  if (age < 40) return 0.05;
  if (age < 50) return 0.02;
  return 0.01;
}

function bodyPiercingProb(age: number, tattoos: boolean): number {
  let p = age < 30 ? 0.14 : age < 40 ? 0.08 : 0.03;
  if (tattoos) p *= 1.7;
  return clamp(p, 0.01, 0.35);
}

const CUP_ORDER: CupSize[] = ['AA', 'A', 'B', 'C', 'D', 'DD', 'DDD+'];

function sampleCup(rng: () => number, bmi: number, weightLb: number): CupSize {
  const t = clamp((bmi - 18) / 22, 0, 1);
  const center = lerp(1.6, 4.6, t);
  const weightNudge = clamp((weightLb - 140) / 200, -0.3, 0.5);
  const mu = center + weightNudge;
  const sigma = 1.15;
  const z = mu + sigma * randn(rng);
  const idx = clamp(Math.round(z), 0, CUP_ORDER.length - 1);
  return CUP_ORDER[idx]!;
}

let cached: Woman[] | null = null;

export function getPopulation(): Woman[] {
  if (!cached) cached = generatePopulation();
  return cached;
}
