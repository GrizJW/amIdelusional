/** Citations and honesty labels for UI + README. */

import type { CityConfig } from './cities';
import { adultEstimate, poolCount, sexLabel } from './cities';
import type { Sex } from './types';
import {
  PENIS_HEIGHT_CORR,
  VEALE_ERECT_GIRTH_CM,
  VEALE_ERECT_LENGTH_CM,
} from './population';

export type SourceKind = 'sourced' | 'modeled';

export interface SourceNote {
  id: string;
  trait: string;
  kind: SourceKind;
  summary: string;
  refs: string[];
}

export function cityFrameNote(city: CityConfig, sex: Sex = 'female'): SourceNote {
  const qf = city.quickfacts;
  const qfBit = qf
    ? ` QuickFacts ${qf.yearLabel} est. ${qf.pop.toLocaleString()} (female ${(qf.femalePct * 100).toFixed(1)}%) — ${qf.note}`
    : '';
  const n = poolCount(city, sex);
  const people = sexLabel(sex);
  const sexPct =
    sex === 'female'
      ? `${(city.femalePct * 100).toFixed(1)}% female`
      : `${(city.malePct * 100).toFixed(1)}% male`;
  const maleBit =
    sex === 'male' ? ` ${city.maleNNote}` : ` Female N documented in city config.`;
  return {
    id: 'city_frame',
    trait: `Region — ${city.name} (${people})`,
    kind: 'sourced',
    summary: `Dating-pool frame is ${city.name} city limits, ${people} pool. ${city.nBasisNote}${maleBit} Synthetic N equals the city’s ${sexPct} count (${n.toLocaleString()} ${people}), including under-18; the dating “available” filter then drops minors and currently-married adults. Adult ${people} (18+) ≈ ${adultEstimate(city, sex).toLocaleString()} (${((1 - city.under18Pct) * 100).toFixed(1)}% of city ${people}, using under-18 share ${(city.under18Pct * 100).toFixed(1)}%). Match % and headcounts are 1:1 with this synthetic universe — not scaled from a 100k sample.${qfBit}`,
    refs: city.sources,
  };
}

export function cityEthnicityNote(city: CityConfig): SourceNote {
  return {
    id: 'ethnicity',
    trait: 'Ethnicity',
    kind: 'sourced',
    summary: `${city.ethnicityNote} ${city.ethnicitySexAssumption} Asian is East/Southeast Asian and explicitly excludes Asian Indian; Indian is its own mutually exclusive bucket (ACS detailed Asian group). Ethnicity is drawn first and mildly conditions hair and eye color (Indian uses South-Asian appearance priors, not East-Asian).`,
    refs: city.sources,
  };
}

export function traitNotesFor(sex: Sex): SourceNote[] {
  const heightNote: SourceNote = {
    id: 'height_weight',
    trait: 'Height & weight',
    kind: 'sourced',
    summary:
      sex === 'female'
        ? 'Adult women height ~N(63.7 in, 2.7 in); BMI distribution shaped to NHANES-era means. Weight derived from height × BMI so taller women are not independent of weight. Anthropometrics remain national NHANES-directional (city-specific height tables not used). Under-18 rows exist so N = all city women; they are excluded from the dating pool by the age ≥ 18 floor.'
        : 'Adult men height ~N(69.1 in, 2.9 in); BMI distribution shaped to NHANES-era male means (slightly higher mean BMI than women). Weight derived from height × BMI. National NHANES-directional — city-specific height tables not used. Under-18 rows exist so N = all city men; dating pool excludes age < 18.',
    refs: [
      'CDC / NHANES anthropometric reference data for US adults (height & weight by sex)',
      'Fryar et al., NCHS anthropometric reports',
    ],
  };

  const eduNote: SourceNote = {
    id: 'education_income',
    trait: 'Education & income',
    kind: 'sourced',
    summary:
      sex === 'female'
        ? 'Education shares approximate ACS / CPS female educational attainment (national directional). Personal income drawn conditional on education and age (higher education → higher income mean; age mild career effect). Minors draw less-than-HS and $0 income.'
        : 'Education shares approximate ACS / CPS male educational attainment (slightly lower BA+ share than women, directional). Personal income means slightly higher than the female schedule (ACS earnings-by-sex gap, directional — not dollar-exact). Minors: less-than-HS, $0.',
    refs: [
      'U.S. Census Bureau, American Community Survey (ACS) educational attainment',
      'CPS / ACS earnings by education and sex (directional, not dollar-exact for every cell)',
    ],
  };

  const maritalNote: SourceNote = {
    id: 'marital',
    trait: 'Availability (unmarried)',
    kind: 'sourced',
    summary:
      sex === 'female'
        ? '“Available” ≈ age ≥ 18 and not currently married (never married + divorced + separated + widowed). Minors are never available. P(married) rises with age using ACS-style marital status by age band. This is a rough dating-pool proxy — not “on apps” or “interested.”'
        : '“Available” ≈ age ≥ 18 and not currently married. Men’s P(married) is slightly lower at younger ages (later typical marriage age — ACS marital status by sex/age, directional). Minors never available. Dating-pool proxy only.',
    refs: ['ACS / Census marital status by sex and age'],
  };

  const common: SourceNote[] = [
    heightNote,
    eduNote,
    maritalNote,
    {
      id: 'hair',
      trait: 'Hair color',
      kind: 'sourced',
      summary:
        'Hair drawn conditional on ethnicity (mild appearance priors: blonde/red more common among White NH; black/brown dominant for Black, Hispanic, East/Southeast Asian, and Indian) with age-related gray boost. Same ethnicity→hair priors for men and women. “Other” absorbs heavy dye / unclassified. Correlations are deliberately mild and transparent — not caricatures. Indian is not given East-Asian hair priors.',
      refs: [
        'Published population genetics / dermatology summaries of hair-color frequencies (aggregated); ethnicity conditioning is a simplified model layer on city ACS ethnicity shares',
      ],
    },
    {
      id: 'eye',
      trait: 'Eye color',
      kind: 'sourced',
      summary:
        'Eye color uses mild ethnicity priors (lighter eyes more common among White NH; brown dominant for Black, Hispanic, East/Southeast Asian, and Indian) plus a light hair→eye tilt. Same for men and women. Not a full genotype model.',
      refs: [
        'Published eye-color frequency summaries; ethnicity and hair conditioning documented as mild model correlations',
      ],
    },
    {
      id: 'tattoos_piercings',
      trait: 'Tattoos & piercings',
      kind: 'modeled',
      summary:
        sex === 'female'
          ? 'MODELED ESTIMATES. Baseline rates informed by Harris Poll / IFOP-style survey headlines (tattoos rising among younger adults; piercings less precisely measured). Face/body piercings exclude earlobes. Age strongly shifts probability; not Census microdata. Minors draw none.'
          : 'MODELED ESTIMATES (male-adjusted). Tattoo base rates slightly higher than the female schedule (survey directional). Face and body piercings (excl. earlobes) use substantially lower male base rates. Age still shifts probability; not Census microdata. Minors draw none. Labeled modeled in the UI.',
      refs: [
        'Harris Poll / similar industry surveys on tattoo prevalence by age (directional)',
        'Piercing rates: sparse survey literature — treated as modeled; male rates down-weighted',
      ],
    },
  ];

  if (sex === 'female') {
    common.push({
      id: 'cup',
      trait: 'Cup size',
      kind: 'modeled',
      summary:
        'MODELED ESTIMATES — not Census/NHANES. Women only. Ordered categorical cup sizes with probabilities that shift toward larger cups as BMI increases (weight/height → BMI → cup). Lingerie industry size charts vary wildly; treat as entertainment correlation only. Hidden when Men pool is selected (BMI→cup irrelevant for men).',
      refs: [
        'No authoritative government distribution; bra-size surveys are marketing/self-report biased',
      ],
    });
  } else {
    common.push({
      id: 'penis_size',
      trait: 'Penis size (erect length & girth)',
      kind: 'modeled',
      summary: `MODELED / HYPOTHETICAL — Men only. Not Census, not medical advice, not a measurement of anyone. Erect length and girth drawn from a bivariate-ish normal using Veale et al. 2015 researcher-measured meta-analysis aggregates (the same family of study means calcSD uses for percentiles): length μ=${VEALE_ERECT_LENGTH_CM.mean} cm (σ=${VEALE_ERECT_LENGTH_CM.sd}); girth μ=${VEALE_ERECT_GIRTH_CM.mean} cm (σ=${VEALE_ERECT_GIRTH_CM.sd}). Mild correlation with height (r≈${PENIS_HEIGHT_CORR}; Veale reported length×height r≈0.2–0.6 — we keep the weak end) plus mild length↔girth residual correlation. No ethnicity×size claims. Filters are inches (cm shown). calcSD: https://calcsd.com / https://www.calcsd.info`,
      refs: [
        'Veale D, Miles S, Bramley S, Muir G, Hodsoll J. Am I normal? A systematic review and construction of nomograms for flaccid and erect penis length and circumference in up to 15,521 men. BJU Int. 2015;115:978–986. https://doi.org/10.1111/bju.13010',
        'calcSD penis size percentile calculator (normal-distribution percentiles over published study aggregates): https://calcsd.com — also https://www.calcsd.info',
      ],
    });
  }

  common.push({
    id: 'region_age',
    trait: 'Age',
    kind: 'sourced',
    summary: `Synthetic ages cover all city ${sexLabel(sex)} (0–90), with under-18 and 65+ shares from QuickFacts (city-specific). Working-age mix is a modeled younger-adult skew. Dating filters default 18–40 with a hard floor at 18. Valorant rank: N/A (not modeled).`,
    refs: [
      `Population frame: selected city ${sexLabel(sex)} count (synthetic, 1:1 with ACS N)`,
      'QuickFacts percent under 18 and 65+ by city',
    ],
  });

  return common;
}

/** @deprecated Prefer traitNotesFor(sex). */
export const TRAIT_NOTES: SourceNote[] = traitNotesFor('female');

export function sourceNotesFor(
  city: CityConfig,
  sex: Sex = 'female',
): SourceNote[] {
  return [cityFrameNote(city, sex), cityEthnicityNote(city), ...traitNotesFor(sex)];
}

export function disclaimerFor(city: CityConfig, sex: Sex = 'female'): string {
  const people = sexLabel(sex);
  const n = poolCount(city, sex);
  const extra =
    sex === 'male'
      ? ' Penis size is a hypothetical calcSD/Veale-style model — clearly labeled modeled.'
      : ' Cup size, tattoos, and piercings are clearly labeled modeled estimates.';
  return `Rough entertainment model for the ${city.name} ${people} dating pool. Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone.${extra} Generator N = all ${n.toLocaleString()} city ${people}.`;
}

export const DISCLAIMER =
  'Rough entertainment model for a selectable Texas city dating pool (Tyler / Houston / Dallas; Women or Men). Filters use a synthetic joint distribution with correlations — not a census microdata query, not medical advice, and not a judgment about anyone. Cup size (women), penis size (men), tattoos, and piercings are clearly labeled modeled estimates.';

/** Back-compat aliases used by older copy. */
export { CITIES } from './cities';
