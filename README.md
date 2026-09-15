# amIdelusional

Interactive **dating-pool calculator**: set filters on women (height, weight, hair, eyes, income, education, tattoos, piercings, cup size, age, US region) and see the **live % of the available pool** that matches.

Traits are **correlated** via a synthetic joint distribution — not independent filters multiplied together. Example: higher weight/BMI shifts cup-size probabilities upward.

> **Entertainment model.** Rough, opinionated, and incomplete. Not census microdata, not medical advice, not a judgment about anyone. Adults 18+ only.

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

Requires a Windows build host (or CI) for the portable `.exe`. Artifact name: `amIdelusional-0.1.0-x64-portable.exe`.

## How correlation works

1. Generate **100,000** synthetic US adult women once (deterministic seed `20260915`).
2. Draw traits with **chained conditionals**:
   - Age (18–65) → height (NHANES-ish) → BMI → weight
   - Hair → eyes (darker hair → higher P(brown eyes))
   - Education + age → personal income
   - Age → currently married vs **available** (≈ unmarried)
   - Age (+ education) → tattoos; age (+ tattoo clustering) → face/body piercings (excl. ears)
   - BMI / weight → cup size (ordered categorical; **modeled**)
3. Filtering = `count(rows matching all filters) / count(available pool)`.
4. Optional breakdown bars: each filter alone vs remaining % after sequential application (still joint counts).

Default age band **18–40**; hard floor at **18**. Default region **US women**. **Available** ≈ not currently married (never married / divorced / separated / widowed) — a dating-pool proxy, not “on apps” or “interested.”

## Sourced vs modeled

| Trait | Kind | Notes |
|-------|------|--------|
| Height & weight / BMI | **Sourced** (directional) | CDC/NHANES adult women anthropometrics |
| Education & income | **Sourced** (directional) | ACS / CPS-style attainment & earnings by education |
| Availability (unmarried) | **Sourced** (directional) | ACS marital status by age |
| Hair & eye color | **Sourced** (approximate) | Published frequency summaries; eyes conditional on hair |
| Tattoos & piercings | **Modeled** | Survey headlines (e.g. Harris-style) + age effects — labeled in UI |
| Cup size | **Modeled** | No government distribution; BMI-shifted entertainment estimate — labeled in UI |

Never claim “Census says 23.4% are C-cup.” Modeled traits show a yellow **modeled** badge in the filter sidebar and are documented in **Data & methods**.

## Stack

- Vite + React + TypeScript
- Apple liquid-glass UI (frosted panels, ambient gradients)
- Optional Electron Windows portable (electron-builder)

## License

MIT
