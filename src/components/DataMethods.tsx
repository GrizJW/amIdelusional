import { disclaimerFor, sourceNotesFor } from '../model/sources';
import { ethnicityRows, type CityConfig } from '../model/cities';
import { POPULATION_SEED } from '../model/population';

interface Props {
  open: boolean;
  onToggle: () => void;
  city: CityConfig;
}

export function DataMethods({ open, onToggle, city }: Props) {
  const notes = sourceNotesFor(city);
  return (
    <div className={`methods glass-panel ${open ? 'open' : ''}`}>
      <button type="button" className="methods-toggle" onClick={onToggle}>
        <span>Data &amp; methods</span>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="methods-body">
          <p className="disclaimer-inline">{disclaimerFor(city)}</p>
          <h4>{city.name} census frame</h4>
          <table className="city-table">
            <tbody>
              <tr>
                <th>Total pop</th>
                <td>{city.totalPop.toLocaleString()}</td>
              </tr>
              <tr>
                <th>Female</th>
                <td>
                  {(city.femalePct * 100).toFixed(1)}% →{' '}
                  <strong>{city.femaleCount.toLocaleString()}</strong> women = generator N
                </td>
              </tr>
              <tr>
                <th>N basis</th>
                <td>{city.nBasisNote}</td>
              </tr>
              <tr>
                <th>Under 18</th>
                <td>{(city.under18Pct * 100).toFixed(1)}% (QuickFacts / ACS)</td>
              </tr>
              {city.quickfacts ? (
                <tr>
                  <th>QuickFacts</th>
                  <td>
                    {city.quickfacts.yearLabel} {city.quickfacts.pop.toLocaleString()} · female{' '}
                    {(city.quickfacts.femalePct * 100).toFixed(1)}%. {city.quickfacts.note}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <h4>Ethnicity (mutually exclusive)</h4>
          <table className="city-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {ethnicityRows(city).map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>{(r.share * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">{city.ethnicityNote}</p>
          <h4>How correlation works</h4>
          <p>
            A synthetic population of{' '}
            <strong>{city.femaleCount.toLocaleString()}</strong> {city.shortName} women
            (seed {POPULATION_SEED} + city offset) is generated once per city with{' '}
            <strong>chained conditionals</strong>: ethnicity (ACS city shares, with Asian
            Indian split out of Asian) → hair → eyes; age (including under-18 so N =
            all city women) → height → BMI → weight; education + age → income; age →
            marital/availability (minors never available); age (+ education) →
            tattoos/piercings; BMI/weight → cup size. Your filters count matching
            rows in that joint table — so ethnicity mildly shifts hair and eye
            probabilities, and a heavier woman is more likely to draw a larger cup
            size than an independent product of marginals would imply. Live % and
            headcounts are 1:1 with this universe (N is the ACS female count, not a
            100k sample scaled up).
          </p>
          <h4>Sources &amp; modeled traits</h4>
          <ul className="source-list">
            {notes.map((n) => (
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
