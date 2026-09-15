import { formatPercent } from '../model/filter';
import {
  adultEstimate,
  poolCount,
  sexLabel,
  type CityConfig,
} from '../model/cities';
import type { FilterResult, Sex } from '../model/types';

interface Props {
  result: FilterResult;
  city: CityConfig;
  sex: Sex;
  availableOnly: boolean;
  ageMin: number;
  ageMax: number;
}

export function HeroPercent({
  result,
  city,
  sex,
  availableOnly,
  ageMin,
  ageMax,
}: Props) {
  const pct = formatPercent(result.percent);
  const tone =
    result.percent >= 20 ? 'high' : result.percent >= 5 ? 'mid' : 'low';
  const people = sexLabel(sex);
  const denomLabel = availableOnly
    ? `${city.shortName} available ${people}`
    : `${city.shortName} ${people} in age band`;
  const n = poolCount(city, sex);
  const sexPct =
    sex === 'female'
      ? `female ${(city.femalePct * 100).toFixed(1)}%`
      : `male ${(city.malePct * 100).toFixed(1)}%`;

  return (
    <div className={`hero glass-panel tone-${tone}`}>
      <p className="hero-kicker">
        Share of {city.shortName} dating pool matching
      </p>
      <div className="hero-pct" aria-live="polite">
        <span className="hero-num">{pct}</span>
        <span className="hero-unit">%</span>
      </div>
      <p className="hero-sub">
        <strong>{result.matching.toLocaleString()}</strong> of{' '}
        <strong>{result.availablePool.toLocaleString()}</strong> {denomLabel}
        <span className="muted">
          {' '}
          · ages {ageMin}–{ageMax}
          {availableOnly ? ', unmarried' : ''} · {people}
        </span>
      </p>
      <p className="hero-note">
        Frame: {city.name} {city.nBasis === 'acs' ? 'ACS' : 'QuickFacts'} pop{' '}
        {city.totalPop.toLocaleString()} · {sexPct} →{' '}
        <strong>N = {n.toLocaleString()}</strong> city {people} (full synthetic =
        ACS {people} count). Adult 18+ ≈{' '}
        {adultEstimate(city, sex).toLocaleString()}.
        {city.quickfacts
          ? ` QuickFacts ${city.quickfacts.yearLabel} est. ${city.quickfacts.pop.toLocaleString()} (footnote).`
          : ''}{' '}
        {sex === 'male' ? `${city.maleNNote} ` : ''}
        Joint model — filters are correlated (not independent probabilities
        multiplied).
        {sex === 'male'
          ? ' Penis size is hypothetical (calcSD / Veale-style) — modeled.'
          : ''}
      </p>
    </div>
  );
}
