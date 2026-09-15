# amIdelusional

Interactive **dating-pool calculator** for selectable Texas cities (**Tyler**, **Houston**, **Dallas**) and **Women | Men** pools: set filters (ethnicity, height, weight, hair, eyes, income, education, tattoos, piercings, cup size *or* hypothetical penis size, age) and see the **live % of the available pool** that matches — with **absolute headcounts** against that city’s ACS sex count.

Traits are **correlated** via a synthetic joint distribution — not independent filters multiplied together. Example: ethnicity mildly shifts hair/eye probabilities; higher weight/BMI shifts cup-size probabilities upward (women); erect length has a mild height correlation (men, calcSD/Veale-style).

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

Requires a Windows build host (or CI / Wine) for the portable `.exe`. Artifact name: `amIdelusional-0.1.3-x64-portable.exe`.

A GitHub Actions workflow template lives at `electron/ci-release-windows.yml` (copy into `.github/workflows/` if your token has the `workflow` scope).

**Release:** https://github.com/GrizJW/amIdelusional/releases/tag/v0.1.3

## Sex / pool selector

Sidebar **Women | Men** (default **Women** to preserve prior UX). City switch + sex switch regenerates/caches pools with keys like `tyler_tx_female`, `houston_tx_male` (loading overlay while building).

| What | Women | Men |
|------|-------|-----|
| Generator N | ACS female count | ACS male = total − female (documented per city) |
| Height / weight | Female NHANES-style | Male NHANES-style (taller / heavier means) |
| Cup size | Modeled filter | **Hidden** (not in male model) |
| Penis size (erect L/G) | **No UI** | **Modeled / hypothetical** — Veale 2015 / calcSD-style normals; mild height corr.; labeled |
| Tattoos / piercings | Modeled | Modeled with male-adjusted base rates |
| Ethnicity | City ACS shares | **Same** city shares (not sex-split — documented) |
| Income / education / available | Female schedules | Male-adapted (later marriage at young ages; earnings gap directional) |

### Male N per city

| City | Total pop | Female N | **Male N** | Derivation |
|------|-----------|----------|------------|------------|
| **Tyler** | 107,718 | 55,906 (51.9%) | **51,812** | total − female (≈ 48.1%) |
| **Houston** | 2,300,419 | 1,161,915 | **1,138,504** | total − female (matches City of Houston district profile male total) |
| **Dallas** | 1,299,553 | 652,376 (50.2%) | **647,177** | total − female (derived from existing ACS config; not invented) |

## City frames (generator N = all city women *or* men)

Switch cities in the sidebar. Changing city **or** sex regenerates that pool (cached after the first build). N is **not** a 100,000-row sample.

| City | Total pop | Female N | Male N | Basis | Under 18 | 65+ |
|------|-----------|----------|--------|-------|----------|-----|
| **Tyler** | 107,718 | **55,906** | **51,812** | ACS 2019–2023 | 23.3% QF | 17.0% QF |
| **Houston** | 2,300,419 | **1,161,915** | **1,138,504** | ACS 2019–2023 | 23.4% QF | 12.3% QF |
| **Dallas** | 1,299,553 | **652,376** | **647,177** | ACS 2019–2023 (fetched) | 23.9% QF | 11.8% QF |

QuickFacts newer totals are **footnotes only**. Ages include under-18 so N = **all city people of that sex**. Dating “available” then excludes minors and currently-married adults.

Hero copy: **“Share of Tyler/Houston/Dallas dating pool”** for the selected sex.

### Ethnicity (mutually exclusive; Asian ≠ Indian)

**Asian** = East / Southeast Asian — **excludes Asian Indian**.  
**Indian** = Asian Indian as its own filter.

Same city race/ethnicity distribution for both sexes (Census tables we use are typically not sex-split). Documented in Data & methods.

| Group | Tyler | Houston | Dallas |
|-------|------:|--------:|-------:|
| White (non-Hispanic) | 47.0% | 23.6% | 28.2% |
| Black / African American | 23.3% | 22.5% | 23.4% |
| Hispanic or Latino | 23.6% | 44.1% | 41.9% |
| Asian (East / Southeast) | 2.2% | 5.3% | 2.6% |
| Indian (Asian Indian) | 0.3% | 1.5% | 1.0% |
| Two or more / other | 3.6% | 3.0% | 2.9% |

## Penis size (men only — modeled / hypothetical)

Erect **length** and **girth** filters (inches; cm shown in UI) for the Men pool only.

- Distribution: normal using **Veale et al. 2015** researcher-measured meta-analysis aggregates (same family of means calcSD uses): length μ = 13.12 cm (σ = 1.66); girth μ = 11.66 cm (σ = 1.10).
- Mild length↔height correlation (r ≈ 0.25; Veale reported ~0.2–0.6 — we keep the weak end) + mild length↔girth residual correlation.
- **No ethnicity × size claims.**
- Clearly labeled **modeled** in UI; cited in Data & methods (calcSD + Veale). Never presented as Census.
- Women pool: no penis-size UI. Cup size remains women-only.

Refs: [Veale 2015 BJU Int](https://doi.org/10.1111/bju.13010) · [calcSD](https://calcsd.com)

## How correlation works

1. Generate **N = city sex count** synthetic people once per city×sex (deterministic seed `20260915` + city offset + 100 for male) into packed typed arrays; cache key `cityId_sex`.
2. Draw traits with **chained conditionals**:
   - **Ethnicity** (city ACS mutually exclusive shares, Indian split out of Asian) → hair → eyes
   - Age (0–90) → height (sex-specific NHANES-ish) → BMI → weight
   - Education + age → personal income (sex-adapted means)
   - Age → currently married vs **available** (minors never available; men marry slightly later at young ages)
   - Age (+ education) → tattoos; age (+ tattoo clustering) → face/body piercings (excl. ears; male rates lower for piercings)
   - Women: BMI / weight → cup size (**modeled**)
   - Men: height → erect length/girth (**modeled / calcSD-style**); cup not modeled
3. Filtering = `count(rows matching all filters) / count(available pool)`.
4. Headcounts are **absolute** in that universe.
5. Optional breakdown bars: each filter alone vs remaining % after sequential application.

Default age band **18–40**; hard floor at **18**. Default city **Tyler, TX**. Default sex **Women**.

## Sourced vs modeled

| Trait | Kind | Notes |
|-------|------|--------|
| City pop & ethnicity | **Sourced** | ACS / City of Houston / US Civic Data / CensusDepth; QuickFacts footnote |
| Male / female N | **Sourced** | Female from ACS; male = total − female (documented) |
| Asian vs Indian split | **Sourced** | ACS Asian-alone minus CensusDepth Asian Indian subgroup |
| Height & weight / BMI | **Sourced** (directional) | CDC/NHANES by sex |
| Education & income | **Sourced** (directional) | ACS / CPS-style by sex |
| Availability (unmarried) | **Sourced** (directional) | ACS marital status by sex/age |
| Hair & eye color | **Sourced** (approximate) | Frequency summaries + mild ethnicity conditioning |
| Tattoos & piercings | **Modeled** | Survey headlines + age / sex effects — labeled |
| Cup size (women) | **Modeled** | BMI-shifted — labeled; hidden for men |
| Penis size (men) | **Modeled / hypothetical** | Veale / calcSD-style — labeled; no UI for women |

## Performance

Houston female N ≈ 1.16M; male N ≈ 1.14M. Structure-of-arrays typed buffers, one pass per city×sex, then cache. First open of a large pool shows **Building … pool…**.

## Stack

- Vite + React + TypeScript
- Apple liquid-glass UI (frosted panels, ambient gradients)
- Optional Electron Windows portable (electron-builder)

## License

MIT
