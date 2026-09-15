import { formatPercent } from '../model/filter';
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
      <p className="hero-kicker">Share of available women matching</p>
      <div className="hero-pct" aria-live="polite">
        <span className="hero-num">{pct}</span>
        <span className="hero-unit">%</span>
      </div>
      <p className="hero-sub">
        <strong>{result.matching.toLocaleString()}</strong> of{' '}
        <strong>{result.availablePool.toLocaleString()}</strong> in the available
        pool
        <span className="muted">
          {' '}
          · synthetic N={result.totalGenerated.toLocaleString()} US women
        </span>
      </p>
      <p className="hero-note">
        Joint model — filters are correlated (not independent probabilities
        multiplied).
      </p>
    </div>
  );
}
