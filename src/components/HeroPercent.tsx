import { formatPercent } from '../model/filter';
import { adultWomenEstimate, type CityConfig } from '../model/cities';
import type { FilterResult } from '../model/types';

interface Props {
  result: FilterResult;
  city: CityConfig;
  availableOnly: boolean;
  ageMin: number;
  ageMax: number;
}

export function HeroPercent({ result, city, availableOnly, ageMin, ageMax }: Props) {
  const pct = formatPercent(result.percent);
  const tone =
    result.percent >= 20 ? 'high' : result.percent >= 5 ? 'mid' : 'low';
  const denomLabel = availableOnly
    ? `${city.shortName} available women`
    : `${city.shortName} women in age band`;

  return (
    <div className={`hero glass-panel tone-${tone}`}>
      <p className="hero-kicker">Share of {city.shortName} dating pool matching</p>
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
          {availableOnly ? ', unmarried' : ''}
        </span>
      </p>
      <p className="hero-note">
        Frame: {city.name} {city.nBasis === 'acs' ? 'ACS' : 'QuickFacts'} pop{' '}
        {city.totalPop.toLocaleString()} · female {(city.femalePct * 100).toFixed(1)}% →{' '}
        <strong>N = {city.femaleCount.toLocaleString()}</strong> city women (full
        synthetic = ACS female count). Adult 18+ ≈ {adultWomenEstimate(city).toLocaleString()}.
        {city.quickfacts
          ? ` QuickFacts ${city.quickfacts.yearLabel} est. ${city.quickfacts.pop.toLocaleString()} (footnote).`
          : ''}{' '}
        Joint model — filters are correlated (not independent probabilities multiplied).
      </p>
    </div>
  );
}
