import { disclaimerFor, sourceNotesFor } from '../model/sources';
import {
  ethnicityRows,
  poolCount,
  sexLabel,
  type CityConfig,
} from '../model/cities';
import { POPULATION_SEED } from '../model/population';
import type { Sex } from '../model/types';

interface Props {
  open: boolean;
  onToggle: () => void;
  city: CityConfig;
  sex: Sex;
}

export function DataMethods({ open, onToggle, city, sex }: Props) {
  const notes = sourceNotesFor(city, sex);
  const n = poolCount(city, sex);
  const people = sexLabel(sex);
  const isMen = sex === 'male';

  return (
    <div className={`methods glass-panel ${open ? 'open' : ''}`}>
      <button type="button" className="methods-toggle" onClick={onToggle}>
        <span>Data &amp; methods</span>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="methods-body">
          <p className="disclaimer-inline">{disclaimerFor(city, sex)}</p>
          <h4>
            {city.name} census frame ({people})
          </h4>
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
                  <strong>{city.femaleCount.toLocaleString()}</strong> women
                  {!isMen ? ' = generator N' : ''}
                </td>
              </tr>
              <tr>
                <th>Male</th>
                <td>
                  {(city.malePct * 100).toFixed(1)}% →{' '}
                  <strong>{city.maleCount.toLocaleString()}</strong> men
                  {isMen ? ' = generator N' : ''}
                  <br />
                  <span className="muted">{city.maleNNote}</span>
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
                    {city.quickfacts.yearLabel}{' '}
                    {city.quickfacts.pop.toLocaleString()} · female{' '}
                    {(city.quickfacts.femalePct * 100).toFixed(1)}%.{' '}
                    {city.quickfacts.note}
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
          <p className="muted small">{city.ethnicitySexAssumption}</p>
          <h4>How correlation works</h4>
          <p>
            A synthetic population of <strong>{n.toLocaleString()}</strong>{' '}
            {city.shortName} {people} (seed {POPULATION_SEED} + city offset
            {isMen ? ' + 100 for male' : ''}; cache key{' '}
            <code>
              {city.id}_{sex}
            </code>
            ) is generated once per city×sex with{' '}
            <strong>chained conditionals</strong>: ethnicity (ACS city shares,
            with Asian Indian split out of Asian; same shares for both sexes) →
            hair → eyes; age (including under-18 so N = all city {people}) →
            height (
            {isMen
              ? 'male NHANES ~69.1″'
              : 'female NHANES ~63.7″'}
            ) → BMI → weight; education + age → income; age →
            marital/availability (minors never available); age (+ education) →
            tattoos/piercings
            {isMen ? ' (male-adjusted base rates)' : ''};{' '}
            {isMen
              ? 'erect length/girth from Veale/calcSD-style normals with mild height correlation (BMI irrelevant for cup — cup hidden).'
              : 'BMI/weight → cup size (women only).'}{' '}
            Your filters count matching rows in that joint table. Live % and
            headcounts are 1:1 with this universe.
          </p>
          <h4>Sources &amp; modeled traits</h4>
          <ul className="source-list">
            {notes.map((nItem) => (
              <li key={nItem.id}>
                <div className="source-head">
                  <strong>{nItem.trait}</strong>
                  <span className={`tag ${nItem.kind}`}>{nItem.kind}</span>
                </div>
                <p>{nItem.summary}</p>
                {nItem.refs.length > 0 ? (
                  <ul className="refs">
                    {nItem.refs.map((r) => (
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
