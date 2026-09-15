import type { CityId } from './cities';

export type { CityId };

/** Dating-pool sex. Default women preserves prior UX. */
export type Sex = 'female' | 'male';

export type HairColor =
  | 'black'
  | 'brown'
  | 'blonde'
  | 'red'
  | 'gray'
  | 'other';

export type EyeColor =
  | 'brown'
  | 'blue'
  | 'hazel'
  | 'green'
  | 'gray'
  | 'other';

export type Education =
  | 'less_than_hs'
  | 'hs'
  | 'some_college'
  | 'bachelors'
  | 'graduate';

export type CupSize = 'AA' | 'A' | 'B' | 'C' | 'D' | 'DD' | 'DDD+';

/**
 * Mutually exclusive race/ethnicity filter set (ACS-style).
 * Asian = East/Southeast Asian (excludes Asian Indian).
 * Indian = Asian Indian / South Asian Indian — its own bucket.
 */
export type Ethnicity =
  | 'white_nh'
  | 'black'
  | 'hispanic'
  | 'asian'
  | 'indian'
  | 'other';

export const ETHNICITY_INDEX: Record<Ethnicity, number> = {
  white_nh: 0,
  black: 1,
  hispanic: 2,
  asian: 3,
  indian: 4,
  other: 5,
};

export const ETHNICITY_FROM_INDEX: Ethnicity[] = [
  'white_nh',
  'black',
  'hispanic',
  'asian',
  'indian',
  'other',
];

export const HAIR_INDEX: Record<HairColor, number> = {
  black: 0,
  brown: 1,
  blonde: 2,
  red: 3,
  gray: 4,
  other: 5,
};

export const HAIR_FROM_INDEX: HairColor[] = [
  'black',
  'brown',
  'blonde',
  'red',
  'gray',
  'other',
];

export const EYE_INDEX: Record<EyeColor, number> = {
  brown: 0,
  blue: 1,
  hazel: 2,
  green: 3,
  gray: 4,
  other: 5,
};

export const EYE_FROM_INDEX: EyeColor[] = [
  'brown',
  'blue',
  'hazel',
  'green',
  'gray',
  'other',
];

export const EDUCATION_INDEX: Record<Education, number> = {
  less_than_hs: 0,
  hs: 1,
  some_college: 2,
  bachelors: 3,
  graduate: 4,
};

export const EDUCATION_FROM_INDEX: Education[] = [
  'less_than_hs',
  'hs',
  'some_college',
  'bachelors',
  'graduate',
];

export const CUP_FROM_INDEX: CupSize[] = [
  'AA',
  'A',
  'B',
  'C',
  'D',
  'DD',
  'DDD+',
];

export const FLAG_TATTOOS = 1 << 0;
export const FLAG_FACE = 1 << 1;
export const FLAG_BODY = 1 << 2;
/** Available ≈ unmarried AND age ≥ 18. Minors never available. */
export const FLAG_AVAILABLE = 1 << 3;

/** Cache / pool key: city + sex (e.g. tyler_tx_female, houston_tx_male). */
export type PoolKey = `${CityId}_${Sex}`;

export function poolKey(cityId: CityId, sex: Sex): PoolKey {
  return `${cityId}_${sex}`;
}

/**
 * Structure-of-arrays synthetic city population (1 row = 1 person of selected sex).
 * Cup is meaningful for female only (zeros for male).
 * Penis length/girth are meaningful for male only (zeros for female) — hundredths of an inch.
 */
export interface PackedPop {
  cityId: CityId;
  sex: Sex;
  n: number;
  age: Uint8Array;
  heightTenthIn: Uint16Array;
  weightLb: Uint16Array;
  ethnicity: Uint8Array;
  hair: Uint8Array;
  eye: Uint8Array;
  education: Uint8Array;
  incomeUsd: Uint32Array;
  flags: Uint8Array;
  cup: Uint8Array;
  /** Erect length in hundredths of an inch (male only; 0 for female). */
  penisLengthHundIn: Uint16Array;
  /** Erect girth in hundredths of an inch (male only; 0 for female). */
  penisGirthHundIn: Uint16Array;
}

export interface Filters {
  ageMin: number;
  ageMax: number;
  heightMinIn: number;
  heightMaxIn: number;
  ethnicity: Ethnicity[] | null;
  hair: HairColor[] | null;
  eye: EyeColor[] | null;
  incomeMin: number;
  incomeMax: number;
  education: Education[] | null;
  tattoos: 'any' | 'yes' | 'no';
  facePiercings: 'any' | 'yes' | 'no';
  bodyPiercings: 'any' | 'yes' | 'no';
  cup: CupSize[] | null;
  region: CityId;
  sex: Sex;
  availableOnly: boolean;
  weightMinLb: number;
  weightMaxLb: number;
  /** Erect length filter (inches). Men only; ignored for women. */
  penisLengthMinIn: number;
  penisLengthMaxIn: number;
  /** Erect girth filter (inches). Men only; ignored for women. */
  penisGirthMinIn: number;
  penisGirthMaxIn: number;
}

export interface FilterResult {
  availablePool: number;
  matching: number;
  percent: number;
  totalGenerated: number;
  /** Absolute matching people in this city/sex pool (N = city sex count, so 1:1). */
  cityScaledMatching: number;
  /** Absolute available (or age-band) people in this city/sex pool. */
  cityScaledAvailable: number;
  breakdown: BreakdownItem[];
}

export interface BreakdownItem {
  id: string;
  label: string;
  /** Share of available pool that passes this filter alone (others unconstrained except age band + available). */
  alonePercent: number;
  /** Share remaining after this filter is applied in sequence (order as shown). */
  sequentialPercent: number;
}

export const ETHNICITY_OPTIONS: { value: Ethnicity; label: string }[] = [
  { value: 'white_nh', label: 'White (non-Hispanic)' },
  { value: 'black', label: 'Black / African American' },
  { value: 'hispanic', label: 'Hispanic or Latino' },
  { value: 'asian', label: 'Asian (East / Southeast)' },
  { value: 'indian', label: 'Indian (Asian Indian)' },
  { value: 'other', label: 'Two or more / other' },
];

export const HAIR_OPTIONS: { value: HairColor; label: string }[] = [
  { value: 'black', label: 'Black' },
  { value: 'brown', label: 'Brown' },
  { value: 'blonde', label: 'Blonde' },
  { value: 'red', label: 'Red / auburn' },
  { value: 'gray', label: 'Gray / white' },
  { value: 'other', label: 'Other / dyed' },
];

export const EYE_OPTIONS: { value: EyeColor; label: string }[] = [
  { value: 'brown', label: 'Brown' },
  { value: 'blue', label: 'Blue' },
  { value: 'hazel', label: 'Hazel' },
  { value: 'green', label: 'Green' },
  { value: 'gray', label: 'Gray' },
  { value: 'other', label: 'Other' },
];

export const EDUCATION_OPTIONS: { value: Education; label: string }[] = [
  { value: 'less_than_hs', label: 'Less than HS' },
  { value: 'hs', label: 'High school' },
  { value: 'some_college', label: 'Some college / AA' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'graduate', label: 'Graduate degree' },
];

export const CUP_OPTIONS: { value: CupSize; label: string }[] = [
  { value: 'AA', label: 'AA' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'DD', label: 'DD / E' },
  { value: 'DDD+', label: 'DDD+ / F+' },
];

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
];

/** Default penis length range (inches) — wide open; Veale mean ≈ 5.16". */
export const PENIS_LENGTH_RANGE = { min: 2.5, max: 9.5 } as const;
/** Default penis girth range (inches) — wide open; Veale mean ≈ 4.59". */
export const PENIS_GIRTH_RANGE = { min: 2.5, max: 7.5 } as const;

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 40,
  heightMinIn: 58,
  heightMaxIn: 72,
  weightMinLb: 90,
  weightMaxLb: 250,
  ethnicity: null,
  hair: null,
  eye: null,
  incomeMin: 0,
  incomeMax: 500_000,
  education: null,
  tattoos: 'any',
  facePiercings: 'any',
  bodyPiercings: 'any',
  cup: null,
  region: 'tyler_tx',
  sex: 'female',
  availableOnly: true,
  penisLengthMinIn: PENIS_LENGTH_RANGE.min,
  penisLengthMaxIn: PENIS_LENGTH_RANGE.max,
  penisGirthMinIn: PENIS_GIRTH_RANGE.min,
  penisGirthMaxIn: PENIS_GIRTH_RANGE.max,
};
