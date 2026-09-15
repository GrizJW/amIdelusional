import type {
  Filters,
  HairColor,
  EyeColor,
  Education,
  CupSize,
  Ethnicity,
  CityId,
  Sex,
} from '../model/types';
import {
  CUP_OPTIONS,
  DEFAULT_FILTERS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  EYE_OPTIONS,
  HAIR_OPTIONS,
  PENIS_GIRTH_RANGE,
  PENIS_LENGTH_RANGE,
  SEX_OPTIONS,
} from '../model/types';
import { CITY_LIST, getCity, poolCount, sexLabel } from '../model/cities';
import { formatInCm, inchesToFeetLabel } from '../model/filter';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
}

function toggleIn<T extends string>(list: T[] | null, value: T): T[] | null {
  const cur = list ?? [];
  const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
  return next.length === 0 ? null : next;
}

export function FilterSidebar({ filters, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const city = getCity(filters.region);
  const qf = city.quickfacts;
  const n = poolCount(city, filters.sex);
  const people = sexLabel(filters.sex);
  const isMen = filters.sex === 'male';

  // Widen height/weight defaults when switching to men (taller/heavier means).
  const onSexChange = (sex: Sex) => {
    if (sex === filters.sex) return;
    if (sex === 'male') {
      set({
        sex,
        cup: null,
        heightMinIn: Math.min(filters.heightMinIn, 62),
        heightMaxIn: Math.max(filters.heightMaxIn, 76),
        weightMinLb: Math.min(filters.weightMinLb, 120),
        weightMaxLb: Math.max(filters.weightMaxLb, 280),
        penisLengthMinIn: PENIS_LENGTH_RANGE.min,
        penisLengthMaxIn: PENIS_LENGTH_RANGE.max,
        penisGirthMinIn: PENIS_GIRTH_RANGE.min,
        penisGirthMaxIn: PENIS_GIRTH_RANGE.max,
      });
    } else {
      set({
        sex,
        penisLengthMinIn: PENIS_LENGTH_RANGE.min,
        penisLengthMaxIn: PENIS_LENGTH_RANGE.max,
        penisGirthMinIn: PENIS_GIRTH_RANGE.min,
        penisGirthMaxIn: PENIS_GIRTH_RANGE.max,
      });
    }
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-head">
        <h2>Filters</h2>
        <button
          type="button"
          className="ghost"
          onClick={() =>
            onChange({
              ...DEFAULT_FILTERS,
              region: filters.region,
              sex: filters.sex,
            })
          }
        >
          Reset
        </button>
      </div>

      <section className="filter-block">
        <label className="block-label">
          Pool <span className="tag sourced">{isMen ? 'Men' : 'Women'}</span>
        </label>
        <div className="seg">
          {SEX_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`seg-btn ${filters.sex === o.value ? 'on' : ''}`}
              onClick={() => onSexChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: '0.35rem' }}>
          Default Women preserves prior UX. Switching regenerates/caches a{' '}
          {people} pool.
        </p>
      </section>

      <section className="filter-block">
        <label className="block-label">
          Age band <span className="tag sourced">adults 18+</span>
        </label>
        <div className="range-row">
          <input
            type="number"
            min={18}
            max={90}
            value={filters.ageMin}
            onChange={(e) =>
              set({ ageMin: Math.max(18, Number(e.target.value) || 18) })
            }
          />
          <span className="muted">to</span>
          <input
            type="number"
            min={18}
            max={90}
            value={filters.ageMax}
            onChange={(e) =>
              set({ ageMax: Math.min(90, Math.max(18, Number(e.target.value) || 18)) })
            }
          />
        </div>
        <input
          className="dual-hint"
          type="range"
          min={18}
          max={90}
          value={filters.ageMax}
          onChange={(e) => set({ ageMax: Number(e.target.value) })}
        />
      </section>

      <section className="filter-block">
        <label className="block-label">
          City <span className="tag sourced">{city.shortName}</span>
        </label>
        <select
          value={filters.region}
          onChange={(e) => set({ region: e.target.value as CityId })}
          aria-label="City"
        >
          {CITY_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (city dating pool)
            </option>
          ))}
        </select>
        <p className="hint" style={{ marginTop: '0.35rem' }}>
          {city.nBasis === 'acs' ? 'ACS' : 'QuickFacts'} pop{' '}
          {city.totalPop.toLocaleString()} · N = {n.toLocaleString()} {people}
          <br />
          {isMen ? (
            <span className="muted">{city.maleNNote}</span>
          ) : qf ? (
            <span className="muted">
              QuickFacts {qf.yearLabel} est. {qf.pop.toLocaleString()} (footnote)
            </span>
          ) : null}
        </p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => set({ availableOnly: e.target.checked })}
          />
          <span>
            Available only{' '}
            <span className="hint">(≈ unmarried / not currently married; excludes minors)</span>
          </span>
        </label>
      </section>

      <section className="filter-block">
        <label className="block-label">
          Height{' '}
          <span className="muted">
            {inchesToFeetLabel(filters.heightMinIn)} – {inchesToFeetLabel(filters.heightMaxIn)}
          </span>
        </label>
        <div className="range-row">
          <input
            type="range"
            min={54}
            max={84}
            value={filters.heightMinIn}
            onChange={(e) =>
              set({
                heightMinIn: Math.min(Number(e.target.value), filters.heightMaxIn),
              })
            }
          />
          <input
            type="range"
            min={54}
            max={84}
            value={filters.heightMaxIn}
            onChange={(e) =>
              set({
                heightMaxIn: Math.max(Number(e.target.value), filters.heightMinIn),
              })
            }
          />
        </div>
      </section>

      <section className="filter-block">
        <label className="block-label">
          Weight{' '}
          <span className="muted">
            {filters.weightMinLb} – {filters.weightMaxLb} lb
          </span>
        </label>
        <div className="range-row">
          <input
            type="range"
            min={80}
            max={450}
            value={filters.weightMinLb}
            onChange={(e) =>
              set({
                weightMinLb: Math.min(Number(e.target.value), filters.weightMaxLb),
              })
            }
          />
          <input
            type="range"
            min={80}
            max={450}
            value={filters.weightMaxLb}
            onChange={(e) =>
              set({
                weightMaxLb: Math.max(Number(e.target.value), filters.weightMinLb),
              })
            }
          />
        </div>
      </section>

      <ChipGroup
        label="Ethnicity"
        tag="sourced"
        options={ETHNICITY_OPTIONS}
        selected={filters.ethnicity}
        onToggle={(v) =>
          set({ ethnicity: toggleIn(filters.ethnicity, v as Ethnicity) })
        }
      />

      <ChipGroup
        label="Hair color"
        tag="sourced"
        options={HAIR_OPTIONS}
        selected={filters.hair}
        onToggle={(v) => set({ hair: toggleIn(filters.hair, v as HairColor) })}
      />

      <ChipGroup
        label="Eye color"
        tag="sourced"
        options={EYE_OPTIONS}
        selected={filters.eye}
        onToggle={(v) => set({ eye: toggleIn(filters.eye, v as EyeColor) })}
      />

      <ChipGroup
        label="Education"
        tag="sourced"
        options={EDUCATION_OPTIONS}
        selected={filters.education}
        onToggle={(v) =>
          set({ education: toggleIn(filters.education, v as Education) })
        }
      />

      <section className="filter-block">
        <label className="block-label">
          Income{' '}
          <span className="muted">
            ${filters.incomeMin.toLocaleString()} – $
            {filters.incomeMax.toLocaleString()}
          </span>
        </label>
        <div className="range-row">
          <input
            type="range"
            min={0}
            max={500000}
            step={5000}
            value={filters.incomeMin}
            onChange={(e) =>
              set({
                incomeMin: Math.min(Number(e.target.value), filters.incomeMax),
              })
            }
          />
          <input
            type="range"
            min={0}
            max={500000}
            step={5000}
            value={filters.incomeMax}
            onChange={(e) =>
              set({
                incomeMax: Math.max(Number(e.target.value), filters.incomeMin),
              })
            }
          />
        </div>
      </section>

      <TriState
        label="Tattoos"
        tag="modeled"
        value={filters.tattoos}
        onChange={(v) => set({ tattoos: v })}
      />
      <TriState
        label="Face piercings"
        tag="modeled"
        hint="excl. ears"
        value={filters.facePiercings}
        onChange={(v) => set({ facePiercings: v })}
      />
      <TriState
        label="Body piercings"
        tag="modeled"
        hint="excl. ears"
        value={filters.bodyPiercings}
        onChange={(v) => set({ bodyPiercings: v })}
      />

      {!isMen ? (
        <ChipGroup
          label="Cup size"
          tag="modeled"
          options={CUP_OPTIONS}
          selected={filters.cup}
          onToggle={(v) => set({ cup: toggleIn(filters.cup, v as CupSize) })}
        />
      ) : (
        <>
          <section className="filter-block">
            <label className="block-label">
              Penis length (erect){' '}
              <span className="tag modeled">modeled</span>
            </label>
            <p className="hint">
              Hypothetical · calcSD / Veale-style ·{' '}
              {formatInCm(filters.penisLengthMinIn)} –{' '}
              {formatInCm(filters.penisLengthMaxIn)}
            </p>
            <div className="range-row">
              <input
                type="range"
                min={PENIS_LENGTH_RANGE.min}
                max={PENIS_LENGTH_RANGE.max}
                step={0.1}
                value={filters.penisLengthMinIn}
                onChange={(e) =>
                  set({
                    penisLengthMinIn: Math.min(
                      Number(e.target.value),
                      filters.penisLengthMaxIn,
                    ),
                  })
                }
              />
              <input
                type="range"
                min={PENIS_LENGTH_RANGE.min}
                max={PENIS_LENGTH_RANGE.max}
                step={0.1}
                value={filters.penisLengthMaxIn}
                onChange={(e) =>
                  set({
                    penisLengthMaxIn: Math.max(
                      Number(e.target.value),
                      filters.penisLengthMinIn,
                    ),
                  })
                }
              />
            </div>
          </section>
          <section className="filter-block">
            <label className="block-label">
              Penis girth (erect){' '}
              <span className="tag modeled">modeled</span>
            </label>
            <p className="hint">
              Circumference ·{' '}
              {formatInCm(filters.penisGirthMinIn)} –{' '}
              {formatInCm(filters.penisGirthMaxIn)}
            </p>
            <div className="range-row">
              <input
                type="range"
                min={PENIS_GIRTH_RANGE.min}
                max={PENIS_GIRTH_RANGE.max}
                step={0.1}
                value={filters.penisGirthMinIn}
                onChange={(e) =>
                  set({
                    penisGirthMinIn: Math.min(
                      Number(e.target.value),
                      filters.penisGirthMaxIn,
                    ),
                  })
                }
              />
              <input
                type="range"
                min={PENIS_GIRTH_RANGE.min}
                max={PENIS_GIRTH_RANGE.max}
                step={0.1}
                value={filters.penisGirthMaxIn}
                onChange={(e) =>
                  set({
                    penisGirthMaxIn: Math.max(
                      Number(e.target.value),
                      filters.penisGirthMinIn,
                    ),
                  })
                }
              />
            </div>
          </section>
        </>
      )}
    </aside>
  );
}

function ChipGroup<T extends string>({
  label,
  tag,
  options,
  selected,
  onToggle,
}: {
  label: string;
  tag: 'sourced' | 'modeled';
  options: { value: T; label: string }[];
  selected: T[] | null;
  onToggle: (v: T) => void;
}) {
  return (
    <section className="filter-block">
      <label className="block-label">
        {label} <span className={`tag ${tag}`}>{tag}</span>
        <span className="hint"> (any if none selected)</span>
      </label>
      <div className="chips">
        {options.map((o) => {
          const on = selected?.includes(o.value) ?? false;
          return (
            <button
              key={o.value}
              type="button"
              className={`chip ${on ? 'on' : ''}`}
              onClick={() => onToggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TriState({
  label,
  tag,
  hint,
  value,
  onChange,
}: {
  label: string;
  tag: 'sourced' | 'modeled';
  hint?: string;
  value: 'any' | 'yes' | 'no';
  onChange: (v: 'any' | 'yes' | 'no') => void;
}) {
  return (
    <section className="filter-block">
      <label className="block-label">
        {label} <span className={`tag ${tag}`}>{tag}</span>
        {hint ? <span className="hint"> ({hint})</span> : null}
      </label>
      <div className="seg">
        {(['any', 'yes', 'no'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`seg-btn ${value === v ? 'on' : ''}`}
            onClick={() => onChange(v)}
          >
            {v === 'any' ? 'Any' : v === 'yes' ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </section>
  );
}
