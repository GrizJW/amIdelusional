import { formatPercent } from '../model/filter';
import type { BreakdownItem } from '../model/types';

interface Props {
  items: BreakdownItem[];
}

export function BreakdownBars({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="breakdown glass-panel">
        <h3>Filter impact</h3>
        <p className="muted">
          Tighten height, weight, hair, education, etc. to see how each cut
          shrinks the pool. Bars show remaining % after filters applied in order
          (joint counts — not independent).
        </p>
      </div>
    );
  }

  return (
    <div className="breakdown glass-panel">
      <h3>Filter impact</h3>
      <p className="muted small">
        Light bar = this filter alone on the age/available pool. Solid bar =
        remaining after applying filters in sidebar order (correlated).
      </p>
      <ul className="bar-list">
        {items.map((item) => (
          <li key={item.id}>
            <div className="bar-meta">
              <span>{item.label}</span>
              <span className="mono">
                {formatPercent(item.sequentialPercent)}%
                <span className="muted">
                  {' '}
                  (alone {formatPercent(item.alonePercent)}%)
                </span>
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-alone"
                style={{ width: `${Math.min(100, item.alonePercent)}%` }}
              />
              <div
                className="bar-seq"
                style={{ width: `${Math.min(100, item.sequentialPercent)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
