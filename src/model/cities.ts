/** City census frames. Cite; do not invent. N = ACS (or documented) count for selected sex. */

export type CityId = 'tyler_tx' | 'houston_tx' | 'dallas_tx';

export type EthnicityShareKey =
  | 'white_nh'
  | 'black'
  | 'hispanic'
  | 'asian'
  | 'indian'
  | 'other';

export interface EthnicityShares {
  /** White non-Hispanic */
  white_nh: number;
  /** Black / African American (ACS race-alone in mutually exclusive tables) */
  black: number;
  /** Hispanic or Latino (any race) */
  hispanic: number;
  /**
   * East / Southeast Asian — ACS Asian-alone minus Asian Indian.
   * Residual non-Indian Asian groups (e.g. Pakistani, Thai) stay here when
   * B02015 microtable cells were not fetched; documented per city.
   */
  asian: number;
  /** Asian Indian (Census detailed Asian group) — NOT folded into Asian. */
  indian: number;
  /** AIAN + NHPI + Some other + Two or more (remainder so shares ≈ 100%). */
  other: number;
}

export interface CityConfig {
  id: CityId;
  name: string;
  shortName: string;
  totalPop: number;
  femaleCount: number;
  femalePct: number;
  /** ACS male count = total − female (or documented male total). */
  maleCount: number;
  malePct: number;
  /** How male N was derived — cite; do not invent. */
  maleNNote: string;
  ethnicity: EthnicityShares;
  ethnicityNote: string;
  /**
   * Ethnicity shares are city-level (not sex-split). Census race/ethnicity
   * tables used here are typically not sex-crossed in our simple frames.
   */
  ethnicitySexAssumption: string;
  /** QuickFacts (or ACS) persons under 18 — used in age draws + adult display. */
  under18Pct: number;
  /** QuickFacts persons 65+ — used in age draws among all of selected sex. */
  age65PlusPct: number;
  nBasis: 'acs' | 'quickfacts';
  nBasisNote: string;
  sources: string[];
  quickfacts?: {
    pop: number;
    femalePct: number;
    yearLabel: string;
    note: string;
  };
}

const TYLER_ACS_POP = 107_718;
const TYLER_ACS_FEMALE_PCT = 0.519;
const TYLER_FEMALE = Math.round(TYLER_ACS_POP * TYLER_ACS_FEMALE_PCT); // 55,906
const TYLER_MALE = TYLER_ACS_POP - TYLER_FEMALE; // 51,812 (≈ 48.1%)

const HOUSTON_ACS_POP = 2_300_419;
/** ACS 2019–2023 female count (City of Houston / ACS) — female generator N. */
const HOUSTON_ACS_FEMALE_COUNT = 1_161_915;
/** Male = total − female; matches City of Houston district profile male total. */
const HOUSTON_MALE = HOUSTON_ACS_POP - HOUSTON_ACS_FEMALE_COUNT; // 1,138,504

const DALLAS_ACS_POP = 1_299_553;
const DALLAS_ACS_FEMALE_PCT = 0.502;
const DALLAS_FEMALE = Math.round(DALLAS_ACS_POP * DALLAS_ACS_FEMALE_PCT); // 652,376
const DALLAS_MALE = DALLAS_ACS_POP - DALLAS_FEMALE; // 647,177

export const CITIES: Record<CityId, CityConfig> = {
  tyler_tx: {
    id: 'tyler_tx',
    name: 'Tyler, TX',
    shortName: 'Tyler',
    totalPop: TYLER_ACS_POP,
    femalePct: TYLER_ACS_FEMALE_PCT,
    femaleCount: TYLER_FEMALE,
    maleCount: TYLER_MALE,
    malePct: TYLER_MALE / TYLER_ACS_POP, // ≈ 0.481
    maleNNote:
      'Male N = ACS total − female = 107,718 − 55,906 = 51,812 (female 51.9% → male ≈ 48.1%).',
    ethnicity: {
      white_nh: 0.47,
      black: 0.233,
      hispanic: 0.236,
      /** ACS Asian-alone 2.5% − CensusDepth Asian Indian 0.3% */
      asian: 0.022,
      indian: 0.003,
      other: 0.036,
    },
    ethnicityNote:
      'ACS / US Civic Data mutually exclusive: White NH 47.0%, Black ~23.3%, Hispanic 23.6%, Two+/other ~3.6% (AIAN ~0.1% + NHPI ~0% + Some other ~0.4% + Two or more ~3.1%). ACS Asian-alone 2.5% is split using CensusDepth ACS 2023 Asian subgroups (% of city pop): Asian Indian 0.3% → Indian; remainder 2.2% → Asian (East/Southeast — Filipino 0.5%, Vietnamese 0.5%, Chinese 0.3%, plus residual non-Indian Asian). Shares sum 100%.',
    ethnicitySexAssumption:
      'Ethnicity shares are city-level ACS (not sex-split). Same distribution applied to women and men pools.',
    under18Pct: 0.233,
    age65PlusPct: 0.17,
    nBasis: 'acs',
    nBasisNote:
      'Female generator N = ACS 2019–2023 female count (pop × 51.9% ≈ 55,906). Male N = total − female ≈ 51,812. Full city sex count, including under-18.',
    sources: [
      'U.S. Census Bureau ACS 2019–2023 5-year — Tyler city, TX (via CensusDepth / US Civic Data)',
      'CensusDepth Tyler Asian subgroups (ACS 5-year 2023): Filipino 0.5%, Vietnamese 0.5%, Indian 0.3%, Chinese 0.3%',
      'U.S. Census Bureau QuickFacts: Tyler city, Texas (Jul 1 2025 est. 113,723; female 52.3%; under 18 23.3%; 65+ 17.0%)',
      'https://uscivicdata.com/texas/smith-county/tyler',
      'https://censusdepth.com/cities/tyler-tx',
      'https://www.census.gov/quickfacts/fact/table/tylercitytexas',
    ],
    quickfacts: {
      pop: 113_723,
      femalePct: 0.523,
      yearLabel: 'Jul 1 2025',
      note: 'Footnote only — ethnicity and generator N stay ACS 2019–2023.',
    },
  },
  houston_tx: {
    id: 'houston_tx',
    name: 'Houston, TX',
    shortName: 'Houston',
    totalPop: HOUSTON_ACS_POP,
    femalePct: HOUSTON_ACS_FEMALE_COUNT / HOUSTON_ACS_POP, // ~50.5%
    femaleCount: HOUSTON_ACS_FEMALE_COUNT,
    maleCount: HOUSTON_MALE,
    malePct: HOUSTON_MALE / HOUSTON_ACS_POP,
    maleNNote:
      'Male N = ACS total − female = 2,300,419 − 1,161,915 = 1,138,504 (matches City of Houston district profile male total).',
    ethnicity: {
      white_nh: 0.236,
      black: 0.225,
      hispanic: 0.441,
      /** ACS Asian-alone 6.8% − CensusDepth Asian Indian 1.5% */
      asian: 0.053,
      indian: 0.015,
      other: 0.03,
    },
    ethnicityNote:
      'City of Houston / ACS 2019–2023 mutually exclusive: White NH 23.6%, Black 22.5%, Hispanic 44.1%, Other/Two+ ~3.0% (AIAN 0.1% + NHPI ~0% + Some other 0.4% + Two or more 2.5%). ACS Asian-alone 6.8% (156,983) is split using CensusDepth ACS 2023 Asian subgroups (% of city pop): Asian Indian 1.5% → Indian; remainder 5.3% → Asian (East/Southeast — Vietnamese 1.7%, Chinese 1.6%, Filipino 0.5%, Korean 0.3%, plus residual non-Indian Asian). Shares sum 100%.',
    ethnicitySexAssumption:
      'Ethnicity shares are city-level ACS (not sex-split). Same distribution applied to women and men pools.',
    under18Pct: 0.234,
    age65PlusPct: 0.123,
    nBasis: 'acs',
    nBasisNote:
      'Female generator N = ACS 2019–2023 female count 1,161,915 (~50.5% of 2,300,419). Male N = 1,138,504. Full city sex count, including under-18 — not adult-only, not a 100k sample.',
    sources: [
      'City of Houston Planning — Race/Ethnicity Demographics, ACS 2019–2023 5-year (total 2,300,419; White alone 23.6%; Black 22.5%; Asian-alone 6.8% / 156,983; Hispanic 44.1%)',
      'https://www.houstontx.gov/planning/Demographics/docs_pdfs/2023demographics/City-County-Metro-Race-Ethnicity-ACS-2023-Landscape.pdf',
      'CensusDepth Houston Asian subgroups (ACS 5-year 2023): Vietnamese 1.7%, Chinese 1.6%, Indian 1.5%, Filipino 0.5%, Korean 0.3%',
      'https://censusdepth.com/cities/houston-tx',
      'https://uscivicdata.com/texas/harris-county/houston',
      'U.S. Census Bureau QuickFacts: Houston city, Texas (Jul 1 2025 est. 2,397,315; female 50.6%; under 18 23.4%; 65+ 12.3%)',
      'https://www.census.gov/quickfacts/fact/table/houstoncitytexas',
    ],
    quickfacts: {
      pop: 2_397_315,
      femalePct: 0.506,
      yearLabel: 'Jul 1 2025',
      note: 'Footnote only — ethnicity and generator N stay ACS 2019–2023. Under-18 23.4% used for age mix / adult-available display.',
    },
  },
  dallas_tx: {
    id: 'dallas_tx',
    name: 'Dallas, TX',
    shortName: 'Dallas',
    totalPop: DALLAS_ACS_POP,
    femalePct: DALLAS_ACS_FEMALE_PCT,
    femaleCount: DALLAS_FEMALE,
    maleCount: DALLAS_MALE,
    malePct: DALLAS_MALE / DALLAS_ACS_POP,
    maleNNote:
      'Male N = ACS total − female = 1,299,553 − 652,376 = 647,177 (derived; not invented).',
    ethnicity: {
      white_nh: 0.282,
      black: 0.234,
      hispanic: 0.419,
      /** ACS Asian-alone 3.6% − CensusDepth Asian Indian 1.0% */
      asian: 0.026,
      indian: 0.01,
      other: 0.029,
    },
    ethnicityNote:
      'ACS 2019–2023 / US Civic Data mutually exclusive: White NH 28.2% (366,213), Black 23.4% (304,323), Hispanic 41.9% (545,002), Two+/other ~2.9% (AIAN 0.2% + NHPI 0.1% + Some other 0.2% + Two or more 2.4%). ACS Asian-alone 3.6% (47,201) is split using CensusDepth ACS 2023 Asian subgroups (% of city pop): Asian Indian 1.0% → Indian; remainder 2.6% → Asian (East/Southeast — Chinese 0.7%, Vietnamese 0.5%, Filipino 0.3%, Korean 0.2%, plus residual non-Indian Asian). Shares sum 100%. QuickFacts mutually exclusive-style (White NH 27.6%, Black 23.2%, Hispanic 42.6%, Asian 3.9%) is footnoted only.',
    ethnicitySexAssumption:
      'Ethnicity shares are city-level ACS (not sex-split). Same distribution applied to women and men pools.',
    under18Pct: 0.239,
    age65PlusPct: 0.118,
    nBasis: 'acs',
    nBasisNote:
      'Female generator N = ACS 2019–2023 female count (pop 1,299,553 × 50.2% ≈ 652,376). Male N = total − female ≈ 647,177. ACS 5-year microtable was fetched (CensusDepth / US Civic Data); not the QuickFacts Jul 2025 fallback.',
    sources: [
      'U.S. Census Bureau ACS 2019–2023 5-year — Dallas city, TX (via US Civic Data / CensusDepth): pop 1,299,553; female 50.2%',
      'US Civic Data race & ethnicity counts (White NH 366,213; Black 304,323; Asian 47,201; Hispanic 545,002)',
      'https://uscivicdata.com/texas/dallas-county/dallas',
      'CensusDepth Dallas Asian subgroups (ACS 5-year 2023): Indian 1.0%, Chinese 0.7%, Vietnamese 0.5%, Filipino 0.3%, Korean 0.2%',
      'https://censusdepth.com/cities/dallas-tx',
      'U.S. Census Bureau QuickFacts: Dallas city, Texas (Jul 1 2025 est. 1,329,491; female 50.0%; under 18 23.9%; 65+ 11.8%; White NH 27.6%; Black 23.2%; Hispanic 42.6%; Asian 3.9%)',
      'https://www.census.gov/quickfacts/fact/table/dallascitytexas',
    ],
    quickfacts: {
      pop: 1_329_491,
      femalePct: 0.5,
      yearLabel: 'Jul 1 2025',
      note: 'Footnote only. ACS 5-year was fetched so N is ACS-based, not QuickFacts. Under-18 23.9% used for age mix / adult-available display.',
    },
  },
};

export const CITY_LIST: CityConfig[] = [
  CITIES.tyler_tx,
  CITIES.houston_tx,
  CITIES.dallas_tx,
];

export function getCity(id: CityId): CityConfig {
  return CITIES[id];
}

export function adultShare(city: CityConfig): number {
  return 1 - city.under18Pct;
}

export function poolCount(
  city: CityConfig,
  sex: 'female' | 'male',
): number {
  return sex === 'female' ? city.femaleCount : city.maleCount;
}

export function adultEstimate(
  city: CityConfig,
  sex: 'female' | 'male',
): number {
  return Math.round(poolCount(city, sex) * adultShare(city));
}

/** @deprecated Prefer adultEstimate(city, 'female'). */
export function adultWomenEstimate(city: CityConfig): number {
  return adultEstimate(city, 'female');
}

export function adultMenEstimate(city: CityConfig): number {
  return adultEstimate(city, 'male');
}

export function sexLabel(sex: 'female' | 'male', plural = true): string {
  if (plural) return sex === 'female' ? 'women' : 'men';
  return sex === 'female' ? 'woman' : 'man';
}

export function ethnicityRows(
  city: CityConfig,
): { key: EthnicityShareKey; label: string; share: number }[] {
  const e = city.ethnicity;
  return [
    { key: 'white_nh', label: 'White (non-Hispanic)', share: e.white_nh },
    { key: 'black', label: 'Black / African American', share: e.black },
    { key: 'hispanic', label: 'Hispanic or Latino', share: e.hispanic },
    { key: 'asian', label: 'Asian (East / Southeast)', share: e.asian },
    { key: 'indian', label: 'Indian (Asian Indian)', share: e.indian },
    { key: 'other', label: 'Two or more / other', share: e.other },
  ];
}
