import type { BreakdownItem, FilterResult, Filters, Woman } from './types';

type Dim =
  | 'age'
  | 'available'
  | 'height'
  | 'weight'
  | 'hair'
  | 'eye'
  | 'income'
  | 'education'
  | 'tattoos'
  | 'facePiercings'
  | 'bodyPiercings'
  | 'cup';

const TRAIT_DIMS: Dim[] = [
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
  // If `only` is set, evaluate just those dimensions (+ always nothing else).
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
  const active = TRAIT_DIMS.filter((d) => isActive(filters, d));
  const breakdown: BreakdownItem[] = [];

  for (let i = 0; i < active.length; i++) {
    const dim = active[i]!;

    // Alone: this trait + age + available
    const aloneSet = new Set<Dim>(['age', 'available', dim]);
    let alone = 0;
    for (const w of basePass) {
      if (matchesFilters(w, filters, { only: aloneSet })) alone++;
    }

    // Sequential: age + available + first i+1 active traits
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
