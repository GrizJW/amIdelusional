import { DISCLAIMER, SOURCE_NOTES } from '../model/sources';
import {
  POPULATION_SIZE,
  POPULATION_SEED,
  TYLER_ADULT_WOMEN_ESTIMATE,
} from '../model/population';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function DataMethods({ open, onToggle }: Props) {
  return (
    <div className={`methods glass-panel ${open ? 'open' : ''}`}>
      <button type="button" className="methods-toggle" onClick={onToggle}>
        <span>Data &amp; methods</span>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="methods-body">
          <p className="disclaimer-inline">{DISCLAIMER}</p>
          <h4>How correlation works</h4>
          <p>
            A synthetic population of{' '}
            <strong>{POPULATION_SIZE.toLocaleString()}</strong> Tyler-framed
            adult women is generated once (seed {POPULATION_SEED}) with{' '}
            <strong>chained conditionals</strong>: ethnicity (ACS Tyler shares)
            → hair → eyes; age → height → BMI → weight; education + age →
            income; age → marital/availability; age (+ education) →
            tattoos/piercings; BMI/weight → cup size. Your filters count
            matching rows in that joint table — so ethnicity mildly shifts hair
            and eye probabilities, and a heavier woman is more likely to draw a
            larger cup size than an independent product of marginals would
            imply. Live % uses the synthetic sample; headcounts are scaled to
            an estimated ~{TYLER_ADULT_WOMEN_ESTIMATE.toLocaleString()} Tyler
            adult women.
          </p>
          <h4>Sources &amp; modeled traits</h4>
          <ul className="source-list">
            {SOURCE_NOTES.map((n) => (
              <li key={n.id}>
                <div className="source-head">
                  <strong>{n.trait}</strong>
                  <span className={`tag ${n.kind}`}>{n.kind}</span>
                </div>
                <p>{n.summary}</p>
                {n.refs.length > 0 ? (
                  <ul className="refs">
                    {n.refs.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
