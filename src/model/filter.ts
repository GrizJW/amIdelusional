import type { BreakdownItem, FilterResult, Filters, PackedPop } from './types';
import {
  CUP_FROM_INDEX,
  EDUCATION_INDEX,
  ETHNICITY_INDEX,
  EYE_INDEX,
  FLAG_AVAILABLE,
  FLAG_BODY,
  FLAG_FACE,
  FLAG_TATTOOS,
  HAIR_INDEX,
} from './types';

type Dim =
  | 'age'
  | 'available'
  | 'height'
  | 'weight'
  | 'ethnicity'
  | 'hair'
  | 'eye'
  | 'income'
  | 'education'
  | 'tattoos'
  | 'facePiercings'
  | 'bodyPiercings'
  | 'cup';

const TRAIT_DIMS: Dim[] = [
  'ethnicity',
  'height',
  'weight',
  'hair',
  'eye',
  'education',
  'income',
  'tattoos',
  'facePiercings',
  'bodyPiercings',
  'cup',
];

const DIM_BIT: Record<Dim, number> = {
  age: 1 << 0,
  available: 1 << 1,
  height: 1 << 2,
  weight: 1 << 3,
  ethnicity: 1 << 4,
  hair: 1 << 5,
  eye: 1 << 6,
  income: 1 << 7,
  education: 1 << 8,
  tattoos: 1 << 9,
  facePiercings: 1 << 10,
  bodyPiercings: 1 << 11,
  cup: 1 << 12,
};

function maskOf(dims: readonly Dim[]): number {
  let m = 0;
  for (const d of dims) m |= DIM_BIT[d];
  return m;
}

function listMask(values: string[] | null, index: Record<string, number>): number {
  if (!values || values.length === 0) return 0xffff;
  let m = 0;
  for (const v of values) m |= 1 << index[v]!;
  return m;
}

function cupMask(values: Filters['cup']): number {
  if (!values || values.length === 0) return 0xffff;
  let m = 0;
  for (let i = 0; i < CUP_FROM_INDEX.length; i++) {
    if (values.includes(CUP_FROM_INDEX[i]!)) m |= 1 << i;
  }
  return m;
}

interface Compiled {
  ageMin: number;
  ageMax: number;
  heightMinT: number;
  heightMaxT: number;
  weightMin: number;
  weightMax: number;
  incomeMin: number;
  incomeMax: number;
  ethMask: number;
  hairMask: number;
  eyeMask: number;
  eduMask: number;
  cupMask: number;
  availableOnly: boolean;
  tattoos: Filters['tattoos'];
  face: Filters['facePiercings'];
  body: Filters['bodyPiercings'];
}

function compile(f: Filters): Compiled {
  return {
    ageMin: Math.max(18, f.ageMin),
    ageMax: Math.max(Math.max(18, f.ageMin), f.ageMax),
    heightMinT: Math.round(f.heightMinIn * 10),
    heightMaxT: Math.round(f.heightMaxIn * 10),
    weightMin: f.weightMinLb,
    weightMax: f.weightMaxLb,
    incomeMin: f.incomeMin,
    incomeMax: f.incomeMax,
    ethMask: listMask(f.ethnicity, ETHNICITY_INDEX),
    hairMask: listMask(f.hair, HAIR_INDEX),
    eyeMask: listMask(f.eye, EYE_INDEX),
    eduMask: listMask(f.education, EDUCATION_INDEX),
    cupMask: cupMask(f.cup),
    availableOnly: f.availableOnly,
    tattoos: f.tattoos,
    face: f.facePiercings,
    body: f.bodyPiercings,
  };
}

function pass(pop: PackedPop, i: number, c: Compiled, dimMask: number): boolean {
  if (dimMask & DIM_BIT.age) {
    const a = pop.age[i]!;
    if (a < c.ageMin || a > c.ageMax) return false;
  }
  if (dimMask & DIM_BIT.available) {
    if (c.availableOnly && (pop.flags[i]! & FLAG_AVAILABLE) === 0) return false;
  }
  if (dimMask & DIM_BIT.height) {
    const h = pop.heightTenthIn[i]!;
    if (h < c.heightMinT || h > c.heightMaxT) return false;
  }
  if (dimMask & DIM_BIT.weight) {
    const w = pop.weightLb[i]!;
    if (w < c.weightMin || w > c.weightMax) return false;
  }
  if (dimMask & DIM_BIT.ethnicity) {
    if ((c.ethMask & (1 << pop.ethnicity[i]!)) === 0) return false;
  }
  if (dimMask & DIM_BIT.hair) {
    if ((c.hairMask & (1 << pop.hair[i]!)) === 0) return false;
  }
  if (dimMask & DIM_BIT.eye) {
    if ((c.eyeMask & (1 << pop.eye[i]!)) === 0) return false;
  }
  if (dimMask & DIM_BIT.income) {
    const inc = pop.incomeUsd[i]!;
    if (inc < c.incomeMin || inc > c.incomeMax) return false;
  }
  if (dimMask & DIM_BIT.education) {
    if ((c.eduMask & (1 << pop.education[i]!)) === 0) return false;
  }
  if (dimMask & DIM_BIT.tattoos) {
    const on = (pop.flags[i]! & FLAG_TATTOOS) !== 0;
    if (c.tattoos === 'yes' && !on) return false;
    if (c.tattoos === 'no' && on) return false;
  }
  if (dimMask & DIM_BIT.facePiercings) {
    const on = (pop.flags[i]! & FLAG_FACE) !== 0;
    if (c.face === 'yes' && !on) return false;
    if (c.face === 'no' && on) return false;
  }
  if (dimMask & DIM_BIT.bodyPiercings) {
    const on = (pop.flags[i]! & FLAG_BODY) !== 0;
    if (c.body === 'yes' && !on) return false;
    if (c.body === 'no' && on) return false;
  }
  if (dimMask & DIM_BIT.cup) {
    if ((c.cupMask & (1 << pop.cup[i]!)) === 0) return false;
  }
  return true;
}

function isActive(f: Filters, dim: Dim): boolean {
  switch (dim) {
    case 'ethnicity':
      return !!(f.ethnicity && f.ethnicity.length > 0);
    case 'height':
      return f.heightMinIn > 54 || f.heightMaxIn < 78;
    case 'weight':
      return f.weightMinLb > 80 || f.weightMaxLb < 400;
    case 'hair':
      return !!(f.hair && f.hair.length > 0);
    case 'eye':
      return !!(f.eye && f.eye.length > 0);
    case 'income':
      return f.incomeMin > 0 || f.incomeMax < 500_000;
    case 'education':
      return !!(f.education && f.education.length > 0);
    case 'tattoos':
      return f.tattoos !== 'any';
    case 'facePiercings':
      return f.facePiercings !== 'any';
    case 'bodyPiercings':
      return f.bodyPiercings !== 'any';
    case 'cup':
      return !!(f.cup && f.cup.length > 0);
    default:
      return false;
  }
}

const LABELS: Record<string, string> = {
  ethnicity: 'Ethnicity',
  height: 'Height',
  weight: 'Weight',
  hair: 'Hair color',
  eye: 'Eye color',
  education: 'Education',
  income: 'Income',
  tattoos: 'Tattoos',
  facePiercings: 'Face piercings',
  bodyPiercings: 'Body piercings',
  cup: 'Cup size',
};

export function evaluate(population: PackedPop, f: Filters): FilterResult {
  const c = compile(f);
  const n = population.n;
  const baseMask = maskOf(['age', 'available']);
  const allMask = maskOf(['age', 'available', ...TRAIT_DIMS]);

  const baseIdx = new Uint32Array(n);
  let availablePool = 0;
  let matching = 0;

  for (let i = 0; i < n; i++) {
    if (!pass(population, i, c, baseMask)) continue;
    baseIdx[availablePool++] = i;
    if (pass(population, i, c, allMask)) matching++;
  }

  const percent = availablePool === 0 ? 0 : (matching / availablePool) * 100;

  const active = TRAIT_DIMS.filter((d) => isActive(f, d));
  const breakdown: BreakdownItem[] = [];

  for (let ai = 0; ai < active.length; ai++) {
    const dim = active[ai]!;
    const aloneMask = maskOf(['age', 'available', dim]);
    const seqMask = maskOf(['age', 'available', ...active.slice(0, ai + 1)]);
    let alone = 0;
    let seq = 0;
    for (let k = 0; k < availablePool; k++) {
      const i = baseIdx[k]!;
      if (pass(population, i, c, aloneMask)) alone++;
      if (pass(population, i, c, seqMask)) seq++;
    }
    breakdown.push({
      id: dim,
      label: LABELS[dim] ?? dim,
      alonePercent: availablePool === 0 ? 0 : (alone / availablePool) * 100,
      sequentialPercent: availablePool === 0 ? 0 : (seq / availablePool) * 100,
    });
  }

  return {
    availablePool,
    matching,
    percent,
    totalGenerated: n,
    cityScaledMatching: matching,
    cityScaledAvailable: availablePool,
    breakdown,
  };
}

export function formatPercent(p: number): string {
  if (p <= 0) return '0';
  if (p < 0.01) return '<0.01';
  if (p < 1) return p.toFixed(2);
  return p.toFixed(1);
}

export function inchesToFeetLabel(inches: number): string {
  const whole = Math.floor(inches / 12);
  const rem = Math.round(inches % 12);
  return `${whole}'${rem}"`;
}
