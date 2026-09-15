import { formatPercent } from '../model/filter';
import { TYLER_ADULT_WOMEN_ESTIMATE } from '../model/population';
import {
  TYLER_ACS_FEMALE_COUNT,
  TYLER_ACS_POPULATION,
  TYLER_QUICKFACTS_POP_2025,
} from '../model/sources';
import type { FilterResult } from '../model/types';

interface Props {
  result: FilterResult;
}

export function HeroPercent({ result }: Props) {
  const pct = formatPercent(result.percent);
  const tone =
    result.percent >= 20 ? 'high' : result.percent >= 5 ? 'mid' : 'low';

  return (
    <div className={`hero glass-panel tone-${tone}`}>
      <p className="hero-kicker">Share of Tyler dating pool matching</p>
      <div className="hero-pct" aria-live="polite">
        <span className="hero-num">{pct}</span>
        <span className="hero-unit">%</span>
      </div>
      <p className="hero-sub">
        City-scaled estimate:{' '}
        <strong>~{result.cityScaledMatching.toLocaleString()}</strong> of{' '}
        <strong>~{result.cityScaledAvailable.toLocaleString()}</strong> Tyler
        adult available women
        <span className="muted">
          {' '}
          · synthetic N={result.totalGenerated.toLocaleString()} for stable %
        </span>
      </p>
      <p className="hero-note">
        Frame: Tyler, TX ACS pop {TYLER_ACS_POPULATION.toLocaleString()} (~
        {TYLER_ACS_FEMALE_COUNT.toLocaleString()} women; adult subset ≈{' '}
        {TYLER_ADULT_WOMEN_ESTIMATE.toLocaleString()}). QuickFacts Jul 2025 est.{' '}
        {TYLER_QUICKFACTS_POP_2025.toLocaleString()} (footnote). Joint model —
        filters are correlated (not independent probabilities multiplied).
      </p>
    </div>
  );
}
