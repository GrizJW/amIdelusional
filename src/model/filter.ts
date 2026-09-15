import type { BreakdownItem, FilterResult, Filters, Woman } from './types';
import {
  POPULATION_SIZE,
  TYLER_ADULT_WOMEN_ESTIMATE,
} from './population';

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

export function matchesFilters(
  w: Woman,
  f: Filters,
  opts?: { only?: ReadonlySet<Dim> },
): boolean {
  const check = (dim: Dim) => !opts?.only || opts.only.has(dim);

  if (check('age')) {
    if (w.age < f.ageMin || w.age > f.ageMax) return false;
  }
  if (check('available')) {
    if (f.availableOnly && !w.available) return false;
  }
  if (check('height')) {
    if (w.heightIn < f.heightMinIn || w.heightIn > f.heightMaxIn) return false;
  }
  if (check('weight')) {
    if (w.weightLb < f.weightMinLb || w.weightLb > f.weightMaxLb) return false;
  }
  if (check('ethnicity')) {
    if (
      f.ethnicity &&
      f.ethnicity.length > 0 &&
      !f.ethnicity.includes(w.ethnicity)
    ) {
      return false;
    }
  }
  if (check('hair')) {
    if (f.hair && f.hair.length > 0 && !f.hair.includes(w.hair)) return false;
  }
  if (check('eye')) {
    if (f.eye && f.eye.length > 0 && !f.eye.includes(w.eye)) return false;
  }
  if (check('income')) {
    if (w.incomeUsd < f.incomeMin || w.incomeUsd > f.incomeMax) return false;
  }
  if (check('education')) {
    if (
      f.education &&
      f.education.length > 0 &&
      !f.education.includes(w.education)
    ) {
      return false;
    }
  }
  if (check('tattoos')) {
    if (f.tattoos === 'yes' && !w.tattoos) return false;
    if (f.tattoos === 'no' && w.tattoos) return false;
  }
  if (check('facePiercings')) {
    if (f.facePiercings === 'yes' && !w.facePiercings) return false;
    if (f.facePiercings === 'no' && w.facePiercings) return false;
  }
  if (check('bodyPiercings')) {
    if (f.bodyPiercings === 'yes' && !w.bodyPiercings) return false;
    if (f.bodyPiercings === 'no' && w.bodyPiercings) return false;
  }
  if (check('cup')) {
    if (f.cup && f.cup.length > 0 && !f.cup.includes(w.cup)) return false;
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

export function evaluate(population: Woman[], f: Filters): FilterResult {
  const filters: Filters = {
    ...f,
    ageMin: Math.max(18, f.ageMin),
    ageMax: Math.max(Math.max(18, f.ageMin), f.ageMax),
  };

  const baseOnly = new Set<Dim>(['age', 'available']);
  const allDims = new Set<Dim>(['age', 'available', ...TRAIT_DIMS]);

  let availablePool = 0;
  let matching = 0;
  const basePass: Woman[] = [];

  for (const w of population) {
    if (!matchesFilters(w, filters, { only: baseOnly })) continue;
    availablePool++;
    basePass.push(w);
    if (matchesFilters(w, filters, { only: allDims })) matching++;
  }

  const percent = availablePool === 0 ? 0 : (matching / availablePool) * 100;

  // Scale synthetic available share → Tyler adult women, then apply match %.
  const availableShare = population.length === 0 ? 0 : availablePool / population.length;
  const cityScaledAvailable = Math.round(
    TYLER_ADULT_WOMEN_ESTIMATE * availableShare,
  );
  const cityScaledMatching =
    availablePool === 0
      ? 0
      : Math.round(cityScaledAvailable * (matching / availablePool));

  const active = TRAIT_DIMS.filter((d) => isActive(filters, d));
  const breakdown: BreakdownItem[] = [];

  for (let i = 0; i < active.length; i++) {
    const dim = active[i]!;

    const aloneSet = new Set<Dim>(['age', 'available', dim]);
    let alone = 0;
    for (const w of basePass) {
      if (matchesFilters(w, filters, { only: aloneSet })) alone++;
    }

    const seqSet = new Set<Dim>(['age', 'available', ...active.slice(0, i + 1)]);
    let seq = 0;
    for (const w of basePass) {
      if (matchesFilters(w, filters, { only: seqSet })) seq++;
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
    totalGenerated: population.length,
    cityScaledMatching,
    cityScaledAvailable,
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

/** Re-export for UI that needs the frame size. */
export { POPULATION_SIZE, TYLER_ADULT_WOMEN_ESTIMATE };
