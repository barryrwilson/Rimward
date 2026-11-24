# P5b — in-system sub-regions with fast transit lanes (design, pre-issue)

Status: **design draft** for the follow-up to #340 ("only if P5a still feels
small" — owner decision: implement P5b). This document is the design input for
the follow-up implementation issue; nothing here is implemented and nothing in
this file is committed as part of a code change. Source of truth for the shipped
P5a baseline is [SystemScalePopulationDesign.md](SystemScalePopulationDesign.md)
§7.1 and [REMAINING-WORK.md](REMAINING-WORK.md) #340.

## 0. The decision being designed for

P5a shipped a uniform ×2 playable extent (ceiling ~2,800 u) with a speed/pacing
pass. The owner has decided that is **not enough**: P5b adds multiple connected
in-system sub-regions — content clusters separated by thousands of units —
joined by **fast in-system transit** so the extra distance never becomes dead
time. The #340 design note flagged P5b as "biggest structural change; touches
nav/jump/save" with save compatibility as the blocker. The design below removes
the save blocker first, then bounds everything else.

## 1. The load-bearing decision: sub-regions are purely additive

The single most important rule of this design:

> **Nothing that is already persisted ever moves. No persisted coordinate is
> rewritten, scaled, or re-anchored. Sub-regions only ADD content at NEW
> coordinates beyond the current playable ceiling.**

Consequences, all deliberate:

- `SAVE_VERSION` stays **2**. There is no `save-migrate` v3 pass, no envelope
  bump, and therefore no double-scale hazard and no new migration test burden.
- Old v2 saves (and the accepted v1 blobs, migrated exactly once by the
  existing `migrateSnapshotV1ToV2`) restore **byte-identically**.
- The audited persisted-position inventory in
  `src/game/save-migrate.js:11-24` (snapshot.ship.position, record
  route/anchor/wakeSite/derelict/escape, incidents/aftermath positions) is
  untouched by definition: every one of those positions was authored or
  simulated inside the pre-P5b layout, which P5b does not modify.
- Region membership is **derived from position at load/render time**, never
  persisted. Transit-corridor state is **session-only** (a live command-channel
  concern, like `ctx.autopilot`, not WORLD_FIELDS).
- The design adds **zero new persistent fields**. If implementation discovers
  one is unavoidable, it must ride `WORLD_FIELDS` (`src/game/save.js:159`)
  as JSON-plain data and the issue must call it out explicitly before merge —
  that is a scope gate, not an incidental addition (AGENTS.md).

### Why old saves cannot collide with new content

New region content is placed at radii **3,500–8,000 u** on x/z. Every persisted
position in every v2 snapshot predates P5b and therefore sits inside the
pre-P5b ceiling (~2,800 u + local radius slack; deep-field scenery beyond that
is presentation-only and never persisted). The one caveat — a player ship saved
at the exact rim of old content — is covered by existing spawn/dock safety
(respawn, collision and dock-approach logic already resolve overlaps); no new
migration path is created for it.

Float precision (the other #340 blocker note): the design caps the outermost
region ring at **8,000 u** (1 u = 3.64 m ⇒ ~29 km disc), the range the P5 doc
marks as safe. Nothing exceeds it.

## 2. Data model

### 2.1 System definition gains optional `regions` + `lanes` (data-only)

Both authored systems (`src/game/authored-systems.js`) and generated systems
(`scripts/generate-galaxy.mjs` → `src/game/galaxy.generated.js`) may carry:

```js
regions: [
  // 1–3 per system, ids '<sysId>_r<n>'. The existing content disc is NOT a
  // region record — it is region 0 implicitly, unchanged, unnamed in data.
  { id, name, center: [x, y, z], radius, kind }   // kind: 'outpost'|'field'|'wreck'|'anomaly'
],
lanes: [
  // fast-transit corridors between region centers (and region→core anchor)
  { from, to }   // endpoints resolved from region centers at build time
]
```

- Placement: region centers draw at 3,500–8,000 u radius, mostly near the
  ecliptic, ≥ 500 u clear of every existing gate/hub/landmark/field/scenery
  position and of each other. For generated systems this rides a **third**
  mulberry32 stream (`SEED + 3`), consumed in a new loop after the existing
  landmark/contact loops, in `GENERATED_IDS` order — the same stream
  discipline wave-23/24 established, so the regenerated diff is purely additive
  and byte-stable across runs.
- `validate()` gains: region count 1–3, radius bounds, id/name shape and
  uniqueness, the ≥500 u separation invariants, lane endpoint validity, and
  **additivity**: every authored/generated coordinate that existed before P5b
  must diff byte-identical (the generator test pins the pre-P5b fields).
- Region furniture is chosen from existing builders where possible: a second
  asteroid field (far-scenery Points layer and/or an appended instanced belt),
  existing landmark kinds, a beacon/station-light Points layer, optional
  derelict. **No new mesh vocabulary** is required for the first slice.

### 2.2 Navigation targets and chart semantics

- `src/systems/systemchart.js` `buildSystemChartModel` (`L196-L392`) gains:
  - `model.regions`: `[{ id, name, x, z, radius, kind, current }]` — a region
    is `current` when the player position is inside its radius. Regions draw
    as labelled rings (existing `addRing`/`addPoi` vocabulary; DOM/SVG only,
    no THREE, no renderer-count change).
  - `model.lanes`: `[{ x1, z1, x2, z2 }]` drawn as a distinct lane style
    between region centers.
  - `model.extent` growth includes region rings; `SYSTEM_CHART_MAX_EXTENT`
    and the player-marker clamp at `systemchart.js:380-386` are raised to the
    new 8,000 u ceiling. Near/mid/far traffic tiers, the 0.5 s refresh, and
    every existing layer are untouched.
- HUD nav guidance (`src/systems/nav-guidance.js`) is **unchanged** in v1: no
  new gauge, no new persistent field, no new key. Region POIs surface as chart
  features first; if a guidance marker is ever wanted it is its own scoped
  follow-up.
- `world.nav` stays galaxy-ids-only (`src/game/nav.js`); `sanitizeNav` and
  the `navRoute`/autopilot event vocabulary are untouched.
- Agent API `observe()` schemas assume the old extent; region bearings are
  **not** added to observe rows in v1 (bounded scope; the chart is the
  navigation surface).

### 2.3 Fast in-system transit — the mechanic and its bounds

**Definition of "fast":** a transit lane is a corridor between two region
anchors in which the ship's existing speed envelope is boosted — no new key,
no new weapon/equipment, no SKU. Entering a corridor volume while burning
multiplies the ship's current cruise/burn envelope by a corridor factor so the
*slowest* hull class sustains ≥ 500 u/s inside the lane; leaving the corridor
decays the boost over ~1 s back to the authored envelope. Corridor state is
session-only module state (the ship/flight layer already owns the live speed
envelope; the corridor is a read of position, exactly like the sun-heat keep
sphere).

**Bounds (the numbers the acceptance criteria pin):**

| Bound | Value | Rationale |
|---|---|---|
| Region separation | 3,500–8,000 u center radius; leg length ≤ 8,000 u | float-safe ceiling; additive placement |
| Corridor sustained speed | ≥ 500 u/s for the slowest class (freighter 240 burn ⇒ ×~2.1); light hull ≈ 960 u/s | keeps every leg short without re-basing class tuning |
| Region-leg dead time | ≤ 20 s per region-to-region leg at corridor speed | 8,000 u ÷ 500 u/s = 16 s + 1 s boost decay |
| End-to-end dead time | station → farthest region ≤ 60 s including approach | existing budget extended, not replaced |
| Existing pacing pins | untouched | `scripts/issue-340-pacing-test.mjs:172-174` (station→outer POI ≤ 60 s, diameter burn/cruise ≤ 60 s) must keep passing verbatim — no existing assertion is weakened |

**Interaction with the ≤60 s dead-time budget:** the budget is per-leg and
stays per-leg. The pacing suite gains region pins alongside the existing ones
(`regionLegTimeMax ≤ 20`, `stationToFarthestRegion ≤ 60`); the four existing
pins are asserted unchanged. Hop-based pay/deadlines stay unchanged — the
economy is still not re-based (job destinations are systems, not regions).

**What transit deliberately does NOT touch:** combat (no corridor combat
modifiers), the abstract traffic layer (record routes keep their absolute
positions and 1 Hz / 0.2 Hz abstract tick; corridors do not re-time NPC
migration — that was the #340 "longer legs thin encounters" trap and additive
regions do not lengthen any existing leg), gates/jump (a region is not a jump
surface), and docking (region furniture uses the existing station/derelict
interactions).

## 3. Invariants that must not break

| Invariant | Owner | How P5b preserves it |
|---|---|---|
| `ctx.asteroids.list` keeps `id === array index` | `src/systems/asteroids.js:52` | a region's minable belt APPENDS rocks to the per-system list (ids continue from the existing count) or renders as far-scenery Points only; existing slot indices, `fieldOre`/`fieldRespawn` index-string keys and the 160 cap contract are never re-indexed. If the 160 cap binds, the region belt renders as Points scenery in v1 (not minable) and a cap raise is its own scoped decision. |
| Per-system content rebuilds on `systemLoaded` | world/jump event contract | all region furniture + corridor visuals build inside the `systemLoaded` consume path and dispose on system swap, exactly like `deepfield.js`; nothing survives a jump |
| `src/main.js` init order is load-bearing | `src/main.js:90-160` | any new init slot sits with the deepfield family (right after `solarSystem`/`deepfield`, before station/asteroids) — it only reads SYSTEMS + `ctx.world.currentSystem` and owns no event consumption; the chart change lives inside the existing `galaxyChart` system, not a new late one |
| Frozen event vocabulary | `src/core/ctx.js:318-414` | **zero new event types.** Corridor enter/exit is session module state; optional flavor rides the existing `commLine` channel. If implementation truly needs a new event, it must be added to the ctx.js EVENTS doc as an explicit line item of the issue, not incidentally |
| Persisted records stay JSON-safe | `src/game/state.js` contract | no new persistent field; region membership derived; corridor state session-only (§1) |
| `world.nav` / sanitizeNav galaxy-ids-only | `src/game/nav.js` | untouched |
| Boot harness seeded streams | wave-23/24 discipline | generated-region draws ride their own `SEED + 3` stream consumed in a fixed order; no global `Math.random` consumption |

## 4. Out of scope (explicit)

- No HUD gauges, no aim-glass digits, no new persistent HUD instruments.
- No new player keys or rebinding defaults; transit is envelope-modulated, not
  a new command.
- No new keys/digits/SKUs of any kind; no equipment, no hull changes.
- No economy changes: no job pay/deadline re-basing, no market changes, no
  bounty/contact changes.
- No live-NPC cap raises, no new event types, no combat rebalance.
- No galaxy-chart (inter-system) changes; only the existing System view grows a
  layer.
- No planet landing, no new interactable station type beyond existing furniture.
- No save-format change, no migration pass, no new WORLD_FIELDS entry.

## 5. Verification shape (for the follow-up issue)

- Focused suite in the `issue-NNN-*-test.mjs` style wired into
  `npm run test:boot`: generator additivity (pre-P5b fields byte-identical),
  region/validate invariants, corridor speed bounds per class, region-leg and
  end-to-end time pins, chart model regions/lanes/current, `systemLoaded`
  rebuild + disposal, asteroid id===index append behavior, old-save
  byte-identical restore.
- `npm run build` (bundle within the ≤50 KB phase budget) and the full
  `npm run test:boot` chain, no assertion weakened.
- Live production-build browser probe in the `issue-340-live-probe` style:
  fly a corridor end-to-end at corridor speed, open the System chart, verify
  region rings/lanes/player-region highlight, verify a pre-P5b v2 save
  restores byte-identically (position unchanged), console 0 errors.
- Perf evidence per ProductionPerformanceBudget.md protocol: frame p95 delta
  within budget, draw calls within +≤25, before/after table recorded.
