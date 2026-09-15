/** Citations and honesty labels for UI + README. Tyler city, TX frame. */

export type SourceKind = 'sourced' | 'modeled';

export interface SourceNote {
  id: string;
  trait: string;
  kind: SourceKind;
  summary: string;
  refs: string[];
}

/** ACS 2019–2023 / CensusDepth & US Civic Data — Tyler city, TX. */
export const TYLER_ACS_POPULATION = 107_718;
/** ACS female share (~51.9%) → ~55.9k women citywide. */
export const TYLER_ACS_FEMALE_PCT = 0.519;
export const TYLER_ACS_FEMALE_COUNT = Math.round(
  TYLER_ACS_POPULATION * TYLER_ACS_FEMALE_PCT,
); // ~55,905

/**
 * QuickFacts July 1 2025 estimate (newer total; ethnicity shares stay ACS).
 * Shown as a footnote only — not used for ethnicity or primary city pop UI.
 */
export const TYLER_QUICKFACTS_POP_2025 = 113_723;
export const TYLER_QUICKFACTS_FEMALE_PCT = 0.523;

/**
 * Adult (18+) share of city population from QuickFacts “persons under 18”
 * (23.3% → 76.7% 18+). Applied to ACS female count for city-scaled adult women.
 * Directional adult frame — not a separate ACS adult-women table.
 */
export const TYLER_UNDER_18_PCT_QUICKFACTS = 0.233;
export const TYLER_ADULT_SHARE = 1 - TYLER_UNDER_18_PCT_QUICKFACTS; // 0.767

/**
 * Mutually exclusive race/ethnicity shares (ACS / US Civic Data for Tyler).
 * Remainder folds AIAN (~0.1%), NHPI (~0%), Some other race (~0.4%),
 * and Two or more races (~3.1%) into “other” so shares sum to ~100%.
 */
export const TYLER_ACS_ETHNICITY = {
  white_nh: 0.47,
  black: 0.233,
  hispanic: 0.236,
  asian: 0.025,
  /** AIAN + NHPI + Some other + Two or more ≈ 3.6% */
  other: 0.036,
} as const;

export const SOURCE_NOTES: SourceNote[] = [
  {
    id: 'tyler_frame',
    trait: 'Region — Tyler, TX',
    kind: 'sourced',
    summary:
      `Default dating-pool frame is Tyler city, Texas. ACS 2019–2023 total population ≈ ${TYLER_ACS_POPULATION.toLocaleString()}; female ≈ ${(TYLER_ACS_FEMALE_PCT * 100).toFixed(1)}% (~${TYLER_ACS_FEMALE_COUNT.toLocaleString()} women citywide). The interactive pool is an adult (18+) subset. City-scaled headcounts apply the synthetic match rate to an estimated ~${Math.round(TYLER_ACS_FEMALE_COUNT * TYLER_ADULT_SHARE).toLocaleString()} adult women (ACS female count × QuickFacts 18+ share ${(TYLER_ADULT_SHARE * 100).toFixed(1)}%). QuickFacts also lists a July 1 2025 estimate of ${TYLER_QUICKFACTS_POP_2025.toLocaleString()} (female ${((TYLER_QUICKFACTS_FEMALE_PCT) * 100).toFixed(1)}%) — shown as a footnote only; ethnicity shares stay ACS-consistent.`,
    refs: [
      'U.S. Census Bureau ACS 2019–2023 5-year estimates — Tyler city, TX (via CensusDepth / US Civic Data)',
      'U.S. Census Bureau QuickFacts: Tyler city, Texas (July 1 2025 population estimate; % under 18; female %)',
      'https://uscivicdata.com/texas/smith-county/tyler',
      'https://www.census.gov/quickfacts/fact/table/tylercitytexas',
    ],
  },
  {
    id: 'ethnicity',
    trait: 'Ethnicity',
    kind: 'sourced',
    summary:
      `Mutually exclusive filter set for Tyler: White non-Hispanic ${(TYLER_ACS_ETHNICITY.white_nh * 100).toFixed(1)}%, Black / African American ~${(TYLER_ACS_ETHNICITY.black * 100).toFixed(1)}%, Hispanic or Latino (any race) ${(TYLER_ACS_ETHNICITY.hispanic * 100).toFixed(1)}%, Asian ${(TYLER_ACS_ETHNICITY.asian * 100).toFixed(1)}%, Two or more / other ${(TYLER_ACS_ETHNICITY.other * 100).toFixed(1)}% (folds AIAN ~0.1%, NHPI ~0%, Some other race ~0.4%, Two or more ~3.1% so shares sum ≈ 100%). Ethnicity is drawn first in the joint model and mildly conditions hair and eye color.`,
    refs: [
      'ACS / US Civic Data race & ethnicity table for Tyler city, TX (White NH, Black, Hispanic, Asian, and remainder categories)',
    ],
  },
  {
    id: 'height_weight',
    trait: 'Height & weight',
    kind: 'sourced',
    summary:
      'Adult women height ~N(63.7 in, 2.7 in); BMI distribution shaped to NHANES-era means. Weight derived from height × BMI so taller women are not independent of weight. Anthropometrics remain national NHANES-directional (city-specific height tables not used).',
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
      'Education shares approximate ACS / CPS female educational attainment (national directional). Personal income drawn conditional on education and age (higher education → higher income mean; age mild career effect).',
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
      '“Available” ≈ not currently married (never married + divorced + separated + widowed). P(married) rises with age using ACS-style marital status by age band. This is a rough dating-pool proxy — not “on apps” or “interested.”',
    refs: [
      'ACS / Census marital status by sex and age',
    ],
  },
  {
    id: 'hair',
    trait: 'Hair color',
    kind: 'sourced',
    summary:
      'Hair drawn conditional on ethnicity (mild appearance priors: e.g. blonde/red more common among White NH; black/brown dominant for Black, Hispanic, and Asian groups) with age-related gray boost. “Other” absorbs heavy dye / unclassified. Correlations are deliberately mild and transparent — not caricatures.',
    refs: [
      'Published population genetics / dermatology summaries of hair-color frequencies (aggregated); ethnicity conditioning is a simplified model layer on Tyler ACS ethnicity shares',
    ],
  },
  {
    id: 'eye',
    trait: 'Eye color',
    kind: 'sourced',
    summary:
      'Eye color uses mild ethnicity priors (lighter eyes more common among White NH; brown dominant elsewhere) plus a light hair→eye tilt (darker hair → higher P(brown eyes)). Not a full genotype model.',
    refs: [
      'Published eye-color frequency summaries; ethnicity and hair conditioning documented as mild model correlations',
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
    trait: 'Age',
    kind: 'sourced',
    summary:
      'Age band defaults 18–40; hard floor at 18 (adults only). Synthetic ages drawn 18–65 then filtered. Valorant rank: N/A (not modeled).',
    refs: [
      'Population frame: Tyler, TX adult women (synthetic, city-scaled)',
    ],
  },
];

export const DISCLAIMER =
  'Rough entertainment model for the Tyler, TX dating pool. Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone. Cup size, tattoos, and piercings are clearly labeled modeled estimates.';
