import { useEffect, useMemo, useState } from 'react';
import { BreakdownBars } from './components/BreakdownBars';
import { DataMethods } from './components/DataMethods';
import { FilterSidebar } from './components/FilterSidebar';
import { HeroPercent } from './components/HeroPercent';
import { evaluate } from './model/filter';
import { getPopulationAsync, peekPopulation } from './model/population';
import { DISCLAIMER } from './model/sources';
import { getCity, poolCount, sexLabel } from './model/cities';
import { DEFAULT_FILTERS, type Filters, type PackedPop } from './model/types';
import './App.css';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [population, setPopulation] = useState<PackedPop | null>(() =>
    peekPopulation(DEFAULT_FILTERS.region, DEFAULT_FILTERS.sex),
  );
  const [building, setBuilding] = useState<{
    name: string;
    sexLabel: string;
    done: number;
    total: number;
  } | null>(null);

  const city = getCity(filters.region);
  const n = poolCount(city, filters.sex);
  const people = sexLabel(filters.sex);

  useEffect(() => {
    let live = true;
    const cached = peekPopulation(filters.region, filters.sex);
    if (cached) {
      setPopulation(cached);
      setBuilding(null);
      return;
    }
    setPopulation(null);
    setBuilding({
      name: city.shortName,
      sexLabel: people,
      done: 0,
      total: n,
    });
    getPopulationAsync(filters.region, filters.sex, (done, total) => {
      if (live)
        setBuilding({ name: city.shortName, sexLabel: people, done, total });
    }).then((pop) => {
      if (live) {
        setPopulation(pop);
        setBuilding(null);
      }
    });
    return () => {
      live = false;
    };
  }, [filters.region, filters.sex, city.shortName, n, people]);

  const result = useMemo(
    () => (population ? evaluate(population, filters) : null),
    [population, filters],
  );

  const buildPct =
    building && building.total > 0
      ? Math.min(100, Math.round((building.done / building.total) * 100))
      : 0;

  return (
    <div className="app">
      <header className="topbar glass-panel">
        <div>
          <h1>amIdelusional</h1>
          <p className="tagline">
            Dating-pool calculator · correlated traits · {city.name} ·{' '}
            {filters.sex === 'male' ? 'Men' : 'Women'}
          </p>
        </div>
        <p className="top-disclaimer">{DISCLAIMER}</p>
      </header>

      <div className="layout">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <main className="main">
          {building || !result ? (
            <div
              className="building-overlay glass-panel"
              role="status"
              aria-live="polite"
            >
              <div className="building-spin" aria-hidden />
              <p className="building-title">
                Building {building?.name ?? city.shortName}{' '}
                {building?.sexLabel ?? people} pool…
              </p>
              <p className="muted">
                Generating{' '}
                {(building?.total ?? n).toLocaleString()} city{' '}
                {building?.sexLabel ?? people} (ACS {people} count — not a 100k
                sample). Cache key:{' '}
                <code>
                  {filters.region}_{filters.sex}
                </code>
              </p>
              <div className="building-track">
                <div className="building-bar" style={{ width: `${buildPct}%` }} />
              </div>
              <p className="mono muted">{buildPct}%</p>
            </div>
          ) : (
            <>
              <HeroPercent
                result={result}
                city={city}
                sex={filters.sex}
                availableOnly={filters.availableOnly}
                ageMin={Math.max(18, filters.ageMin)}
                ageMax={filters.ageMax}
              />
              <BreakdownBars items={result.breakdown} />
            </>
          )}
          <DataMethods
            open={methodsOpen}
            onToggle={() => setMethodsOpen((o) => !o)}
            city={city}
            sex={filters.sex}
          />
        </main>
      </div>

      <footer className="footer muted">
        Entertainment model · adults 18+ dating filter · {city.name} ·{' '}
        {filters.sex === 'male' ? 'Men' : 'Women'} · v0.1.3
      </footer>
    </div>
  );
}
