import type { CityId } from './cities';

export type { CityId };

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

/** Structure-of-arrays synthetic city-women population (1 row = 1 woman). */
export interface PackedPop {
  cityId: CityId;
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
  availableOnly: boolean;
  weightMinLb: number;
  weightMaxLb: number;
}

export interface FilterResult {
  availablePool: number;
  matching: number;
  percent: number;
  totalGenerated: number;
  /** Absolute matching women in this city (N = city female count, so 1:1). */
  cityScaledMatching: number;
  /** Absolute available (or age-band) women in this city. */
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
  availableOnly: true,
};
