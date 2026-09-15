# amIdelusional

Interactive **dating-pool calculator** for selectable Texas cities (**Tyler**, **Houston**, **Dallas**): set filters on women (ethnicity, height, weight, hair, eyes, income, education, tattoos, piercings, cup size, age) and see the **live % of the available pool** that matches — with **absolute headcounts** against that city’s ACS female population.

Traits are **correlated** via a synthetic joint distribution — not independent filters multiplied together. Example: ethnicity mildly shifts hair/eye probabilities; higher weight/BMI shifts cup-size probabilities upward.

> **Entertainment model.** Rough, opinionated, and incomplete. Not census microdata, not medical advice, not a judgment about anyone. Dating filters are adults 18+ only. Valorant rank: N/A.

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

Requires a Windows build host (or CI / Wine) for the portable `.exe`. Artifact name: `amIdelusional-0.1.2-x64-portable.exe`.

A GitHub Actions workflow template lives at `electron/ci-release-windows.yml` (copy into `.github/workflows/` if your token has the `workflow` scope).

**Release:** https://github.com/GrizJW/amIdelusional/releases/tag/v0.1.2

## City frames (generator N = all city women)

Switch cities in the sidebar. Changing city **regenerates** that city’s full female population (cached after the first build). N is **not** a 100,000-row sample.

| City | Total pop | Female | **N (women)** | Basis | Under 18 | 65+ |
|------|-----------|--------|---------------|-------|----------|-----|
| **Tyler** | 107,718 | 51.9% | **55,906** | ACS 2019–2023 | 23.3% QF | 17.0% QF |
| **Houston** | 2,300,419 | ~50.5% | **1,161,915** | ACS 2019–2023 female count | 23.4% QF | 12.3% QF |
| **Dallas** | 1,299,553 | 50.2% | **652,376** | ACS 2019–2023 (fetched) | 23.9% QF | 11.8% QF |

QuickFacts newer totals are **footnotes only** (Tyler 113,723; Houston 2,397,315; Dallas 1,329,491). Dallas N is ACS-based because the 5-year table was fetched — **not** the QuickFacts fallback 1,329,491 × 50.0% ≈ 664,746.

Ages include under-18 so N = **all city women**. Dating “available” then excludes minors and currently-married adults. Adult 18+ display uses QuickFacts under-18 share × female N.

### Ethnicity (mutually exclusive; Asian ≠ Indian)

**Asian** = East / Southeast Asian (Chinese, Filipino, Vietnamese, Korean, Japanese, …) — **excludes Asian Indian**.  
**Indian** = Asian Indian / South Asian Indian as its own filter.

The former ACS Asian-alone bucket is split using CensusDepth ACS 2023 Asian-subgroup % of city pop (Indian) subtracted from Asian-alone; remainder stays in Asian (East/SE + residual non-Indian Asian such as Pakistani/Thai when B02015 cells were not separately fetched).

| Group | Tyler | Houston | Dallas |
|-------|------:|--------:|-------:|
| White (non-Hispanic) | 47.0% | 23.6% | 28.2% |
| Black / African American | 23.3% | 22.5% | 23.4% |
| Hispanic or Latino | 23.6% | 44.1% | 41.9% |
| Asian (East / Southeast) | 2.2% | 5.3% | 2.6% |
| Indian (Asian Indian) | 0.3% | 1.5% | 1.0% |
| Two or more / other | 3.6% | 3.0% | 2.9% |

**Sources:** Tyler & Dallas ACS / US Civic Data + CensusDepth; Houston City of Houston ACS 2019–2023 race table + CensusDepth subgroups. Other folds AIAN / NHPI / some other / two+.

## How correlation works

1. Generate **N = city female count** synthetic women once per city (deterministic seed `20260915` + city offset) into packed typed arrays.
2. Draw traits with **chained conditionals**:
   - **Ethnicity** (city ACS mutually exclusive shares, Indian split out of Asian) → hair → eyes (mild priors; blonde/blue rarer outside White NH; Indian uses South-Asian priors, not East-Asian)
   - Age (0–90, under-18 and 65+ shares from QuickFacts) → height (NHANES-ish) → BMI → weight
   - Education + age → personal income (minors: less-than-HS, $0)
   - Age → currently married vs **available** (minors never available)
   - Age (+ education) → tattoos; age (+ tattoo clustering) → face/body piercings (excl. ears)
   - BMI / weight → cup size (ordered categorical; **modeled**)
3. Filtering = `count(rows matching all filters) / count(available pool)`.
4. Headcounts are **absolute** in that universe (N is the city women count).
5. Optional breakdown bars: each filter alone vs remaining % after sequential application (still joint counts).

Default age band **18–40**; hard floor at **18**. Default city **Tyler, TX**. **Available** ≈ not currently married — a dating-pool proxy, not “on apps” or “interested.”

Ethnicity ↔ hair/eye correlations are **mild and documented** (appearance-frequency priors, not caricatures).

## Sourced vs modeled

| Trait | Kind | Notes |
|-------|------|--------|
| City pop & ethnicity | **Sourced** | ACS 2019–2023 / City of Houston / US Civic Data / CensusDepth; QuickFacts footnote |
| Asian vs Indian split | **Sourced** | ACS Asian-alone minus CensusDepth Asian Indian subgroup |
| Height & weight / BMI | **Sourced** (directional) | CDC/NHANES adult women anthropometrics |
| Education & income | **Sourced** (directional) | ACS / CPS-style attainment & earnings by education |
| Availability (unmarried) | **Sourced** (directional) | ACS marital status by age; minors excluded |
| Hair & eye color | **Sourced** (approximate) | Frequency summaries + mild ethnicity conditioning |
| Tattoos & piercings | **Modeled** | Survey headlines + age effects — labeled in UI |
| Cup size | **Modeled** | No government distribution; BMI-shifted — labeled in UI |

Never claim “Census says 23.4% are C-cup.” Modeled traits show a yellow **modeled** badge in the filter sidebar and are documented in **Data & methods**.

## Performance

Houston N ≈ 1.16 million rows. Generation uses structure-of-arrays typed buffers (~15 bytes/woman, ~17 MB for Houston), one pass per city, then cache. First Houston/Dallas open shows **Building Houston/Dallas pool…** for a couple of seconds. No secret 100k cap.

## Stack

- Vite + React + TypeScript
- Apple liquid-glass UI (frosted panels, ambient gradients)
- Optional Electron Windows portable (electron-builder)

## License

MIT
