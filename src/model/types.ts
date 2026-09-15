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

/** Mutually exclusive race/ethnicity filter set (ACS-style for Tyler city). */
export type Ethnicity =
  | 'white_nh'
  | 'black'
  | 'hispanic'
  | 'asian'
  | 'other';

export interface Woman {
  age: number;
  heightIn: number;
  weightLb: number;
  bmi: number;
  ethnicity: Ethnicity;
  hair: HairColor;
  eye: EyeColor;
  education: Education;
  incomeUsd: number;
  tattoos: boolean;
  facePiercings: boolean;
  bodyPiercings: boolean;
  cup: CupSize;
  /** Approximate dating availability: unmarried (never married, divorced, separated, widowed). */
  available: boolean;
}

export interface Filters {
  ageMin: number;
  ageMax: number;
  heightMinIn: number;
  heightMaxIn: number;
  weightMinLb: number;
  weightMaxLb: number;
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
  region: 'tyler_tx';
  availableOnly: boolean;
}

export interface FilterResult {
  availablePool: number;
  matching: number;
  percent: number;
  totalGenerated: number;
  /** City-scaled estimate of available adult women in Tyler matching filters. */
  cityScaledMatching: number;
  /** City-scaled estimate of Tyler adult available women in the age band. */
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
  { value: 'asian', label: 'Asian' },
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
