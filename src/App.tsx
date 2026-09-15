import { useMemo, useState } from 'react';
import { BreakdownBars } from './components/BreakdownBars';
import { DataMethods } from './components/DataMethods';
import { FilterSidebar } from './components/FilterSidebar';
import { HeroPercent } from './components/HeroPercent';
import { evaluate } from './model/filter';
import { getPopulation } from './model/population';
import { DISCLAIMER } from './model/sources';
import { DEFAULT_FILTERS, type Filters } from './model/types';
import './App.css';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const population = useMemo(() => getPopulation(), []);
  const result = useMemo(
    () => evaluate(population, filters),
    [population, filters],
  );

  return (
    <div className="app">
      <header className="topbar glass-panel">
        <div>
          <h1>amIdelusional</h1>
          <p className="tagline">
            Dating-pool calculator · correlated traits · Tyler, TX
          </p>
        </div>
        <p className="top-disclaimer">{DISCLAIMER}</p>
      </header>

      <div className="layout">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <main className="main">
          <HeroPercent result={result} />
          <BreakdownBars items={result.breakdown} />
          <DataMethods
            open={methodsOpen}
            onToggle={() => setMethodsOpen((o) => !o)}
          />
        </main>
      </div>

      <footer className="footer muted">
        Entertainment model · adults 18+ only · Tyler, TX · v0.1.1
      </footer>
    </div>
  );
}
