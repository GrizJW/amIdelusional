/** Citations and honesty labels for UI + README. */

export type SourceKind = 'sourced' | 'modeled';

export interface SourceNote {
  id: string;
  trait: string;
  kind: SourceKind;
  summary: string;
  refs: string[];
}

export const SOURCE_NOTES: SourceNote[] = [
  {
    id: 'height_weight',
    trait: 'Height & weight',
    kind: 'sourced',
    summary:
      'Adult US women height ~N(63.7 in, 2.7 in); BMI distribution shaped to NHANES-era means. Weight derived from height × BMI so taller women are not independent of weight.',
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
      'Education shares approximate ACS / CPS female educational attainment. Personal income drawn conditional on education and age (higher education → higher income mean; age mild career effect).',
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
      '“Available” ≈ not currently married (never married + divorced + separated + widowed). P(married) rises with age using ACS-style marital status by age band for US women. This is a rough dating-pool proxy — not “on apps” or “interested.”',
    refs: [
      'ACS / Census marital status by sex and age',
    ],
  },
  {
    id: 'hair',
    trait: 'Hair color',
    kind: 'sourced',
    summary:
      'Marginal frequencies for US-ish adult populations from published summaries of natural hair color prevalence (brown dominant; blonde/red rarer). “Other” absorbs heavy dye / unclassified.',
    refs: [
      'Published population genetics / dermatology summaries of hair-color frequencies in European-descent and multiethnic US samples (aggregated)',
    ],
  },
  {
    id: 'eye',
    trait: 'Eye color',
    kind: 'sourced',
    summary:
      'Marginals approximate published US/European eye-color frequencies (brown most common). Conditionally tilted by hair color (darker hair → higher P(brown eyes)) — a simple genetic correlation, not a full genotype model.',
    refs: [
      'Published eye-color frequency summaries (e.g. brown ≈ majority in US; blue/green/hazel minorities)',
    ],
  },
  {
    id: 'tattoos_piercings',
    trait: 'Tattoos & piercings',
    kind: 'modeled',
    summary:
      'MODELED ESTIMATES. Baseline rates informed by Harris Poll / IFOP-style survey headlines (tattoos rising among younger adults; piercings less precisely measured). Face/body piercings exclude earlobes. Age strongly shifts probability; not Census microdata.',
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
    trait: 'Region & age',
    kind: 'sourced',
    summary:
      'Default region: US women. Age band defaults 18–40; hard floor at 18 (adults only). Synthetic ages drawn 18–65 then filtered.',
    refs: [
      'Population frame: US adult women (synthetic)',
    ],
  },
];

export const DISCLAIMER =
  'Rough entertainment model. Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone. Cup size, tattoos, and piercings are clearly labeled modeled estimates.';
