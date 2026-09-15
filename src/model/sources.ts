/** Citations and honesty labels for UI + README. */

import type { CityConfig } from './cities';
import { adultWomenEstimate } from './cities';

export type SourceKind = 'sourced' | 'modeled';

export interface SourceNote {
  id: string;
  trait: string;
  kind: SourceKind;
  summary: string;
  refs: string[];
}

export function cityFrameNote(city: CityConfig): SourceNote {
  const qf = city.quickfacts;
  const qfBit = qf
    ? ` QuickFacts ${qf.yearLabel} est. ${qf.pop.toLocaleString()} (female ${(qf.femalePct * 100).toFixed(1)}%) — ${qf.note}`
    : '';
  return {
    id: 'city_frame',
    trait: `Region — ${city.name}`,
    kind: 'sourced',
    summary: `Dating-pool frame is ${city.name} city limits. ${city.nBasisNote} Synthetic N equals the city’s female count (${city.femaleCount.toLocaleString()} women), including under-18; the dating “available” filter then drops minors and currently-married adults. Adult women (18+) ≈ ${adultWomenEstimate(city).toLocaleString()} (${((1 - city.under18Pct) * 100).toFixed(1)}% of city women, using under-18 share ${(city.under18Pct * 100).toFixed(1)}%). Match % and headcounts are 1:1 with this synthetic universe — not scaled from a 100k sample.${qfBit}`,
    refs: city.sources,
  };
}

export function cityEthnicityNote(city: CityConfig): SourceNote {
  return {
    id: 'ethnicity',
    trait: 'Ethnicity',
    kind: 'sourced',
    summary: `${city.ethnicityNote} Asian is East/Southeast Asian and explicitly excludes Asian Indian; Indian is its own mutually exclusive bucket (ACS detailed Asian group). Ethnicity is drawn first and mildly conditions hair and eye color (Indian uses South-Asian appearance priors, not East-Asian).`,
    refs: city.sources,
  };
}

export const TRAIT_NOTES: SourceNote[] = [
  {
    id: 'height_weight',
    trait: 'Height & weight',
    kind: 'sourced',
    summary:
      'Adult women height ~N(63.7 in, 2.7 in); BMI distribution shaped to NHANES-era means. Weight derived from height × BMI so taller women are not independent of weight. Anthropometrics remain national NHANES-directional (city-specific height tables not used). Under-18 rows exist so N = all city women; they are excluded from the dating pool by the age ≥ 18 floor.',
    refs: [
      'CDC / NHANES anthropometric reference data for US adults (height & weight by sex)',
      'Fryar et al., NCHS anthropometric reports',
    ],
  },
  {
    id: 'education_income',
    trait: 'Education & income',
    kind: 'sourced',
    summary:
      'Education shares approximate ACS / CPS female educational attainment (national directional). Personal income drawn conditional on education and age (higher education → higher income mean; age mild career effect). Minors draw less-than-HS and $0 income.',
    refs: [
      'U.S. Census Bureau, American Community Survey (ACS) educational attainment',
      'CPS / ACS earnings by education (directional, not dollar-exact for every cell)',
    ],
  },
  {
    id: 'marital',
    trait: 'Availability (unmarried)',
    kind: 'sourced',
    summary:
      '“Available” ≈ age ≥ 18 and not currently married (never married + divorced + separated + widowed). Minors are never available. P(married) rises with age using ACS-style marital status by age band. This is a rough dating-pool proxy — not “on apps” or “interested.”',
    refs: ['ACS / Census marital status by sex and age'],
  },
  {
    id: 'hair',
    trait: 'Hair color',
    kind: 'sourced',
    summary:
      'Hair drawn conditional on ethnicity (mild appearance priors: blonde/red more common among White NH; black/brown dominant for Black, Hispanic, East/Southeast Asian, and Indian) with age-related gray boost. “Other” absorbs heavy dye / unclassified. Correlations are deliberately mild and transparent — not caricatures. Indian is not given East-Asian hair priors.',
    refs: [
      'Published population genetics / dermatology summaries of hair-color frequencies (aggregated); ethnicity conditioning is a simplified model layer on city ACS ethnicity shares',
    ],
  },
  {
    id: 'eye',
    trait: 'Eye color',
    kind: 'sourced',
    summary:
      'Eye color uses mild ethnicity priors (lighter eyes more common among White NH; brown dominant for Black, Hispanic, East/Southeast Asian, and Indian) plus a light hair→eye tilt. Not a full genotype model.',
    refs: [
      'Published eye-color frequency summaries; ethnicity and hair conditioning documented as mild model correlations',
    ],
  },
  {
    id: 'tattoos_piercings',
    trait: 'Tattoos & piercings',
    kind: 'modeled',
    summary:
      'MODELED ESTIMATES. Baseline rates informed by Harris Poll / IFOP-style survey headlines (tattoos rising among younger adults; piercings less precisely measured). Face/body piercings exclude earlobes. Age strongly shifts probability; not Census microdata. Minors draw none.',
    refs: [
      'Harris Poll / similar industry surveys on tattoo prevalence by age (directional)',
      'Piercing rates: sparse survey literature — treated as modeled',
    ],
  },
  {
    id: 'cup',
    trait: 'Cup size',
    kind: 'modeled',
    summary:
      'MODELED ESTIMATES — not Census/NHANES. Ordered categorical cup sizes with probabilities that shift toward larger cups as BMI increases (weight/height → BMI → cup). Lingerie industry size charts vary wildly; treat as entertainment correlation only.',
    refs: [
      'No authoritative government distribution; bra-size surveys are marketing/self-report biased',
    ],
  },
  {
    id: 'region_age',
    trait: 'Age',
    kind: 'sourced',
    summary:
      'Synthetic ages cover all city women (0–90), with under-18 and 65+ shares from QuickFacts (city-specific). Working-age mix is a modeled younger-adult skew. Dating filters default 18–40 with a hard floor at 18. Valorant rank: N/A (not modeled).',
    refs: [
      'Population frame: selected city female count (synthetic, 1:1 with ACS/QuickFacts N)',
      'QuickFacts percent under 18 and 65+ by city',
    ],
  },
];

export function sourceNotesFor(city: CityConfig): SourceNote[] {
  return [cityFrameNote(city), cityEthnicityNote(city), ...TRAIT_NOTES];
}

export function disclaimerFor(city: CityConfig): string {
  return `Rough entertainment model for the ${city.name} dating pool. Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone. Cup size, tattoos, and piercings are clearly labeled modeled estimates. Generator N = all ${city.femaleCount.toLocaleString()} city women.`;
}

export const DISCLAIMER =
  'Rough entertainment model for a selectable Texas city dating pool (Tyler / Houston / Dallas). Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone. Cup size, tattoos, and piercings are clearly labeled modeled estimates.';

/** Back-compat aliases used by older copy. */
export { CITIES } from './cities';
