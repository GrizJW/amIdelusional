import { useEffect, useMemo, useState } from 'react';
import { BreakdownBars } from './components/BreakdownBars';
import { DataMethods } from './components/DataMethods';
import { FilterSidebar } from './components/FilterSidebar';
import { HeroPercent } from './components/HeroPercent';
import { evaluate } from './model/filter';
import { getPopulationAsync, peekPopulation } from './model/population';
import { DISCLAIMER } from './model/sources';
import { getCity } from './model/cities';
import { DEFAULT_FILTERS, type Filters, type PackedPop } from './model/types';
import './App.css';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [population, setPopulation] = useState<PackedPop | null>(() =>
    peekPopulation(DEFAULT_FILTERS.region),
  );
  const [building, setBuilding] = useState<{
    name: string;
    done: number;
    total: number;
  } | null>(null);

  const city = getCity(filters.region);

  useEffect(() => {
    let live = true;
    const cached = peekPopulation(filters.region);
    if (cached) {
      setPopulation(cached);
      setBuilding(null);
      return;
    }
    setPopulation(null);
    setBuilding({ name: city.shortName, done: 0, total: city.femaleCount });
    getPopulationAsync(filters.region, (done, total) => {
      if (live) setBuilding({ name: city.shortName, done, total });
    }).then((pop) => {
      if (live) {
        setPopulation(pop);
        setBuilding(null);
      }
    });
    return () => {
      live = false;
    };
  }, [filters.region, city.shortName, city.femaleCount]);

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
            Dating-pool calculator · correlated traits · {city.name}
          </p>
        </div>
        <p className="top-disclaimer">{DISCLAIMER}</p>
      </header>

      <div className="layout">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <main className="main">
          {building || !result ? (
            <div className="building-overlay glass-panel" role="status" aria-live="polite">
              <div className="building-spin" aria-hidden />
              <p className="building-title">
                Building {building?.name ?? city.shortName} pool…
              </p>
              <p className="muted">
                Generating {(building?.total ?? city.femaleCount).toLocaleString()} city
                women (ACS female count — not a 100k sample).
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
          />
        </main>
      </div>

      <footer className="footer muted">
        Entertainment model · adults 18+ dating filter · {city.name} · v0.1.2
      </footer>
    </div>
  );
}
