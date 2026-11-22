# Making solar systems feel larger with more NPCs — a performance-bounded brainstorm

Status: **proposal / brainstorm** for Phases 1–4, filed as #338–#341. Phase 0
(measurement, issue #337), Phase 1 (#338), Phase 2 (#339) and Phase 4 (#341)
are implemented; Phase 3 (#340, P5 extent + P6 in-system chart) remains and
still needs the owner save-migration decision. Phase 0 shipped the dev-only
`?perf=1` overlay plus an unattended production-build probe, with the measured
baseline and budgets in
[ProductionPerformanceBudget.md](ProductionPerformanceBudget.md). Neither the
brainstorm nor Phase 0 changed gameplay. Evidence below is current-code
inspection plus three read-only investigations; every number is cited to
file:line so it can be re-checked before scoping.

## 0. The ask

> "Each solar system seems very small and sparsely populated by NPCs. Make each
> system feel significantly larger while increasing the number of NPCs — and do
> not kill performance."

Those are three different problems (space, population, perception) that share one
constraint (frame budget). The proposal below separates them so each can be
bought cheaply and measured before the next one lands.

## 1. Measured baseline — why it feels small and sparse

### 1.1 Space

| Fact | Value | Evidence |
|---|---|---|
| Systems | 101 (7 authored + 94 generated) | `src/game/authored-systems.js:30-255`, `src/game/galaxy.generated.js:2`, merged `src/game/state.js:775` |
| Authored content bound | generated landmarks validated **inside 1000 u of origin** | `scripts/generate-galaxy.mjs:998,1245` |
| Extent radius | min 901 u, avg **1100.7 u**, max 1400 u | computed over all 101 system defs |
| Station / gates / field | station ±650 u; gates 850–1250 u; field radius 85–160 u | `scripts/generate-galaxy.mjs:571-596` |
| Planet orbit slots | 250/420/640/920/1400 u, radii 9/14/16/12/30 | `src/systems/solarsystem.js:170-205` |
| Player speed | cruise 120 u/s, burn 240 u/s | `src/game/state.js:38` |
| Crossing time | ~11.7 s at burn / ~23 s at cruise across the full diameter | derived |
| Scale | 1 u = 3.64 m, so the playable disc is ~4 km radius | `src/game/ship-scale.js:42` |
| Empty fraction | a handful of point objects in a 6.2 M u² disc; >98% has nothing | derived |

### 1.2 Population

| Fact | Value | Evidence |
|---|---|---|
| Cast per system | min 0, **avg 5.2 cast slots / 5.44 actual records**, max 17 (galaxy total 549 records incl. 28 derived miners) | computed over all 101 defs; `src/game/world.js:391-499` |
| Live NPC hard cap | **10** | `src/game/traffic.js:51` |
| Spawn / despawn bubble | instantiate 900 u, deinstantiate 1400 u | `src/game/state.js:28-29` |
| Spawn rate | at most one ship per frame; best-distance candidate wins | `src/game/traffic.js:126-202` |
| Pirate live share | 40%, blockade uncapped | `src/game/traffic-feel.js:29,157-162` |
| Per-NPC simulation | full AI + physics + mesh animation **every frame**, no LOD/tick throttle | `src/systems/npc.js:4136-4317` |
| Per-NPC asset cost | full skinned GLB clone in a `THREE.LOD`; ~6 draw calls incl. glow/plumes | `src/systems/ship-assets.js:440-478`, `src/systems/thruster-fx.js:178-193` |
| Abstract layer | records tick at 1 Hz over all banks; cheap, O(records) | `src/game/world.js:1271,1410-1513` |

### 1.3 Perception

- No fog, no shadows, no post-processing; camera far plane is **20,000**
  (`src/main.js:75-80`), while system content stops at 1,400.
- Starfield shells are 8,000–16,000 u (`src/systems/starfield.js:109-123`) — a
  huge empty visual band between the playable system and the backdrop.
- The galaxy chart is galaxy-level only (2000×1400 chart box,
  `src/systems/galaxychart.js:20`); there is no in-system map.
- HUD distance text collapses to "k" above 1000 u
  (`src/systems/nav-guidance.js:50-53`).
- Asteroids are one `InstancedMesh` per ore type (9 draw calls regardless of
  count) but **every rock's matrix is rewritten every frame**
  (`src/systems/asteroids.js:2396-2413`), and the field cap is 160
  (`src/systems/asteroids.js:1961`).
- No frame-time instrumentation, no adaptive quality; only
  `ctx.frameGapMs` (`src/main.js:160-162`) and pixelRatio ≤ 2
  (`src/main.js:68`). Automated guards are resource counts, not frame time.

**Conclusion:** the system is a ~2.2 km-wide box containing ~5 point objects and
at most 10 fully simulated ships that only exist within 900 u. The emptiness is
structural, not a tuning accident: the generator *validates* content into a
1000 u bubble.

## 2. Four independent causes, four independent levers

1. **Physical extent** — everything is inside 1400 u.
2. **Population** — 5 records average, 10 live cap, one spawn/frame.
3. **Perception** — nothing exists beyond the bubble, so space reads as a room.
4. **Structure** — one station, one field, ≤3 gates; all gameplay is a loop
   between them.

Trying to fix all four by raising the live NPC cap is the trap: NPC cost is
linear in *fully simulated* ships, and each is ~6 draw calls plus full-frame AI.

## 3. Design principle: sell population and size with presentation layers, not
simulation layers

Cost should scale with **near** ships, never with total ships. Proposed tiering:

| Tier | Distance | Representation | Simulation | Cap |
|---|---|---|---|---|
| Near | ≤900 u | full GLB LOD, combat, hail | full frame AI/physics | 10–14 |
| Mid | 900–2,500 u | **instanced** low-poly proxy (1–2 draw calls total) | 5–10 Hz coarse steering, no collision/combat | 30–40 |
| Far | 2,500–8,000 u | **instanced** billboard/point impostor (1 draw call) | 1 Hz from abstract record route | 150–300 |
| Deep field | 2,000–8,000 u | static meshes/sprites, no sim | none | budgeted by draw calls |
| Abstract | anywhere | JSON record (route, cargo, identity) | 1 Hz tick | 40–80/system |

This is the same pattern the codebase already uses successfully for asteroids
(instanced, one draw call per ore) and starfield (Points). The new work is to
apply it to traffic and to add a static deep-field layer.

## 4. Proposals, ranked by perceived impact per unit of risk

### P0 — Measure first (prerequisite, no gameplay change)

Add an opt-in perf probe and a live measurement script:

- `?perf=1` overlay: frame p50/p95, `renderer.info` draw calls/triangles,
  live counts by tier, abstract record count, asteroid matrix-write count.
- A CDP live probe in the existing `scripts/*-live-probe.mjs` harness style:
  spawn at station → fly to gate → dock → jump; sample 60 s.
- Record a baseline on the target hardware before any content is added.

Without this, "we did not kill performance" is an opinion. Budget targets below
are placeholders until the baseline exists.

### P1 — Deep-field scale layer (highest impact / lowest risk)

A new `src/systems/deepfield.js`, deterministic from the system seed, builds
static distant content at 1,800–8,000 u:

- 2–4 distant planet silhouettes (dark-side shading, radius 100–400 u),
  slow orbit; no collision, no landing.
- A companion star or second sun as an additive sprite for some systems.
- 1–2 orbital ring arcs / megastructure silhouettes (merged geometry).
- A beacon chain and 6–12 distant station lights (one Points layer).
- 3–6 low-opacity nebula sprites forming a band.
- Starfield shell radius tied to system extent instead of fixed 8,000–16,000.

Cost: ≤20 draw calls, ≤30k triangles, no per-frame CPU beyond slow rotations;
no save data; no new persistent fields. This is the cheapest way to make space
read as vast: parallax and depth cues at distances the player can see but not
reach. **Risk:** low; visual coherence and draw-call budget only.

### P2 — Far-traffic impostors and lane lights

- One `InstancedMesh` of a ~200-tri proxy hull (or Points billboards) with
  per-instance faction color, capacity ~200, driven at 1 Hz from abstract record
  positions. Hidden when the record is promoted to a real hull at 900 u.
- A separate Points layer of 200–300 "lane lights" moving along authored lanes.
- No AI, no collision, no combat, no thruster FX.

Cost: 1–2 draw calls, ~200 matrix writes/s. **Risk:** medium — it touches the
traffic record/live contract (`src/game/traffic.js`) and must not confuse
migration, escape, or save semantics. Keep the tier derived, never persisted.

### P3 — Population expansion with tier caps

- Grow cast data: traders 10–20, pirates 4–10, patrols 2–4, miners 2–4,
  drifters 4–8 → **25–50 records/system** (~3,000–5,000 galaxy-wide, up from
  549). Content is JSON data, so bundle bytes do not move.
- Keep near cap 10–14 (full sim); add mid instanced proxies capped 30–40 with
  5–10 Hz steering; far impostors capped 150–300.
- Add per-NPC tick LOD in `npc.js`: near = full frame; mid = 5–10 Hz; far =
  abstract only. Combat, collision, and hail stay near-only.
- Scale the coupling points that assume a small population: pirate bounty board
  cap 2/system (`src/systems/station.js:298`), HUD contact caps 16/24
  (`src/systems/hud.js:93`), nearby rows 12, market random walk 30 s
  (`src/game/market.js:33`), hangar cap 8 (`src/game/hangar.js:27`),
  hail single-card. Decide explicitly: ambient traffic is **not hailable**;
  only featured/nearest hulls enter contact lists.
- Abstract tick: 1 Hz for the current system, 0.2 Hz (5 s) for other banks, so
  growth does not multiply background CPU.

**Risk:** medium. The spawn loop is O(records × attempts) per frame
(`traffic.js:159-202`); at 50 records it is fine, at 500 it needs an index or
candidate prefilter. Save size grows with banks; measure it.

### P4 — Density inside the current bubble (cheap, do alongside P1)

- Raise the rock cap 160 → 600–800; add a second/third field per system.
- **Range-gate** asteroid updates: skip `setMatrixAt` and instanceMatrix upload
  beyond ~1,200 u; render the far belt as one Points layer. This *removes*
  current per-frame cost while adding content.
- Add 2–4 landmarks per generated system (currently exactly 1) and more wreck
  variety; static, reuses `src/systems/landmarks/*` and `derelict.js`.

**Risk:** low–medium (save sanitize cap, `FIELD_ORE_MAX_COUNT`, tumble
determinism, shard cap 96).

### P5 — Extent growth (the risky one; do last)

Two options:

- **P5a, ×2 playable extent** (radius ~2,500–3,000 u): scale orbit slots, gate
  radius, station spread, field distance. Raise cruise/burn proportionally
  (e.g. light cruise 120→200, burn 240→480) to keep 20–30 s crossings. Needs a
  tuning pass on dock approach, autopilot arrival tolerance, collision damage
  (`IMPACT_SCREEN_PER_U`), agent-API steering gains, job distance pay, launch
  clearance, and the three duplicated planet-slot tables
  (`solarsystem.js:170`, `asteroids.js:96`, `courier-shadow.js:39`).
- **P5b, sub-regions**: multiple content clusters separated by 3,000–8,000 u,
  connected by a fast in-system transit lane. Biggest structural change;
  touches nav/jump/save. Only if P5a still feels small.

**Risk:** high. Save compatibility is the blocker: persisted record routes are
absolute positions, so changing system layout invalidates old banks. Needs a
save-version bump and a deliberate bank-regeneration or route-transform policy.
Float precision is safe below ~8,000 u (1 u = 3.64 m), but not free beyond.

### P6 — Legibility: in-system chart view

Extend the galaxy chart with a local system view: orbits, station, gates,
fields, landmarks, and traffic tiers as a DOM/SVG overlay. Zero render cost,
makes the (now larger) system readable and navigable. Low risk; watch the
existing chart overlay ownership/keys contract.

### P7 — Ambient life (the multiplier)

Distant traffic only feels like a population if it *speaks*: comms chatter from
far lanes, event references to distant locations, convoy surges, visible station
approach lanes. Text/event work only, no new meshes; reinforces P1–P3.

## 5. Budgets and guardrails (Phase 0 baseline measured)

Phase 0 measured the baseline and wrote the reproducible protocol and budgets to
[ProductionPerformanceBudget.md](ProductionPerformanceBudget.md). The table
below is the Phase 1–4 comparison budget; the headless baseline's p50/p95 frame
cadence is ~31 ms, so use same-harness relative frame time plus per-subsystem CPU
and draw calls rather than an absolute display-refresh number.

| Budget | Target |
|---|---|
| Frame p95 on baseline hardware | ≤ 20 ms before/after (no regression > 1 ms CPU) |
| Draw calls added | ≤ 25 (deep field ≤ 20, impostors ≤ 2, mid proxies instanced) |
| Near full-detail NPC cap | 10–14 (current 10) |
| Mid proxy cap | 30–40, instanced, 5–10 Hz |
| Far impostor cap | 150–300, 1 Hz |
| Abstract records | 40–80/system, current system 1 Hz, others 5 s |
| Bundle growth | ≤ 50 KB (content is data; new modules are small) |
| Memory | shared instanced geometry, no per-instance material clones |

Adaptive quality (only if P0 shows headroom is thin): frame p95 > 20 ms for 3 s
→ pixelRatio 2→1.5→1, reduce deep-field/nebula opacity, cut mid-proxy cap,
disable asteroid tumble. Never degrade near gameplay or combat readability.

## 6. Risks and open questions

- **Save compatibility** for P5: record routes/positions are persisted; a layout
  change needs a version bump and a regeneration policy.
- **Duplicated planet-slot tables** must stay in sync (three files today).
- **Discovery radii** (100 u landmark, 35 u clue) become harder to hit in a
  larger system; scale them or add chart marks.
- **HUD invariants**: new gauges/keys/persistent fields need explicit issue
  scope (AGENTS.md). Prefer reusing existing contact/nearby rows with paging.
- **Agent API**: `observe()` schemas and caps assume a small population; verify
  before raising counts.
- **Combat/dock safety**: more hulls near the station can block approach lanes;
  keep featured encounters spaced and ambient hulls out of the docking corridor.
- **Phase 0 now supplies measured frame times** (`?perf=1` overlay and
  `npm run test:perf-live`). Later phases still must attach before/after probe
  evidence; a content phase may not claim "no perf regression" without it.
- **Live browser verification** is mandatory for feel/motion changes
  (AGENTS.md), not just `test:boot`.

## 7. Recommended sequence

1. **Phase 0** — perf instrumentation + baseline (implemented in #337; no
   gameplay change).
2. **Phase 1** — P1 deep field + P2 far impostors + P4 density/range-gating
   (1–2 issues). Biggest perceived-size gain at near-zero sim cost. Measure.
3. **Phase 2** — P3 population tiers + abstract growth + coupling caps
   (1–2 issues). Measure; tune job/market/contact limits.
4. **Phase 3** — P5 extent ×2 + P6 in-system chart (only if Phases 1–2 prove
   headroom). Highest risk; needs a save-migration decision.
5. **Phase 4** — P7 ambient life.

Each phase ends with: `npm run build`, `npm run test:boot`, a live browser
flow (station → lane → gate → jump), the perf probe numbers, and a written
before/after. Park any follow-up as its own issue rather than expanding scope.

## 8. What not to do

- Do not raise `MAX_LIVE` to 40–50 full GLB hulls; cost is linear and each hull
  is ~6 draw calls plus full-frame AI.
- Do not run full AI/physics for ships the player cannot see; tier them.
- Do not scale the world 3× without a speed/pacing pass; longer legs also make
  abstract traffic *slower*, silently thinning encounters
  (`src/game/world.js:1457-1461`).
- Do not add shadows or post-processing to buy atmosphere; there is currently
  none, and the deep-field layer is cheaper.
- Do not clone materials per NPC; share/instance.
- Do not claim "no perf regression" without the P0 probe.

## 9. Smallest credible first step

Phase 0 (#337) already ships the probe and the measured baseline, so the next
bounded issue is **"Deep field + far-traffic impostors"** (Phase 1, #338).
No gameplay contract changes, no save changes, no new persistent fields.
Expected outcome: the system reads as many times larger and busier, measured
against the Phase 0 baseline, with the population tiering (P3) as the next
issue.

## 10. Phase 2 status (issue #339)

Phase 2 (P3 population tiers + abstract growth + coupling caps) is implemented
on `dsh/issue-339-ai-population-tiering-abstract-growth-mi`. The issue's
acceptance criteria supersede the placeholder numbers above where they differ
(records 25–50/system, not 40–80; far impostors begin at 2,500 u so the mid
band has room).

- **Cast growth** is content-only and deterministic: authored/generated systems
  carry a `crowd` count and `world.js` appends crowd records after the
  featured cast using a per-system/per-role deterministic RNG (zero global
  `Math.random` draws, so the boot harness's seeded stream and the #201 route
  fixture stay intact). Banks now hold 25–47 records/system (galaxy 3,210 vs
  the 549 baseline); names are unique and deterministic, crowd pirates carry
  bounty 0 so the explicit bounty-board cap stays 2, and crowd ids live in a
  separate namespace so legacy `rec-N` ids do not shift. No save-format
  change: the same record schema persists; only the record count grows.
- **Tiers** are derived from distance and never persisted:
  near ≤900 u (full hull, combat/collision/hail, cap 10), mid 900–2,500 u
  (one 40-capacity instanced 8-triangle proxy layer at 8 Hz, presentation
  only), far >2,500 u (the Phase 1 256-capacity impostor layer). The mid layer
  hides a record while it is live or terminal and re-hides promoted records
  every frame, so the near/mid/far handoff has no duplicate hull.
- **AI tick LOD**: near hulls keep full-frame AI/physics/combat; live hulls in
  the 900–1,400 u hysteresis band step at 8 Hz with a session-only accumulator,
  a dead-reckoned pose and an immediate boundary step, while mesh animation
  stays per-frame; combat, collision and hail remain near-only. No persisted
  field.
- **Abstract tick LOD**: the current system bank ticks at 1 Hz as before; every
  other visited bank ticks at 0.2 Hz (1/5 real time) with a session-only
  throttle. Migration/transit/restore paths are untouched.
- **Coupling caps** were reviewed and pinned, not raised: pirate bounty board 2,
  contact rows 24 (16 MK1), nearby rows 12, market walk 30 s, hangar 8,
  single-card hail. Ambient traffic stays out of contact lists; only featured
  and nearest hulls enter them.
- **Dock-lane blockage control**: sustained live traffic can push the dock
  helm inside the sun's heat keep (a crowd traffic sidestep cut the tangent at
  cruise speed). The shared planner's inside-tangent waypoint then points
  inward, so the hull rings the keep until the 10 s blocked watch cancels the
  leg. A private cruise correction (`dockCruiseKeepExitAim` in
  `src/game/dock-cruise.js`, called only by the dock helm) keeps the planner's
  lateral side but originates a 45-degree outward course from a static keep
  sphere (sun/station/planet); it vetoes every other keep sphere and leaves
  gates, traffic and the stage corridor to their existing policies. The shared
  tangent planner and `dockCruiseExitAim` are untouched, and there is no
  persisted field. Pinned by `scripts/issue-339-dock-escape-test.mjs` (26
  cases) in `npm run test:boot`.
- **Save-size delta** measured: the persisted record-bank JSON grows from
  289,322 B (549 records) to 1,694,277 B (3,210 records), +485.6%; the legacy
  549-record subset is byte-identical and only visited systems persist
  (~12–24 KB per visited system). Accepted because abstract records are the
  population data and no save format changed; a bank-compaction pass is parked
  for a later phase if a full-galaxy save becomes a concern.

Verification on the final artifact: `npm run build` and `npm run test:boot`
pass (including the six focused #339 tests and the 26-case dock-escape pin).
The 600 s production live probe passed with 8 completed dockings over 8 legs
(3 blocked cancels, one retry each on three legs), authored cast 42–47 and first
observed bank equal to it, live bank 34–52, mid proxies 0–36/40, far 0/256, no
duplicate hull/proxy/impostor, zero hails, clean console and a stable source
hash. The perf probe passed with frame p50 32.5 / p95 33.3 / p99 33.75 ms, draw
calls 58 median / 115 max, triangles 134,080 median (below Phase 1), matrix
writes unchanged 113/163 and CPU ~1.05 ms top-10 sum; its 60 s window ended on
the Veridian corridor approach, and the sustained-flight probe proves the dock
lane still completes. Measured evidence lives in the untracked
`out/issue-339-live/` and `out/issue-337-live/` directories.

Phase 2 leaves Phase 3 (P5 extent + P6 in-system chart) as the next planned
phase; it needs the save-migration decision and should reuse these derived
tiers.

## 11. Phase 4 status (issue #341)

Phase 4 (P7 ambient life) is implemented. It is text/event work plus a reuse of
the Phase 2 instanced proxy layer; it ships no new mesh, no new simulation, no
new player key, no aim-glass digit and no new persistent field.

- **Distant-traffic comms** — `src/game/distant-chatter.js` voices short,
  rate-limited `commLine` lines from non-live MID/FAR abstract records (never a
  live hull) on the existing comms/toast channel. Cadence is band-scaled through
  the authored `BANDS[].chatterMult` pacing table (core 1.0 → Verge 0.05), with
  an absolute floor so even the busiest core lane cannot flood the five-toast
  cap. Every pick (speaker, gate reference, template, gap) is an FNV/xorshift
  hash of the system id and a session line counter, so the module consumes ZERO
  global `Math.random` draws and the boot harness's seeded stream is untouched.
  Lines name the current station and a real gate destination system (a place
  beyond the player's bubble). The lanes are suppressed while docked, in a berth
  overlay, on a hail card, reading the chart, or mid-jump, and the timer resets
  on a real system change.
- **Convoy / far-lane event variant** — owner decision recorded: this is a
  variant of the existing `convoySurge` event, not a new event kind. Its start
  payload names the current station and a gate destination system (e.g.
  "Convoy inbound from Veridian Reach — Freehold Landing approach stacked.").
  Selection is a stable per-system hash (rim bands always far-lane); the
  guaranteed first scheduled dynamic event of each newly loaded system is the
  far-lane convoy so the outcome is observable in a normal flight window, and
  later events stay random with the existing band-scaled gaps. The persisted
  `ctx.world.activeEvent` object keeps its exact
  `{kind, startedAt, endsAt, system}` shape: the variant and line ride only the
  session-only `worldEvent` payload consumed by the HUD toast.
- **Station approach-lane traffic** — `src/systems/mid-traffic.js` extends its
  existing ONE 40-capacity instanced proxy layer inward: uninstantiated,
  non-terminal records inside the 900 u bubble now draw as proxies, so queued
  or docked station-hold traders and over-cap lane traffic stay visible instead
  of vanishing when `traffic.js` cannot instantiate them (live cap 10; only
  `state === 'enroute'` hulls instantiate). A record promoted to a live hull
  hides its proxy on the next update (`hidePromoted`), far-traffic keeps the
  >2,500 u band, and no record is drawn twice. This adds no draw call and no
  simulation.

No new persistent fields, save-format change, HUD key or aim-glass digit were
added. Live evidence and the focused pins are recorded in
[REMAINING-WORK.md](REMAINING-WORK.md) and
[ProductionPerformanceBudget.md](ProductionPerformanceBudget.md).
