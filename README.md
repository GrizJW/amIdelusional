# amIdelusional

Interactive **dating-pool calculator** for **Tyler, TX**: set filters on women (ethnicity, height, weight, hair, eyes, income, education, tattoos, piercings, cup size, age) and see the **live % of the available pool** that matches — with headcounts **city-scaled** to Tyler adult available women.

Traits are **correlated** via a synthetic joint distribution — not independent filters multiplied together. Example: ethnicity mildly shifts hair/eye probabilities; higher weight/BMI shifts cup-size probabilities upward.

> **Entertainment model.** Rough, opinionated, and incomplete. Not census microdata, not medical advice, not a judgment about anyone. Adults 18+ only. Valorant rank: N/A.

## Run (web)

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Run (Electron / Windows portable)

```bash
npm run electron:dev          # build UI + open Electron window
npm run electron:build        # Windows x64 portable under release/
```

Requires a Windows build host (or CI / Wine) for the portable `.exe`. Artifact name: `amIdelusional-0.1.1-x64-portable.exe`.

A GitHub Actions workflow template lives at `electron/ci-release-windows.yml` (copy into `.github/workflows/` if your token has the `workflow` scope).

**Release:** https://github.com/GrizJW/amIdelusional/releases/tag/v0.1.1

## Tyler city frame (ACS)

| Fact | Value | Source |
|------|-------|--------|
| City population | **107,718** | ACS 2019–2023 5-year (CensusDepth / US Civic Data) |
| Female | **≈51.9%** → ~**55.9k** women citywide | ACS (pool is adult subset) |
| White (non-Hispanic) | **47.0%** | ACS / US Civic Data |
| Black / African American | **~23.3%** | ACS / US Civic Data |
| Hispanic or Latino (any race) | **23.6%** | ACS / US Civic Data |
| Asian | **2.5%** | ACS / US Civic Data |
| Two or more / other | **~3.6%** | Remainder: AIAN (~0.1%) + NHPI (~0%) + Some other (~0.4%) + Two or more (~3.1%) |
| QuickFacts Jul 1 2025 est. | **113,723** (female **52.3%**) | Footnote only — ethnicity shares stay ACS |

UI shows ACS city pop; QuickFacts newer total is footnoted. Live % comes from a large synthetic sample; displayed counts scale to estimated Tyler adult women (ACS female × QuickFacts 18+ share).

## How correlation works

1. Generate **100,000** synthetic Tyler-framed adult women once (deterministic seed `20260915`).
2. Draw traits with **chained conditionals**:
   - **Ethnicity** (ACS Tyler mutually exclusive shares) → hair → eyes (mild priors; blonde/blue rarer outside White NH)
   - Age (18–65) → height (NHANES-ish) → BMI → weight
   - Education + age → personal income
   - Age → currently married vs **available** (≈ unmarried)
   - Age (+ education) → tattoos; age (+ tattoo clustering) → face/body piercings (excl. ears)
   - BMI / weight → cup size (ordered categorical; **modeled**)
3. Filtering = `count(rows matching all filters) / count(available pool)`.
4. City-scaled headcount = synthetic available share × Tyler adult women estimate × match rate.
5. Optional breakdown bars: each filter alone vs remaining % after sequential application (still joint counts).

Default age band **18–40**; hard floor at **18**. Default region **Tyler, TX**. **Available** ≈ not currently married — a dating-pool proxy, not “on apps” or “interested.”

Ethnicity ↔ hair/eye correlations are **mild and documented** (appearance-frequency priors, not caricatures).

## Sourced vs modeled

| Trait | Kind | Notes |
|-------|------|--------|
| Tyler pop & ethnicity | **Sourced** | ACS 2019–2023 / US Civic Data; QuickFacts footnote |
| Height & weight / BMI | **Sourced** (directional) | CDC/NHANES adult women anthropometrics |
| Education & income | **Sourced** (directional) | ACS / CPS-style attainment & earnings by education |
| Availability (unmarried) | **Sourced** (directional) | ACS marital status by age |
| Hair & eye color | **Sourced** (approximate) | Frequency summaries + mild ethnicity conditioning |
| Tattoos & piercings | **Modeled** | Survey headlines + age effects — labeled in UI |
| Cup size | **Modeled** | No government distribution; BMI-shifted — labeled in UI |

Never claim “Census says 23.4% are C-cup.” Modeled traits show a yellow **modeled** badge in the filter sidebar and are documented in **Data & methods**.

## Stack

- Vite + React + TypeScript
- Apple liquid-glass UI (frosted panels, ambient gradients)
- Optional Electron Windows portable (electron-builder)

## License

MIT
