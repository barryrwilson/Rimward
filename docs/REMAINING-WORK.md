## Navigation: P5b connected in-system sub-regions + fast transit lanes — #355

Implemented on `dsh/issue-355-navigation-p5b-connected-in-system-sub-r`
(base master `46806ec`, which includes Phase 3 #340 and Phase 4 #341).
Follows the owner decision after #340 (P5b) and the design input in
[P5B-SUBREGIONS-DESIGN.md](P5B-SUBREGIONS-DESIGN.md). No new persistent field,
save-format change (envelope stays v2), player keybinding or aim-glass digit.

- `src/game/authored-systems.js`, `scripts/generate-galaxy.mjs`,
  `src/game/galaxy.generated.js`: data-only `regions` (1–3 per system,
  ids `<sysId>_r<n>`, kinds outpost/field/wreck/anomaly, centers 3,500–8,000 u
  on x/z, discs 180–420 u, ≥500 u clear of every pre-P5b anchor and each
  other) and `lanes` (`core -> r1 -> ...` chains, every leg ≤ 8,000 u) on 4
  authored + all 94 generated systems. The generated pass rides its own
  `SEED + 4` stream (the brief's `SEED + 3` slot was already taken by the
  #340 landmark-position fallback), consumed in `GENERATED_IDS` order after
  the contact loop, so the diff is purely additive: every pre-P5b authored AND
  generated field is byte-identical to the base commit, and generator
  `validate()` gained the region/lanes invariants. The existing content disc
  stays region 0 implicitly, unnamed in data.
- `src/game/regions.js` (new, pure): region membership derived from position
  at read time (never persisted), corridor capsule tests, the session-only
  corridor envelope — the ship's existing cruise/burn envelope ×2.2 inside a
  lane (freighter sustains 528 u/s, the ≥500 u/s pin; light 1,056 u/s), ~1 s
  decay on exit, per-ctx WeakMap state — and the region/lanes validator.
- `src/systems/regions.js` (new): deepfield-family scenery built from
  existing builders only — one far-scenery Points layer per region, one
  LineSegments lane chain, one beacon Points layer (≤5 draw calls, 0
  triangles); rebuilt and disposed on `systemLoaded`, `reducedMotion`
  parity. `src/main.js` slots it with the deepfield family; init order
  otherwise untouched.
- `src/systems/ship.js`: the only flight change — the corridor multiplier
  rides the two forward-envelope computations (rock-match and normal path);
  pad governor, docking, combat and drift are untouched.
- `src/systems/systemchart.js`: the System view grows a layer — region rings
  + names, lane lines, a current-region highlight refreshed on the 0.5 s
  tick (DOM/SVG only, no THREE, no renderer-count change);
  `SYSTEM_CHART_MAX_EXTENT` and the player clamp rise 2,800 → 8,000 u.
  Galaxy chart, nav guidance, agent observe schemas, world.nav and the event
  vocabulary are unchanged.
- Pacing pins: region-to-region leg ≤ 20 s at corridor speed for the slowest
  hull class (worst measured leg 15.0 s freighter / 7,916 u), station →
  farthest region ≤ 60 s along the lane chain (worst 16.4 s light). The four
  existing #340 pacing pins pass verbatim; the #340 extent/chart suite pins
  were re-derived for the two new def keys without weakening the pre-P5b
  field guarantees.
- Focused suite wired into `test:boot`:
  `scripts/issue-355-regions-test.mjs` (142 checks: placement invariants for
  every system, byte-additivity vs the base commit, corridor speed bounds,
  multiplier ramp/decay, chart model regions/lanes/current, rebuild+disposal,
  asteroid id===index untouched, no WORLD_FIELDS entry, v2 snapshot restore).
  Live probe `scripts/issue-355-live-probe.mjs`
  (`test:issue-355-live`, production build): corridor flown end-to-end at
  14.8 s / 528 u/s sustained, chart regions/lanes/highlight verified with
  zero scene children added, pre-P5b v2 save restored byte-identically
  (position delta 0), console 0 errors.
- Verification: `npm run build` passes (2,087.15 KiB minified / 629.37 KiB
  gzip; +34 KiB, inside the ≤50 KB phase budget) and the full
  `npm run test:boot` chain passes. Perf evidence per
  [ProductionPerformanceBudget.md](ProductionPerformanceBudget.md): frame
  p50/p95 unchanged (32.5/33.2 ms vs base 32.5/33.3), draw calls 58.5 median
  / 96 max (base 58.5 / 102), triangles −1,083, before/after table recorded.
- Parked follow-ups: region guidance markers for nav-guidance (design §2.2
  keeps them out of v1); region belt mining (the 160 asteroid cap binds, so
  region belts are Points scenery in v1 per the design); corridor flavor on
  the `commLine` channel.

## System scale/population Phase 3: ×2 playable extent + in-system chart — #340

Implemented on `dsh/issue-340-navigation-expand-playable-system-extent` (base
master `68e89d9`, which includes Phase 4 #341). Phase 3 of the
[SystemScalePopulationDesign.md](SystemScalePopulationDesign.md) plan. Owner
decisions recorded for this phase: **P5a, a uniform ×2 playable extent with a
speed/pacing pass** (not P5b sub-regions); **old saves migrate by transforming
persisted positions ×2 at load, with a save envelope v2 that accepts v1 and no
bank regeneration**; and **the in-system chart ships in the same PR**. No new
persistent fields, player keys, or aim-glass digits.

- `src/game/authored-systems.js`, `scripts/generate-galaxy.mjs`,
  `src/game/galaxy.generated.js`: every authored/generated station, field
  centre, gate, hub, landmark and clue is ×2 on x/z; y is authored and
  unchanged. Generator validation and the landmark bubble/separation invariants
  are scaled with the layout (one 1/94 landmark, `fh_kinhold`, is re-solved
  off-stream because its authored y plus the doubled 3D separation pushed it
  past the bubble; documented in the generator). Field radii are ×2; the
  playable ceiling is ~2,800 u.
- `src/systems/solarsystem.js`, `src/systems/asteroids.js`,
  `src/game/courier-shadow.js`: the three planet-slot tables agree at orbit
  radii 500/840/1,280/1,840/2,800 (radii unchanged) with `ORBIT_K` 1500 and
  the doubled periods documented. `src/systems/deepfield.js` BAND_MIN 3200
  (planets 3200–6800, ring 3600–7200, beacon 3600–4200, nebula 4000–8000,
  companion 5200–8000); `src/systems/starfield.js` extent reference 2200;
  asteroid far scenery 3000 + rng·2000 with the existing 600–800 density band.
- Speed/pacing pass: ship-class cruise/burn ×2 (light 240/480, heavy 180/360,
  freighter 120/240, ace 270/540, cutter 210/420, frigate 44/90; creep, turn,
  stopTime unchanged), dock approach ranges and JUMP zone/arrival offset
  scaled, collision damage parity by halving `IMPACT_SCREEN_PER_U`, discovery
  radii (landmark/clue/wake) scaled, combat projectile speed/range ×2 with
  damage/rof/heat unchanged. Measured travel: station→gate 0.97–6.78 s at
  burn, station→outer POI 3.90–12.87 s, full diameter 11.67 s burn / 23.33 s
  cruise — no >60 s dead leg. Hop-based pay/deadlines are unchanged, so the
  economy is not re-based.
- `src/game/save-migrate.js` (new, pure): `SAVE_VERSION` 2, `V1_POSITION_SCALE`
  2, `scaleSnapshotPositions`, `migrateSnapshotV1ToV2`,
  `demoteSnapshotV2ToV1`; x/z only, y/velocities/quaternions untouched, leg
  lengths recomputed, fail-safe. `src/game/save.js` writes v2 and accepts v1
  autosave/berth/slot snapshots at load (key names unchanged); raw in-memory
  fixtures passed to `restore()` are intentionally not migrated.
- `src/systems/systemchart.js` (new) + `src/systems/galaxychart.js`: a
  Galaxy|System switch inside the existing chart overlay; the existing KeyM /
  Escape bindings open/close it, no new key. Pure model + DOM/SVG (no THREE),
  text-safe APIs, 0.5 s refresh, near/mid/far traffic tiers, contrast and
  colorblind overrides in `src/ui/hud.css`; renderer draw calls and
  scene/geometry/texture counts are unchanged.
- Focused suites wired into `test:boot`: `scripts/issue-340-extent-test.mjs`
  (3,924 checks), `issue-340-pacing-test.mjs` (75),
  `issue-340-save-migration-test.mjs` (79) and `issue-340-chart-test.mjs`
  (15). The production-build live probe `scripts/issue-340-live-probe.mjs` is
  a separate `test:issue-340-live` run because it needs `vite preview`. The
  extent suite reads its pre-x2 baseline from the branch base commit via git;
  in the shallow CI checkout it falls back to `raw.githubusercontent.com` for
  this public repo, and skips only the migration diff (with an explicit notice)
  if neither source is reachable.
  Existing boot pins/fixtures were updated for the new scale (v2 envelope,
  landmark invariants, dock/arrival/respawn/combat fixtures); no assertion was
  removed, only stale pre-scale pins/geometry were re-derived from the live
  owners.
- Verification: `npm run build` passes (2,052.81 KiB minified / 621.32 KiB
  gzip; the JS chunk is 2,102,074 bytes minified / 636,230 gzip) and the full
  `npm run test:boot` chain passes (boot-test plus 42 focused segments,
  including the four #340 suites). Live Chrome against the production build:
  station→gate 15.0 s, arrival→dock 37.0 s, undock→dock 53.0 s, jump; KeyM
  opens/closes the chart, the System view renders, and with the sim frozen the
  chart changes 0 draw calls / 0 scene children / 0 geometries / 0 textures;
  manual flight reaches the 240 u/s cruise and docks; a demoted v1 save
  restores with x/z ×2 exactly once (116.5→233), the next dock writes envelope
  v2, and a second load keeps 233 (no double-scale); console 0 errors / 0
  exceptions. Frame p50 18.0 / p95 18.7 / p99 19.0 ms, draw calls 72.5 median
  / 114 max, triangles 131,707 median, NPC max 10, records 47 current / 89
  galaxy; evidence and the before/after table are in
  [ProductionPerformanceBudget.md](ProductionPerformanceBudget.md).
- Parked follow-ups: P5b sub-regions remain the "only if P5a still feels
  small" option; gate radial rounding may exceed 2400 by <1 u; one landmark
  fallback noted above.
## Ambient life: distant-traffic comms, convoys, and far-lane events — #341

Implemented on `dsh/issue-341-ai-ambient-life-distant-traffic-comms-co`
(base master `b0a1259`). Phase 4 of the system scale/population plan (#337 is
the Phase 0 measurement gate; #338 Phase 1, #339 Phase 2; #340 Phase 3 is
implemented with the owner save-migration decision recorded above). Ships no new persistent
field, no save-format change, no player keybinding and no aim-glass digit.

- `src/game/distant-chatter.js` voices short, rate-limited `commLine` lines
  from non-live MID/FAR abstract records (distance > `NEAR_RANGE`, never a live
  hull) on the existing comms/toast channel. Cadence is band-scaled through the
  authored `BANDS[].chatterMult` pacing table (core 1.0, Hush 0.1, Verge 0.05)
  with a 12 s absolute floor; every pick (speaker, gate reference, template,
  gap) is an FNV/xorshift hash of the system id and a session counter, so the
  module consumes zero global `Math.random` draws (the boot harness's seeded
  stream and the #201 route fixture stay intact). Lines name the current
  station and a real gate destination system (a place beyond the player's
  bubble); the lanes are suppressed while docked, in a berth overlay, on a hail
  card, reading the chart, or mid-jump, and the timer/counter reset on a real
  system change. Session-only timer/counter in the world closure; no record or
  `ctx.world` mutation.
- `src/game/world.js` adds the convoy/far-lane event variant (owner decision:
  a variant of the existing `convoySurge` event, not a new event kind). Its
  start `worldEvent` payload carries a session-only `variant` and a
  place-referencing `line` (e.g. "Convoy inbound from Veridian Reach —
  Freehold Landing approach stacked."); the persisted
  `ctx.world.activeEvent` object keeps its exact
  `{kind,startedAt,endsAt,system}` shape. Selection is a stable per-system hash
  (rim bands always `farLane`); each newly loaded system's first scheduled
  dynamic event is the guaranteed far-lane convoy so the outcome is observable
  in a normal flight window, later events stay random. The scheduler always
  consumes the pre-#341 event-kind `Math.random` draw and mimics the one extra
  commodity draw a rolled `commodityGlut` would make, so the boot harness's
  seeded stream stays byte-identical while the kind is overridden.
- `src/systems/mid-traffic.js` extends the existing ONE 40-capacity instanced
  proxy layer inward: uninstantiated, non-terminal records inside the 900 u
  bubble now draw as proxies, so queued/docked station-hold traders and
  over-cap lane traffic stay visible instead of vanishing when `traffic.js`
  cannot instantiate them (live cap 10; only `state === 'enroute'` hulls
  instantiate). `hidePromoted` hides a proxy on the next update once its record
  becomes live, far-traffic keeps the >2,500 u band, and no record is drawn
  twice. Adds no draw call, no simulation and no new mesh; session-only
  `nearProxyCount`/`nearProxyIds` on the mesh `userData` are the test evidence.
- `src/systems/hud.js` shows the convoy start line through the existing
  `worldEvent` toast branch (plus a convoy copy for generic/end phases);
  `src/core/ctx.js` documents the optional `worldEvent` variant/line payload.

Focused regressions are `scripts/issue-341-ambient-life-test.mjs` (26 pins:
band-scaled cadence and no-flood bounds, non-live distant speaker, place
references, overlay/jump suppression, system-change reset, zero
`Math.random` draws, no `ctx.world`/record mutation, deterministic convoy
variant/line and the real-boot first-event convoy with the persisted
`activeEvent` shape) and `scripts/issue-341-approach-lane-test.mjs` (26 pins:
docked/queued station-hold records visible as near proxies, live/terminal
hidden, far split and 8 Hz/one-layer/cap/heading/colour preserved, promotion
hides the proxy on the next update, no ctx field or record mutation).
`scripts/issue-339-tier-test.mjs` carries a bounded pin update for the
expanded Phase 4 mid-layer contract (near uninstantiated records now visible;
live/terminal exclusions and the >2,500 u far split unchanged) with a rationale
comment. All three are wired into `npm run test:boot`.

Verification: `npm run build` passes (vite 6.4.3; bundle policy 2035.17 KiB
minified / 615.85 KiB gzip; `dist/assets/index-B6F43cv1.js` 2,084.02 kB
minified / 630.63 kB gzip; +7.47 kB minified / +2.51 kB gzip vs the Phase 2
artifact, within the ≤50 KB per-phase budget). `npm run test:boot` exits 0
end-to-end (`BOOT TEST PASS — no update errors`, `ISSUE #341 AMBIENT LIFE
PASS (26 checks)`, `ISSUE #341 APPROACH LANE PASS (26 checks)`, unchanged
#339 suites pass). The final 600 s production ambient-life probe
(`npm run test:ambient-live`, `?agent=1&perf=1`, untracked
`out/issue-341-live/ambient-life/`) passed: 600/600 one-second samples, 9
completed Freehold↔Veridian legs, 17 distant chatter lines (14 unique speakers,
all non-live enroute records beyond 900 u; every line names a real place;
within-system gaps ≥22 s with zero violations and a single 19.68 s cross-system
reset; toast cap max 5, chatter toasts max 1), one far-lane `convoySurge`
start (variant `farLane`, line naming Veridian Reach + Freehold Landing; the
persisted `activeEvent` shape stayed exactly
`{kind,startedAt,endsAt,system}` and was observable in 159 samples), near-band
approach-lane proxies max 37 overall / 36 at docked or approaching samples
across 441 positive samples with zero persistent or transient live+proxy
duplicates, zero console errors/exceptions and a stable runtime source hash
(`f7b78654…`, matching the boot log). `npm run test:perf-live` passed on the
same artifact: frame p50 18.0 / p95 18.7 / p99 19.1 ms (headless cadence; no
regression), draw calls 62.5 median / 113 max (+4.5 median vs Phase 2, under
+≤25), triangles 135,616 median (+1,536, under +≤30k), live near cap 10,
abstract current bank max 47, CPU top-10 sum ~0.73 ms, zero console errors and
a stable source hash. Bundle growth is +7,465 bytes minified / +2,511 bytes
gzip vs the Phase 2 artifact (within the ≤50 KB phase budget).

Parked: the chatter cadence uses the authored `chatterMult` values unchanged;
the Hush/Verge stay near-silent by design. Ambient chatter is comms-only (no
new hail card, no contact row, no agent command). The guaranteed first convoy
per visited system is a presentation/observability decision, not a new market
event kind. The mid layer's nearest-first cap means a busy approach lane can
crowd out distant mid-band proxies (intended relevance ordering). Phase 3
(#340) still needs the save-migration decision.

## Deep-field scale layer, far-traffic impostors, and asteroid density — #338

Implemented on `dsh/issue-338-world-deep-field-scale-layer-far-traffic`
(base master `2c9fe41`). Phase 1 of the system scale/population plan (#337 is
the Phase 0 measurement gate; #339–#341 are later phases). Ships no persistent
field, no save-format change, no player keybinding and no aim-glass digit.

- `src/systems/deepfield.js` builds a deterministic per-system deep field at
  1,800–8,000 u: 2–4 planet silhouettes, an optional companion star, 1–2
  ring/megastructure silhouettes, one beacon-chain + 6–12 station-light Points
  layer, and 3–6 nebula sprites. Measured across all 101 systems: max 15 draw
  calls / 2,574 triangles (issue budget ≤20 / ≤30k). Rebuilt and disposed on
  `systemLoaded`; `reducedMotion` freezes rotation; no collision/AI/save.
- `src/systems/starfield.js` ties the starfield shell scale to system extent
  (clamped 0.9–1.15) and preserves the band-opacity/parallax/reducedMotion
  behavior; layers are not rebuilt per jump.
- `src/systems/far-traffic.js` renders abstract records outside the
  instantiation bubble as ONE 256-capacity instanced proxy layer at 1 Hz with
  per-instance faction colour. An impostor is hidden while its record is live
  or within the 900 u instantiation range, so there is no duplicate hull at the
  handoff. Presentation-only: no AI/collision/combat/persistent fields.
- `src/game/asteroid-fields.js` + `src/systems/asteroids.js` raise the
  system-wide asteroid density to 600–800 objects through 2–3 deterministic far
  fields rendered as ONE Points layer (1 draw call, 0 triangles, no matrix
  writes). The minable instanced belt keeps its 9-ore structure, 160 cap, tumble
  determinism, `#149` respawn and save caps; instance matrix writes are
  range-gated at 1,200 u (writes 113 median / 163 max vs the Phase-0 113/191).
- `src/game/random-scope.js` wraps new scene construction so THREE's
  UUID-driven `Math.random` draws do not shift the boot harness's seeded
  content stream (this was required to keep the issue-201 route fixture and the
  agent-API playtest deterministic).
- `scripts/issue-338-scale-layer-test.mjs` pins determinism, budgets,
  teardown/resource disposal, the 900 u handoff helper, the 600–800 density and
  the range-gated matrix writes; it is wired into `npm run test:boot`.
  `scripts/issue-338-live-visual-probe.mjs` is the live production visual
  probe (screenshots + scene checks).

Verification: `npm run build` passes (2,061,710 bytes minified / 625,430 gzip;
+11,988 / +4,130 vs the Phase-0 artifact, within the ≤50 KB phase budget).
`npm run test:boot` exits 0, including the focused #338 pins and the existing
wave51/wave69/#149 asteroid checks. The production perf probe (same machine and
harness as #337) passed with zero console errors/exceptions: frame p50 32.5 ms
/ p95 33.35 ms (+1.2 / +1.55 ms, under the 2 ms limit), draw calls 65 median /
109 max (+2 / +15, under +≤25), triangles 147,834 median (below baseline),
matrix writes 113 / 163 (no growth), CPU total 1.10 ms, bundle +11.7 KiB. The
live visual probe passed with screenshots at the station, lane, gate and route
end: deep field 12 draw calls / 1,644 triangles at Freehold, 256-capacity
impostors with no duplicate of a live hull, and 481–639 far-belt points per
system. Evidence is untracked under `out/issue-338-live/`.

Parked: no CI frame-time gate yet (same Phase-0 decision); the far belt is
presentation-only by design (not minable, no save data); Phase 2 (#339) reuses
the impostor infrastructure; a low-end hardware profile can be baselined
separately without changing this workstation baseline.

## Population tiering: abstract growth, mid-tier proxies, and AI tick LOD — #339

Implemented on `dsh/issue-339-ai-population-tiering-abstract-growth-mi` (base
master `771c8bb1`). Phase 2 of the system scale/population plan (#337 is the
Phase 0 measurement gate, #338 Phase 1; #340–#341 are later phases). Ships no
new persistent record field, no save-format change, no player keybinding and no
aim-glass digit.

- Cast growth is content-only and deterministic: authored systems and
  `scripts/generate-galaxy.mjs` carry a `crowd` count, and `world.js` appends
  crowd records after the featured cast with a per-system/per-role RNG that
  consumes zero global `Math.random` draws (the boot harness's seeded stream
  and the #201 route fixture stay intact). Every bank is 25–47 records/system
  (galaxy 3,210 vs the 549 baseline), names are unique and deterministic, crowd
  pirates carry bounty 0 so the explicit bounty-board cap stays 2, and crowd ids
  use a separate namespace so legacy `rec-N` ids do not shift. The record
  schema and save format are unchanged; only the record count grows.
- `src/game/traffic-tiers.js` owns the derived tier constants: near ≤900 u,
  mid 900–2,500 u, far >2,500 u; near cap 10, mid cap 40, far cap 256.
- `src/systems/mid-traffic.js` renders the mid band as ONE 40-capacity
  instanced 8-triangle proxy layer at 8 Hz with per-instance faction colour,
  coarse heading to the record's next waypoint, and `reducedMotion` support. It
  hides live/terminal records and records outside the band, re-hides promoted
  records every frame (`hidePromoted`), rebuilds/disposes on `systemLoaded`,
  and adds no persistent field. Presentation-only: no AI, collision, combat or
  hail.
- `src/systems/far-traffic.js` keeps the Phase 1 256-capacity impostor layer
  but starts it beyond the mid band (2,500 u), so the three tiers do not overlap.
- `src/systems/npc.js` adds AI tick LOD: near hulls (≤900 u) keep full-frame
  AI/physics/combat; live hulls in the 900–1,400 u hysteresis band step at 8 Hz
  with a session-only accumulator, a dead-reckoned pose, an immediate boundary
  step, per-frame mesh animation and reduced-rate escape; combat, collision and
  hail stay near-only. `MAX_LIVE` remains 10.
- `src/game/world.js` adds abstract tick LOD: the current system bank ticks at
  1 Hz as before, every other visited bank ticks at 0.2 Hz (1/5 real time) with
  a session-only throttle reset on a real system change. Migration, transit
  registry, same-system restore and gate-linger paths are untouched.
- `src/systems/perf.js` exposes the near/mid/far caps and the mid/far visible
  counts in the `?perf=1` overlay and `snapshot()`, so the caps are observable.
- Dock-lane blockage control: sustained live traffic can push the dock helm
  inside the sun's heat keep (a crowd traffic sidestep cut the tangent at cruise
  speed), where the shared planner's inside-tangent waypoint points inward and
  the hull rings the keep until the blocked watch cancels. A private cruise
  correction (`dockCruiseKeepExitAim` in `src/game/dock-cruise.js`, called only
  by the dock helm) keeps the planner's lateral side but originates a 45-degree
  outward course from a static keep sphere (sun/station/planet), vetoes every
  other keep sphere, and leaves gates, traffic and the stage corridor to their
  existing policies. The shared tangent planner and `dockCruiseExitAim` are
  untouched; no persisted field. Pinned by
  `scripts/issue-339-dock-escape-test.mjs` (26 cases) in `npm run test:boot`.
- Coupling caps were reviewed and pinned, not raised: pirate bounty board 2,
  contact rows 24 (16 MK1), nearby rows 12, market walk 30 s, hangar 8,
  single-card hail. Ambient crowd traffic stays out of contact lists; only
  featured and nearest hulls enter them.
- Focused tests: `scripts/issue-339-tier-test.mjs` (30 pins: caps, layer,
  8 Hz, colour, handoff, nearest-first, rebuild/dispose, no mutation),
  `scripts/issue-339-tick-lod-test.mjs` (16 pins),
  `scripts/issue-339-abstract-tick-test.mjs` (11 pins),
  `scripts/issue-339-coupling-test.mjs` (30 pins: caps, bank counts, save
  delta, boot observability) and `scripts/issue-339-dock-escape-test.mjs`
  (26 pins: the recorded run-3 sun-keep poses at several bearings, heat-zone
  and station-body cases, the outside/annulus bounds, gate and traffic
  exclusions, other-keep veto, fail-closed inputs); all are wired into
  `npm run test:boot`. `scripts/issue-339-live-probe.mjs` is the 10-minute
  production live probe (`npm run test:population-live`).
- Two pre-existing fixtures needed bounded updates because #339 changed their
  assumptions, not their contracts: `scripts/issue-272-hunt-supply-test.mjs`
  now waits for a NEW reaver under its forced veteran-band RNG (earlier seeded
  picks already set `reaverTier`, and the larger crowd banks shifted the
  seeded stream), and `scripts/issue-307-respawn-heading-test.mjs` sweeps the
  near-tier refill after its clear tick so a freshly spawned ambient hull
  cannot hold the departure lane. Both still assert their original outcomes.

Verification: `npm run build` passes (2,076.55 kB minified / 628.12 kB gzip;
+14.8 kB minified / +2.7 kB gzip vs the Phase 1 artifact, within the ≤50 KB
phase budget). `npm run test:boot` passes end-to-end on that artifact,
including the six focused #339 tests and the two bounded fixture updates. The
10-minute production live probe (`npm run test:population-live`, 600
one-second samples, production `dist/`, `?agent=1&perf=1`) verdict PASS: 8
completed dockings over 8 legs (3 blocked cancels with one retry each on three
legs, 2 undock refusals), authored cast 42–47 per system with the first observed
bank equal to the authored cast, live bank 34–52 (crowd 24–33, reaver ≤1), tier
caps live max 10/10 near, mid proxies max 36/40, far 0/256, no record drawn as
both a hull and a proxy/impostor, zero hails, clean console and a stable source
hash. `npm run test:perf-live` on the same artifact verdict PASS: frame p50
32.5 / p95 33.3 / p99 33.75 ms (inside the 2 ms regression limit), draw calls 58
median / 115 max, triangles 134,080 median (below the Phase 1 median), points
8,239, asteroid matrix writes unchanged at 113/163, CPU ~1.05 ms top-10 sum, 0
console errors and a stable source hash; its 60 s window ended on the Veridian
corridor approach (73 u) because the heavier traffic lengthened the dock leg,
and the 600 s probe on the same artifact completed all eight dockings.

Parked: no CI frame-time gate yet (same Phase 0 decision); off-screen abstract
banks advance at 1/5 real time by design (dwell/gate-linger resolve up to 5 s
late); crowd pirates are ambient only (bounty 0, not board-bearing); Phase 3
(P5 extent + P6 in-system chart) still needs the save-migration decision; a
bank-compaction pass can be considered later if a full-galaxy save becomes a
concern (measured +485.6% record-bank JSON, only visited systems persist).

## Frame-time instrumentation and a live perf baseline — #337

Implemented on `dsh/issue-337-perf-add-frame-time-instrumentation-and` (base
master `f0d15d2`). This is the measurement gate for the system
scale/population phases #338–#341: it ships no gameplay, visual, tuning, save,
HUD-key or aim-glass change.

- `src/systems/perf.js` is opt-in with `?perf=1`: it creates `#perf-overlay`
  and `window.__ctx.perf.snapshot()` (frame p50/p95/p99, renderer draw
  calls/triangles/points/lines/geometries/textures, live NPC counts by tier,
  current/generated abstract record counts, per-frame asteroid matrix writes,
  CPU per subsystem, renderer/JS memory). F3 is a dev-only visibility toggle
  (F1–F12 are reserved in bindings.js); `setVisible(bool)` is the programmatic
  form. When the flag is absent the module creates no DOM and sets no ctx
  field, and main.js keeps the original unwrapped update path.
- `src/main.js` adds a named system list (same load-bearing order) and wraps
  subsystem updates only when `ctx.perf` exists; it also times the render call.
  `src/systems/asteroids.js` publishes its per-frame `setMatrixAt` count into
  `ctx.perf.metrics` once per frame. `src/core/ctx.js` records the session-only
  `perf` ownership.
- `scripts/issue-337-perf-live-probe.mjs` runs the existing issue-74 live
  harness against the PRODUCTION preview build (`serve: 'preview'`,
  `?agent=1&perf=1`): fresh Greenhand, undock, plotRoute(veridian),
  engageAutopilot, queued approachDock, 60 one-second snapshots, overlay/toggle
  checks, then a reload without the query to prove absence by default. It
  writes machine-readable `result.json` + `evidence.json` (machine, Chrome,
  GPU, dist artifact and source-hash metadata) under `out/issue-337-live/`.
  The harness gained additive `query`/`serve`/`baseUrl` options; the default
  dev path and every existing probe are unchanged. `npm run test:perf-live`
  runs it (run `npm run build` first).
- `docs/SystemScalePopulationDesign.md` is committed with this issue;
  `docs/ProductionPerformanceBudget.md` now carries the instrumentation
  protocol, measured baseline and Phase 1–4 budgets.

Verification: `npm run build` passes (2001.68 KiB minified / 606.71 KiB gzip;
`dist/assets/index-CkDBdGGd.js` 2,049,722 bytes). `npm run test:boot` exits 0
(`BOOT TEST PASS — no update errors`, plus the focused suites). The live probe
exits 0 with verdict PASS and zero console errors/exceptions; Chrome and Vite
cleaned up and their ports closed; runtime source stayed stable
(`33a15277…`). Baseline on the named machine (Windows 10.0.26200, Intel Core
Ultra 9 285K, 136.77 GB RAM, Node 24.22.1, headless Chrome 157.0.8103.79,
ANGLE RTX 4090 D3D11): frame p50 31.2 ms / p95 31.8 ms median (headless
compositor cadence ~32 fps; worst single frame 107.4 ms), draw calls 48.5
median / 106 max, triangles 130,700 median / 198,844 max, live NPCs 10 max,
current-bank records 17 max, asteroid matrix writes 112 median / 191 max,
summed subsystem CPU ~1.1 ms (ship 0.46 ms top), render CPU 0.7 ms median,
JS heap 77.3 MB median / 98.5 MB max. The fixed route docked at Veridian at
53.0 s wall / simT 94.46 across route→jump→dock→docked phases. Full evidence
is in the untracked `out/issue-337-live/perf-baseline/evidence.json`.

Parked follow-ups: no CI frame-time gate yet (baseline first, enforce later);
the optional adaptive-quality metrics hook was not added (no behavior change
was in scope); the overlay renders p50/p95/p99 on one FRAME line rather than
separate literal labels; mid/far tier counts are forward-compatible fields
that stay 0 until Phase 2 proxies exist; a low-end hardware profile can be
baselined separately without changing this workstation baseline. No new
persistent field, player keybinding, aim-glass digit or tuning value.

## The engage lease finishes a disabled war quarry — #325

Implemented on `dsh/issue-325-playtest-agent-api-combat-intent-stops-a` (base
master `32c5ddf`). The #250 war playtest finding was real: war-veridian-2
"Strike Watchful Apt" disabled its bound Freehold patrol at 15% hull, the
combat lease then ended `target-disabled` and `setCombatIntent engage` refuses
a disabled target, so a driver that only used combat intents never landed the
witnessed kill the strike pays on; both accepted war jobs lapsed unpaid at the
600 s deadline. The Agent API already exposed `setControl { fireHeld: true }`,
but a combat-intent-only caller had no supported finish. This fix keeps every
#61/#265 ending for other hulls and for a disable intent, and gives the strike
its own kill:

- `src/game/prize.js` adds `isWarQuarry(ctx, rec)` — record-id precise, true
  only for a LIVE (`state === 'accepted'`) war row's bound `recordId`; an
  offered posting is not a bind and lapsed/failed rows stop marking. It fails
  closed on non-array jobs, missing records and non-string ids, and reads the
  same bind the war settlement uses (`resolveWarRecord`/`warPayComplete`), so
  a stuffed `job.target` cannot retarget the finish.
- `src/game/agent-combat.js` lets an `engage` lease on that bound quarry keep
  firing through the hull's disabled/surrendered state; the lease ends
  `target-destroyed` only when the hull dies. A `disable` intent keeps its
  `target-disabled`/`target-surrendered` endings, and every other hull is
  unchanged.
- `src/systems/controls.js` accepts a fresh or renewed `engage` on that
  already-broken bound quarry (a `disable` intent still refuses
  `target-disabled` there). Every other acquisition gate (destroyed, lock-kind,
  stale-lock, no-sample, weapon) is untouched.
- `src/game/bio.js` and `src/systems/npc.js` skip the atrocity/feral gate and
  the `killedSurrendered` fear bump for the bound war quarry's kill — the same
  #265 lawful-work decision already applied to a bound hunt. The +2 witnessed
  capitulation still counts, and a bystander keeps every consequence.
- `src/game/agent-schema.js` documents the exception in the
  `setCombatIntent` note; `terminalReasons`/`refusalReasons` are unchanged.
  `docs/AgentCombatIntentDesign.md` (maneuvers/endings) and
  `docs/Msn02FactionWarDesign.md` §5 record the supported finish.

No settlement, pay, deadline or capture change; no new persisted field, event,
key, SKU or `state.js` edit; no card-copy change. `VERSION` stays 2.

Focused regression is `scripts/issue-325-war-quarry-overkill-test.mjs` (21
checks: `isWarQuarry` record-id precision and fail-closed rows; an engage lease
staying active and firing through disabled then surrendered and ending only
`target-destroyed`; the unchanged #61 endings without the accepted bind,
including an offered posting; disable-intent endings; acquisition/renewal on an
already-disabled bound quarry vs a bystander; and a real-system boot that loads
the war dest bank, accepts an offered Freehold war row, runs the combat.js
witness kill, and asserts no atrocity/feral, no killedSurrendered fear, the
record dead, the strike paid `payQuoted`, employer +2, target -2, the accepted
row gone, a bystander still feral, and JSON-plain records/jobs). It is appended
to `npm run test:boot` and standalone as `npm run test:war-quarry-overkill`;
it exits 1 on the pre-fix source (with `src/` stashed the new export is absent,
so the suite fails to link). `npm run build` passes (vite 6.4.3; bundle policy
1996.15 KiB minified, 604.33 KiB gzip; `dist/assets/index-*.js` 2,044.06 kB /
618.84 kB gzip). Live flow `npm run test:war-quarry-overkill-live` PASSes on
disposable loopback Chromium with the real app and agent handle: fresh
Greenhand, dest bank loaded through the disclosed `systemLoaded` staging, dock
at Freehold, accept `war-freehold-0` "Strike Steadfast Ivo" (`rec-28`,
payQuoted 300), spawn the bound dest-faction patrol near the ship with the real
`spawnLiveShip`, lock it, grant `setCombatIntent engage` (accepted), stamp the
break (hull 15%, disabled, `npcDisabled`), read the lease still owner
`combat`, state `active`, reason `''`, `fireBlocked: 'reposition'` at 0.6 s,
then run the witness finishing blow and read the lease terminal
`target-destroyed`, record `dead`, mood `keen` (not feral), fear 0 → 0, a
player-caused destroyed incident, and the strike paid inside the delivery tick
(credits 350 → 650, employer +2, target -2, accepted row gone) with a clean
console and stable runtime source; evidence under `out/issue-325-live/`.

Parked follow-ups: the same lease-refusal shape for an ACCEPTED hunt quarry
still relies on #265's raw-fire fallback (a hunt pays on a witnessed kill but a
`disable`/`engage` lease still ends at the yield; not changed here); a war row
still carries no `jobs.active[].objective` block (the card detail already
names the quarry; not this issue). The graft graph is absent in this fresh
worktree; source was inspected directly at the cited lines.

## Explore offers report the live origin reward quote — #326

Implemented on `dsh/issue-326-playtest-agent-api-explore-offers-report` (base
master `c087941`, which includes merged #327). The explorer playtest finding was
real: every accepted Freehold explore offer carried `jobs.offers[].reward = 300`
while the Jobs card for the same offer printed the live origin quote and the
accepted contract paid `payQuoted` 420 before Freehold epic stage 2, then 483
after it (playtest #252, 2026-11-18, API v2, 279/279 delivered surveys paid
`payQuoted`). The raw persisted base is not the agreement; the desk quote is.

- `src/systems/station.js` `peekJobReward` now covers `kind: 'explore'`:
  an offered survey returns the origin dock's live `jobPayFor` quote (420 at
  baseline, 483 with Freehold epic stage 2), and an accepted survey returns its
  stamped `payQuoted` (fallback matches settlement). This is the existing
  desk quote source the Agent API row already consults, mirroring the #178/#223
  haul/trade pattern; `src/game/agent-observe.js` needed no edit.
- The Jobs card explore reward line and the accept path now call that same
  source, so the card, the offered API reward and the stamped agreement cannot
  drift apart. The persisted `job.reward` stays `RECOVERY_REWARD` (300); no
  new saved field, no new event, save envelope stays v1, Agent API stays v2.
- `jobs.active[].reward` for an accepted survey reports `payQuoted`; a live
  epic/price drift cannot move the accepted agreement.

Focused regression is `scripts/issue-326-explore-quote-test.mjs` (7 checks:
docked Freehold offer API reward === card line === origin `jobPayFor` 420;
Freehold epic stage 2 moves the offered card and API quote live to 483 without
rewriting the raw 300; restore-shaped JSON offered row still yields the quote;
accept stamps the displayed 483 as `payQuoted` with the desk success notice;
active row reward === payQuoted === accepted card line and holds across
epic/price drift; restore-shaped JSON accepted row still yields `payQuoted`;
filing pays exactly `payQuoted` once, emits the delivered `jobState` receipt,
then retires the witnessed slot without a second payout; zero update errors and
no console errors). It is appended to `npm run test:boot` and standalone as
`npm run test:explore-quote`; `npm run test:issue-326-live` runs the live flow.
`npm run build` passes (bundle policy: 1995.27 KiB minified, 604.11 KiB gzip;
`dist/assets/index-*.js` 2,043.15 kB / 618.61 kB gzip). Full
`npm run test:boot` exits 0 with `BOOT TEST PASS — no update errors`,
`ISSUE #326 PASS (7 checks)`, `ISSUE #327 PASS (8 checks)`, no FAIL lines
(boot log under `out/issue-326-verification/test-boot.log`). Live flow
`npm run test:issue-326-live` PASSes on disposable loopback Chromium with the
real app and agent handle: fresh Greenhand docks at Freehold, opens Jobs, reads
the DOM card line "File the survey at this dock — pays 420 UU" and
`jobs.offers[].reward = 420` (raw 300), accepts through the desk (notice
`Accepted: Survey The Shepherd`), reads `jobs.active[].reward = payQuoted = 420`
and the accepted card line 420, flies the real survey marker with `setControl`
until The Shepherd is witnessed, `approachDock` flies home and the filed
payment is exactly 420 (`jobState delivered pay = 420`, credits 350 → 770);
no fixtures/pose/credit writes in the offer path, console errors and exceptions
empty, runtime source stable. Evidence under `out/issue-326-live/`.
`docs/AgentApiDesign.md` (desk quote paragraph), `docs/Msn02ExploreDesign.md`
§7 and the wishlist record the parity.

Parked follow-ups: unlike haul/trade, an offered explore card has no
displayed-quote cache — its quote is deliberately live on every redraw, and
acceptance stamps whatever the current origin quote is (the same value the card
last printed at that render). Passenger offers still report their unmodified
base reward and must be read from the `job-reward` row until accepted (existing
documented behavior, not this issue). The legacy espionage accepted-row fallback
still uses `explorePayBase()` (pre-existing, untouched). The graft graph is
absent in this fresh worktree; source was inspected directly at the cited lines.

## One-landmark origins stop paying witnessed surveys — #327

Implemented on `dsh/issue-327-playtest-explorer-one-landmark-origins-t` (base
master `73c007e`). The explorer playtest finding was real: Freehold has one
landmark, so its board collapses the twin survey slots to one card; accepting
and filing that card left the site witnessed but the slot re-posted the same
witnessed site, and every later redock paid the quoted survey again from the
berth (279 accepted Freehold surveys for 133,938 UU, playtest #326). The owner
decision on the issue (2026-11-18) is the contract implemented here: witnessed
work must not pay again and must not be offered again at the same station; the
explorer takes a gate to a new system for fresh survey work.

- `src/systems/station.js` `makeExploreJob` now refuses a site already on
  `mystery.visited` (the existing discovery read; no new persisted field). A
  witnessed filing therefore retires its slot instead of re-posting.
- `syncExploreJobs` fills slots 0/1 independently, withdraws offered rows whose
  resolved site is witnessed or twinned, and skips a witnessed slot without
  stopping the other one. `exploreBoardExhausted` drives a Jobs-pane
  `screen-note`: "EXPLORE — every survey site for this dock is already
  witnessed. Take a gate; fresh survey work waits at another dock."
- The 0.5 s delivery tick withdraws an offered row whose resolved site is
  already witnessed, with the comm line "Survey posting withdrawn — that
  landmark is already witnessed.", and pays nothing. Accepted rows keep the one
  earned payment on filing. Unwitnessed expiry still replaces the same site.
- No new persisted fields or world keys; save envelope stays v1, Agent API
  stays v2, `state.js` is untouched. The API `jobs.offers` block agrees with
  the rendered board (no explore card at a witnessed dock).

Focused regression is `scripts/issue-327-explore-witnessed-test.mjs` (8
checks: fresh one-card Freehold board; offered expiry replacement; accepted
expiry no-pay replacement; witnessed filing pays once, retires the slot, pays
nothing later, board note and empty API offers; Veridian still offers; a
two-landmark dock withdraws only the witnessed posting and retires the last
site; a restored offered witnessed row withdraws without pay; save v1, API v2,
zero update errors), appended to `npm run test:boot`. `npm run build` passes.
The boot pins WAVE78/WAVE80 were updated for the new lifecycle. Live flow is
`npm run test:issue-327-live`: fresh Greenhand accepts the real Freehold
survey, flies the accepted marker with `setControl` until The Shepherd is
witnessed, `approachDock` flies home and the berth files once, then the board
has no explore card, names the gate and pays nothing on later ticks; a real
`plotRoute`/`engageAutopilot`/`approachDock` gate run docks at Veridian and
finds its fresh Hulk Row survey. Evidence under `out/issue-327-live/`.
`docs/Msn02ExploreDesign.md` §4–§6 and the acceptance direction record the
owner decision. Parked follow-ups: generated one-landmark systems behave the
same way (a witnessed dock has no survey work until a gate); old saves that
still hold an offered row for a witnessed site withdraw it without pay on the
next tick, which is the intended repair, not a migration.

## The bounty finish is honest at the surrender verb — #314

Implemented on `dsh/issue-314-playtest-piracy-ransom-leaves-a-pirate-b` (base
master `6e56b96`). The pirate playtest finding was real: a ransom taken from an
accepted bounty quarry paid the player and left the bounty at `progress 0`
forever, the surrender card never said so, and the ace card promised "kill or
capture" for a Named Gun whose surrender can never be captured (playtest #253,
2026-11-16, API v2, `out/pirate-playtest-2026-11-15/REPORT.md` finding 1).
Copy-only fix; no settlement, pay, fear, feral or hunt change:

- `hail.js bountyQuarryOf(ctx, live)` reads the accepted bounty row whose
  `target` names the hull's own RECORD (never the displayed speaker, so a
  masked Q-ship keeps its cover) and answers `pirate` (`bounty-pirate-*`) or
  `ace` (`bounty-ace`); offered rows and missing data fail closed to null. On
  that quarry's surrender card it prints a dim, text-safe note: "Compact claim:
  a ransom, cargo demand, tribute or letting them go leaves the bounty open.
  Only a kill or a capture closes it — a capture takes a hail on the yielded
  hull (take its cargo to yield it first)." An ace card says "Named Gun bounty:
  only a kill closes it. A ransom, cargo demand, tribute or letting them go
  leaves the claim open — a Named Gun's surrender is not taken as a capture."
  Every listed verb states its consequence ("(bounty stays open)" on cargo,
  ransom, tribute, letGo and respect; "Keep firing — a kill pays the bounty").
  The note is appended to `terms.line` so the agent API and the player agree,
  and rides `cardSignature` so a readable change mints a new conversation. The
  lane and note live on the open card only — no new persisted field, no new
  observe key.
- `station.js` ace contract detail now reads "The Compact pays on confirmation
  of the kill — a Named Gun's surrender is never taken as a capture, so only a
  kill closes this claim." The ordinary pirate bounty card keeps "kill or
  capture", which is true for an ordinary reaver.

No settlement change, no pay tuning, no fear/feral or hunt change, no new
persistent fields, keys/digits, SKUs or `state.js` edit; non-bounty surrender
and salvage cards keep their byte-identical labels and no note.

Recon finding recorded honestly: after a ransom the yielded hull can be
captured by a hail even with cargo aboard (the capture gate reads only the
yield, range, attribution and role), so the note's "(take its cargo to yield it
first)" is guidance for the cargo-demand/letGo route, not a strict precondition.
"Consider capture as a card verb" was considered and parked: a new verb would
change the flow and the agent intent set, while the note and labels now name the
supported hail path.

Focused regression is `scripts/issue-314-bounty-surrender-copy-test.mjs` (9
checks: the exact note and labels on a real admitted surrender card through
`hailApi.peek()`, `observe().hail` and the DOM; ransom paid, recorded, bounty
accepted at progress 0 across a delivery tick; cargo demand empties the hold and
the real KeyH capture settles the bounty done; the ace note/labels and a refused
Named Gun capture; the rendered ace card kill-only copy beside the pirate card's
"kill or capture"; a non-bounty card untouched; JSON-plain and no persisted or
observe keys), appended to `npm run test:boot`. `npm run build` passes. Live
flow is `npm run test:bounty-surrender-copy-live`: disposable loopback Chromium
accepts Red Marlow (300 UU) and Gallows Wren (375 UU) at Freehold, reads the
exact note and labels, ransoms Red Marlow for 93 UU and watches the bounty stay
accepted/progress 0 across eight delivery ticks, empties Gallows Wren's hold,
takes the surrender with the real hail edge (captured incident causer player,
record captured, no destroyed incident, bounty paid done +375), and reads the
ace card kill-only copy with a clean console; evidence under
`out/issue-314-live/`. Parked follow-ups: already-accepted ace rows in old
saves keep their old persisted detail until retargeted; the `yielded` bracket
step still says "Hail to take their surrender" for a Named Gun whose capture is
refused (pre-existing, outside this issue's scope).

## Faction standing and bounty heat are observable — #315

Implemented on `dsh/issue-315-playtest-agent-api-observe-publishes-no` (base
master `5c64d7b`). The pirate playtest finding was real: `observe()` published
credits, fear and cargo but no faction standing and no numeric bounty heat, so a
runner could not measure what piracy did to its name (playtest #253, API v2,
`out/pirate-playtest-2026-11-15/REPORT.md` priority 2). Observation-only fix:

- `world.reputation` publishes a JSON-plain map keyed by every authored
  `FACTIONS` id with `{ name, rank, standing }` — the authored name, the
  `rankFor` rank word, and the rounded standing from the live
  `ctx.world.reputation` bag, read through the desk's own `standingRead`. A
  missing bag/key or non-finite value reads `Stranger`/`0`, matching the
  Standing (epics) desk. Derived per observation; never written back.
- `jobs.offers[].heat` / `jobs.active[].heat` on offered and accepted `bounty`
  rows are `{ bounty, tier }`: the living quarry record's own posted price and
  #272's `huntTierOf` danger tier (`standard` | `hard`). Pirate rows resolve the
  living record the board and settlement read (current bank first, then the
  other generated banks); the `bounty-ace` row resolves the live ace mantle.
  Absent when no living quarry binds the row, and never on non-bounty rows. The
  desk exposes the same evaluator as `peekBountyHeat(job)`, and the #292/#301
  last-seen copy now shares the quarry resolver, so there is one rule set.

No new persisted field, no `ctx.world` write, no HUD gauge, no new key or digit;
`VERSION` stays 2 and `state.js` is untouched.

Focused regression is `scripts/issue-315-standing-heat-test.mjs` (12 checks:
the full faction map and its parity with `rankFor`/`standingRead`; the rendered
Standing desk printing the same rank and standing; derived-not-written-back and
JSON-plain; offered/accepted pirate heat quoting the living record and the #272
tier; a staged 900 bounty and a veteran stamp posting `hard`; the ace contract
heat; absent heat for a row binding no living quarry and for non-bounty rows;
the price/tier-only honesty boundary; and no heat/standing field persisted on
jobs or records). It is appended to `npm run test:boot`; the agent hardening
suite also pins the map shape/defaults/filtering and the heat pass-through.
`npm run build` passes. Live flow is `npm run test:standing-heat-live`:
disposable loopback Chromium docks at Freehold, reads the rendered Standing desk
line against the observation, stages a disclosed standing move, seeds a priced
pirate only when the board has none, accepts the bounty and reads the same heat
on the offered and active rows, stages a 900 bounty for `hard` tier, reads the
ace contract heat, and confirms no persisted field or `ctx.world` write with a
clean console; evidence under `out/issue-315-live/`.

## selectTarget names the targeting ceiling instead of no-service — #316

Implemented on `dsh/issue-316-select-target-range-refusal` (base master
`6f9fdbd`). The pirate playtest finding was real: eight
`selectTarget { id: 'rec-7' }` calls answered `no-service` — the token an
overlay/service gate uses — while the hull sat at 752–873 u with the lock
retained, and `observe().availability.selectTarget` still read `ok:true`, so
the runner retried instead of flying closer. The fix keeps every in-range
behaviour and the lock semantics unchanged:

- An id that names a known live hull — or a rock the mining group (3) accepts
  under the active job's ore match — beyond the 600 u targeting ceiling now
  refuses token `range` with a detail sentence naming the target, its measured
  distance and the ceiling — e.g.
  `target Tallow-3 (rec-7) is 766 u away; the targeting ceiling is 600 u, so
  fly closer to lock it.` The refusal moves no lock.
- Unknown ids and bare cycles keep their existing tokens: an id that names
  nothing stays `no-service`, and a bare cycle with no in-range candidate keeps
  `no-service` (an in-range cycle still queues).
- `observe().availability.selectTarget` publishes reason `range` with the same
  sentence format when no cycle candidate sits inside the ceiling — one detail
  builder, so act and discovery carry the same wording. Discovery names the
  nearest known target while act names the requested id, so the two are
  verbatim only when those coincide; availability also cannot see the requested
  id, so with an in-range candidate elsewhere it stays `ok:true` while an
  id-specific call for a far hull refuses `range` (read the act receipt).
  Docked precedence and every other availability
  reason are unchanged. The ceiling read is the authored `U.TARGET_RANGE`, not
  a new number.

No tuning change, no new event, no new persisted field, no `state.js` edit;
`VERSION` stays 2. The detail lives in a session-only module string
(`agentSelectTargetDetail`), like the #118/#267 refusal details.

Focused regression is `scripts/issue-316-select-target-range-test.mjs`
(9 checks: in-range id selection unchanged with no detail; a known hull beyond
the ceiling refusing `range` with name/id/distance/ceiling and no lock move; the
playtest shape where availability quotes the act sentence verbatim while the
retained lock survives; unknown ids and bare cycles keeping their old tokens;
docked precedence; a rock beyond the ceiling refused only in the mining group;
the exact 600 u boundary unchanged (including 600.4 u staying 600.4 u); the
in-range-candidate + far-id case where availability stays `ok:true` while act
refuses `range`; `lastIntent` mirroring the receipt detail; and JSON-plain
receipts). It is appended to
`npm run test:boot` and fails on the pre-fix source with `no-service` where
`range` is expected. `npm run build` passes. The live flow is
`npm run test:select-target-range-live`: disposable loopback Chromium runs the
contracted shape — a real live hull acquired through the public `selectTarget`
at 400 u, moved to 766 u with the lock retained (issue-67 spatial staging only),
then act() and observe() in one JS turn: token `range` with the distance
sentence, the same sentence on `availability.selectTarget`, no lock move, an
unknown id still `no-service`, `lastIntent` mirroring the detail, and a clean
console; evidence under `out/issue-316-live/`.

## approachDock names its autopilot takeover path — #308

Implemented on `dsh/issue-308-agent-api-approachdock-refuses-autopilot` (base
master `14aff26`). The salvager playtest finding was real and reproduces in the
real boot path: while a dock-mode autopilot is already flying the approach, a
second `approachDock` answers the unchanged `{ ok: false, token: 'autopilot',
error: 'Dock approach refused — autopilot is already on.' }`, and a caller
could not tell from the receipt whether to wait, cancel, or re-send.

The fix is copy-only and uses the #118/#267 `detail` channel: when the refusal
is `autopilot`, the receipt detail names the engaged autopilot state and the
takeover command — `autopilot is already taking the ship in; cancelAutopilot to
take over.` for an engaged dock-mode approach, and `autopilot is already on;
cancelAutopilot to take over.` for the other engaged-autopilot paths that fail
to queue. The token, the English `error` line, the fail-closed semantics, the
human comm line, and the dynamic availability block are unchanged; no new
event, persisted field, key, SKU or schema version (JSON-plain, `VERSION`
stays 2). `observe().lastIntent.detail` mirrors the receipt through the
existing #118 rule.

Focused regression is
`scripts/issue-308-approach-dock-autopilot-detail-test.mjs` (4 checks: the
accepted approach engages mode dock and carries no detail; a same-frame repeat
keeps the unchanged token and error line; the detail names the engaged dock
approach and `cancelAutopilot`, and `lastIntent` mirrors it; the receipt stays
JSON-plain and adds no schema fields), appended to `npm run test:boot`; it
fails on the pre-fix source. The focused refusal-token suites
(`test:refusal-tokens`, `test:dock-approach`, `test:route-dock`,
`test:agent-cruise`) pass unchanged. The live flow is
`npm run test:approach-dock-autopilot-live`: PASS in disposable loopback
Chromium (fresh Greenhand, the real dock autopilot engaged, a same-frame repeat
refused with the unchanged token/error and the new takeover detail mirrored by
`observe().lastIntent`, clean console); evidence under `out/issue-308-live/`.

## Spy career first playable slice — tracker #233 closed

Closed on 2026-11-11 against merged master `e678b75`. Every selected child is
complete or parked by owner decision; none remains open. Merged deliveries:
#235 via PR #241 (`83ec515`), #236/#237 via PR #244 (`a983981`), #238 via PR
#245 (`b8c40a5`), #239 via PR #246 (`b8b2b5f`) and #240 via PR #247
(`7862dfc`). #234 was closed by the owner as not planned on 2026-09-23 and
stays a separate light-hull arrival reliability limitation (see its entry).

The tracker's first playable milestone is delivered: a separate named-courier
**Shadow courier** posting with a safe basic report, an optional deeper complete
dossier, readable mission-local suspicion with warning/withdrawal, employer-only
settlement for each tier with exactly-once payment (the #240 exclusive dossier
buyer is one explicit single-settlement exception), free contact route briefings,
scanner tiers that lower
dossier exposure and one explicit exclusive Red Ledger dossier buyer choice.
Introductory dock-and-return spy jobs and ordinary multi-employer bookkeeping
are preserved.

Persisted/API additions stayed inside the approved contracts: the #236/#237
shadow-job state and read-only projection, #238's versioned deep-dossier save
state and the `chooseShadowDossier` action, #239's two derived projection fields
(`deep.suspicionGain`, `deep.suspicionNote`), and #240's isolated v3
exclusive-conflict save variant with its read-only `shadow.conflict` projection.
#235 added no saved field. No new keys, aim-glass gauges, equipment SKUs or kit
mutation were added.

Verification on merged master `e678b75` on 2026-11-10–11: `npm run build` PASS
(vite 6.4.3; 1987.67 KiB minified / 601.75 KiB gzip), unchanged
`npm run test:boot` PASS, and the focused suites PASS — `test:courier-shadow`
52 checks, `test:deep-dossier` 9 groups, `test:spy-benefits` 32 checks
(16 groups), `test:dossier-conflict` 24 groups.

A bounded natural live-browser career run on the same artifact (fresh drifter;
built `dist/assets/index-XZipdU89.js`, SHA-256
`C5B1BC2FE150DBF5554A94842B0C678EA0E8508E5B6157F7DD548DE06A8AA1BD`) accepted
the separate Shadow courier posting through the public Jobs desk, used the free
contact route briefing (0 UU, no favor spent), gathered a 30.0-second basic report
by observation at 232–387 u with clear risk and no warning, and filed at Freehold
Landing for 420 UU exactly once (600 → 1020). The API published `Basic report
acquired—return to Freehold Landing to file` with progress 1/1 and one delivered
`jobState`; a reload retained 1020 UU, no active job and no duplicate payment.
Docking alone showed `contactReason: docked` and 0 s. Four earlier accepted
assignments ended without a report (`lapsed`; one courier was destroyed by
ordinary NPC traffic), three player deaths from manual-flight collisions forced
berth/autosave restores to t≈6419 and one near-station `approachDock` failed at
49 u before a retry docked, so a clean single-career run remains hard. The optional dossier and the #240 exclusive buyer
were visible but not played. `npm run agent:bridge:smoke` exited 0 with
`consoleClean: true`, `errorCount: 0` and all pins true. Wall play ran
~2 h 43 min, beyond the requested 15–25 min budget.
No deployment occurred.

Parked by owner decision and not required for this close: concealed-mount spy
benefits (no supporting inspection path was found; #239), broader double-agent
conflicts beyond the single Ledger dossier (#240), a global stealth/wanted
system, new keys/gauges/SKUs and new equipment tiers (tracker delivery rules).
Provisional tuning — the 4 / 3.5 / 3 dossier suspicion rates, the bounded +50%
dossier premium and the courier timing — remains a playtest hypothesis, not a
broad balance conclusion.

Next spy work remains unstarted: the tracker's sequencing required a natural
career playtest before #239/#240 implementation, and that gate was met. Broader
expansion (installation scans, contact missions, further mission families) waits
for a fresh career-playtest decision.

## Helm-lease steering is readable from observation alone — #300

Implemented on `dsh/issue-300-agent-api-helm-lease-steering-has-no-hea`
(base master `8a6b1ab`). The mercenary playtest finding was real: raw
`setControl` helm work — the patrol half of the mercenary loop — gave the
runner no heading feedback at all, and the bearing convention (y up) versus
the steer convention (steerY down, screen Y) was documented only in
`docs/AgentApiDesign.md`, so a wrong sign assumption flew ~15 000 u the
wrong way before an empirical test settled it. The cheapest honest shape from
the issue's option list, both halves:

- **Documented signs in the capability note.** `COMMAND_SPECS.setControl.note`
  now carries the closed-loop rule the runtime manifest publishes to every
  observation: bearings are x right, y up, nose -z; steerY positive pitches
  nose DOWN; therefore `steerX = clamp(k * bearing[0])`,
  `steerY = clamp(-k * bearing[1])`; `bearing[2] < 0` means ahead; small
  `|bearing[0]|`/`|bearing[1]|` with steer 0 holds the line.
- **Steer echo in the observe payload.** While a manual lease is live,
  `observe().control` echoes the accepted command — `steerX`, `steerY` (the
  raw value sent, before the shared input boundary's screen-Y flip),
  `strafeX`, `strafeY`, `roll` and `throttle` (`null` when that lease leaves
  the setpoint alone). A combat lease keeps publishing its own
  `control.combat` view and carries no echo. Derived from the in-memory
  lease: no persisted field, no event, no schema version, JSON-plain,
  `VERSION` stays 2.

Focused regression is
`scripts/issue-300-helm-heading-feedback-test.mjs` (8 checks: the echo
matches the accepted axes; omitted axes echo 0 and omitted throttle null; the
combat view carries no echo; clearControl/expiry end the echo with the
unchanged idle shape; the documented mapping converges through the real
flight loop from `observe()` alone; the note documents the convention; the
control block stays JSON-plain), appended to `npm run test:boot`; it fails on
the pre-fix source. The live flow is
`npm run test:issue-300-helm-heading-live`: PASS in disposable
Chromium (the capability-note signs, the live echo, and a closed loop that
yaws ~70° off the station bearing then flies a straight line back to it using
only `observe` + `setControl`, no trial-and-error sign test), evidence under
`out/issue-300-evidence/live/`.

## The Jobs board says where the lane's pirates are — #301

Implemented on `dsh/issue-301-playtest-mercenary-board-rows-don-t-say` (base
master `0a983e9`). The mercenary playtest finding was real: a player holding
at the Veridian gate ring for eight minutes surfaced ~25 ordinary hulls and
zero flagged ones, while both flagged hulls of the run crossed in a ~20 s
mid-lane window — and neither the patrol row nor the un-accepted bounty cards
said where to wait. The fix is copy-only and reuses the #271/#292 vocabulary:
`bountyLastSeenPhrase` now also answers for OFFERED `bounty-pirate-*`
cards, so each bounty card appends "Last seen: <phrase>." derived from its
named reaver's own durable evidence (the #68 tagged wakeSite first, else the
authored lane through `huntHauntPhrase`); a new `pirateLanePhrase(ctx,
sysId)` derives the same read from the oldest living local reaver so one
sentence answers for the whole lane, printed as a "Lane read: …" row on the
offered patrol card and appended to the #294 accepted patrol state line.
The agent row gains `lastSeen` on offered/accepted `bounty-pirate-*`
rows through the same desk evaluator (`stationDesk.bountyLastSeenPhrase`) —
one source of truth, no second rule set. No new event types, no new
persisted fields, no `state.js` edit; no spawn-rate or engagement change.

Focused regression is `scripts/issue-301-bounty-board-location-test.mjs`
(10 checks: the offered card quotes the read before acceptance and matches
the desk read verbatim; the patrol Lane read line on offered and accepted
rows; the no-coordinate/no-record-id honesty line; a gate wake flipping the
reads; agent-row parity; JSON-plain; no persisted field), appended to
`npm run test:boot`; it fails on the pre-fix source. `npm run build`
passes. Live flow is `node scripts/issue-301-bounty-board-live-probe.mjs`:
PASS in disposable Chromium — the offered board carries the bounty card read
and the patrol Lane read, both accepted rows keep them, and the agent row
quotes the same phrase, with a clean console; evidence under
`out/issue-301-live/`.

## The bare preview path reaches the agent bridge — #302

Implemented on `dsh/issue-302-tooling-bare-npm-run-preview-binds-1-onl`
(base master `f28a1c2`). The mercenary playtest's by-hand serve step was real:
bare `vite preview` inherits Vite's `localhost` default, and Node binds the
first address the resolver returns — on machines that answer `::1` first
(reproduced twice on the playtest machine, 2026-11-09) the server is IPv6-only,
`http://127.0.0.1:4173/` refuses, and the bridge's Chrome `--game-url` fails two
hops away as `cdp attach failed`. The fix is one config pin:
`vite.config.js` sets `preview.host: '127.0.0.1'`, so the documented bare
`npm run preview` step serves IPv4 loopback with no flag, matching the
`--host 127.0.0.1` every in-repo harness already forces. The bridge, its
`--game-url` loopback rules and all harness scripts are untouched; `npm run dev`
keeps Vite's default host. The README bridge section notes the default.
Verified live: bare `npm run preview` now answers `http://127.0.0.1:4173/` 200,
and the documented by-hand flow
(`node scripts/agent-bridge.mjs --launch-chrome --game-url
http://127.0.0.1:4173/`) reaches `cdp attached` on the first try where the same
command failed before the change. No bundle or game-source change; the
production bundle output is byte-identical (1984.37 KiB minified / 600.70 KiB
gzip, `three` only). `npm run build` and `npm run test:boot` PASS.

## A surrendered bounty target can be finished: the capture — #291

Implemented on `dsh/issue-291-playtest-mercenary-a-surrendered-bounty`
(base master `bd88d47`). The mercenary playtest finding was real: the
#61/#62 combat lease drove Red Marlow to surrender inside one 45 s lease,
then refused the same hull with `target-surrendered` (#265, by design — a
lease will not fire on a yielded hull), the only supported finish left was
raw `setControl` fire the fleeing hull outruns (range 199 → 800+ u across
four pursuits), and the bounty card pays on "confirmation of the kill or
capture" while settlement read only a player-caused `destroyed` incident —
so the combat system's own surrender stranded the bounty.

The fix keeps the #265 refusal semantics intact and publishes the capture
that was already half-built: the HAIL key on a yielded, player-broken pirate
target (the state the bracket already prints as YIELDED, in hail range) runs
`npc.js tryCaptureYieldedTarget` from hail.js's H-press chain, only when no
card opened. The hull strikes its colors where it sits (dead-stick drift,
engines dark), the record settles `captured` — the terminal word traffic
already tows away and settlement already treats as an ended quarry — the
escape plan is cancelled, and ONE `npcSurrendered` receipt flies with
outcome `captured`, causer `player`; world.js's surrendered branch flips
the record, writes the incident and pays the player-caused bookkeeping.
Bounty settlement (`station.js` tickDeliveryJobs) now accepts that incident
beside the witnessed kill, so the card's own terms are true. Gates fail
closed: the classifier state must be exactly `yielded` (a disabled wreck
stays salvage, a willing hull keeps its terms card), the #99 attribution
must read the player, the record must be a live ordinary pirate (a Named Gun
keeps the #265/#269 rivalry ladder, civilians were never bounty quarries), a
hull an ACCEPTED hunt contract binds keeps #265/#282's lawful kill (a merely
offered hunt row never vetoes the bounty lane), range is `U.TARGET_RANGE`,
and `ai.capturedDone` latches one capture per instance. No fear change (the
witnessed capitulation already paid at the yield; a capture is not a kill —
no `npcDestroyed`, no atrocity, no killedSurrendered), no fence marker, no
new persistent fields, keys, SKUs or `state.js` edit. The `yielded`
classifier copy now names the finish: "They have yielded. Hail to take
their surrender."

Focused regression is `scripts/issue-291-surrender-capture-test.mjs` (7
checks: the real KeyH capture on the resolver-yielded target, the captured
incident and record with no killedSurrendered fear and no destroyed
incident, the bounty paying `done` on the next delivery tick, a
world-caused yield refused through the real capitulate path, a disabled hull
answering with the salvage card instead, a second press doing nothing,
JSON-plain), appended to `npm run test:boot`. `npm run build` passes. The
live flow is `npm run test:surrender-capture-live`: disposable loopback
Chromium runs the contracted loop — accept the bounty at the Freehold dock,
spawn and lock the named reaver, break it with the player's own guns, take
the yield through the real hail resolver, take the surrender with the real
hail key, and read the aftermath: `captured` incident causer `player`,
record `captured`, no destroyed incident, no fear spike, and the bounty
PAID (`done`, credits rise) inside the delivery tick, with a clean console;
evidence under `out/issue-291-live/`.

## The combat lease can close a runner: pursuit past the ceiling — #299

Implemented on `dsh/issue-299-playtest-mercenary-a-fresh-bounty-target`
(base master `e9c3ba4`). The mercenary playtest finding was real: the #61
engage lease required a fresh HUD sample inside the 600 u targeting ceiling
(no-sample beyond range is honest and stays), and an ACTIVE lease died
`target-lost` the moment its quarry crossed that ceiling — both flagged hulls
of the run went from <400 u to beyond 600 u in under 40 s while the agent
steered toward them, so a starter hull could never close a mover and the
income gate moved one step ahead of the fight.

The fix keeps every acquisition refusal and refusal token intact and gives
the lease the chase the issue named: an active engage/disable lease whose
hull crosses the ceiling PURSUES on the same public HUD digest (hud.js
publishes the locked hull's aim digest at any range; `pursuitDigest` lifts
only the range clause) — `combat.phase` reads `pursuit`, the chase runs at
the ordinary throttle cap, fire stays `fireBlocked: 'range'`, and the lease
re-arms to intercept the moment the hull is inside the envelope again. A
same-target renewal (`seq`/`ttl`) continues an authorized pursuit past the
ceiling in `controls.js`; a FRESH acquisition (no live lease, a changed
target/intent, a stale digest) still answers `no-sample`/`target-lost` with
the same tokens and details, and withdrawal intents (`retreat`/`break-off`,
defense withdrawal) keep their exact range-exit endings. No new persistent
fields, keys, SKUs or `state.js` edit; `phases` gains the `pursuit` word.

The bounty card copy now agrees with the supported path: every pirate-bounty
card (offered and accepted rows) appends "Run them down: a fleeing hull leads
somewhere real, and the fight waits where it stops." — the #68 refuge law
pursuit rides on, in the same voice the #292 last-seen line speaks.

Focused regression is `scripts/issue-299-pursuit-test.mjs` (10 checks:
unchanged no-sample acquisition detail, the range exit becoming pursuit,
pursuit steering toward the published bearing, fire blocked by range and
re-arm on re-entry, stale-digest and roster/lock loss semantics, withdrawal
endings, renewal-past-the-ceiling vs fresh refusal, surrendered/destroyed
terminals, and a real-flight close on a braking runner), appended to
`npm run test:boot`; the amended #61 pin row is documented in place.
`npm run build` passes. The live flow is `npm run test:pursuit-live`:
disposable loopback Chromium runs the contracted loop — accept the bounty at
the Freehold dock, spawn and lock the named reaver alive and un-yielded,
engage inside the ceiling, break it into the bargaining band and resolve
`letGo` through the real hail resolver (the real #68 flee, no surrender
stamp), watch the lease PURSUE past the ceiling, renew the authorized
pursuit there, and re-arm and open fire once the runner brakes at its refuge,
with a clean console; evidence under `out/issue-299-live/`.

## Pirate bounties quote the same last-seen read hunts got — #292

Implemented on `dsh/issue-292-playtest-mercenary-pirate-bounties-give` (base
master `508d3bf`). The mercenary playtest finding was real: an accepted
pirate-bounty row exposed only progress/need/target, so when Red Marlow fled
off scanner (~600 u) the only re-find was two full station round-trips of
re-docking. The fix keeps the #271 honesty boundary and reuses its vocabulary:
the accepted bounty row's state line now derives a "Last seen:" phrase at
render from the record's OWN durable evidence — the #68 tagged wakeSite first
("sheltering in the holding lane off <Station>" / "seen at the gate to
<system>" / open-space evade), and with no wake trail the quarry's authored
lane answers through the same `huntHauntPhrase` hunts quote. No new event
types, no new persisted fields, no `state.js` edit, no change to hunt
tracking or to the un-accepted board rows.

Focused regression is `scripts/issue-292-bounty-tracking-test.mjs` (7
checks: station-shelter wake, gate-crossing wake, authored-lane fallback, the
no-coordinate/no-record-id honesty line, hunt rows untouched, JSON-plain),
appended to `npm run test:boot`; it fails on the pre-fix source.
`npm run build` passes.

## A lawful hunt kill is not an atrocity — #265

Implemented on `dsh/issue-265-playtest-hunter-every-paid-hunt-is-an-at` (base
master `bc55503`). The #249 frame was real: every paid hunt left the quarry
disabled or surrendered before it died, a hunt pays only on a witnessed kill,
and the finishing kill then read as an atrocity — the living ship went feral
for 60 s after each kill and fear climbed +8 per surrendered kill (+2 per
witnessed capitulation on the way in), 0 → 40 in 22 sim-minutes toward
`lawfulClosesAt` 50, while `applyPlayerKillStanding` already exempted the
same victim as legitimate. The decision (2026-11-06, recorded in
[Msn02HuntDesign.md](Msn02HuntDesign.md)): the witnessed kill of a live hunt's
bound quarry is lawful work, not an atrocity. The exemption is the
record-id-precise contract bind the #271 CONTRACT mark already uses
(`prize.js isHuntQuarry`): bio.js's `npcDestroyed` atrocity gate skips the
bound quarry (no feral window, no `atrocity` event), npc.js's
`killedSurrendered` fear bump skips it (the +2 witnessed capitulation on the
way in still counts), and the hunt card says "A finished hunt pays the full
bounty; the kill is lawful work." A bystander's disabled or surrendered hull
keeps every consequence; no non-lethal completion (option 2 stays parked), no
change to `applyPlayerKillStanding`, pay, deadlines, tiers, the prisoner
path (#273) or the overlay skip; no new persisted field, event or
`state.js` edit.

Focused regression is `npm run test:hunt-lawful-kill` (6 checks: the card
names the lawful-kill line; the surrendered contract kill neither ferals nor
emits `atrocity` nor pays `killedSurrendered`; the witnessed capitulation
still pays +2 through the real #98/#99 hail resolver and a non-quarry
surrendered kill keeps the +8 and the feral rage; a disabled bystander still
fires `atrocity`; jobs and records stay JSON-plain), appended to
`npm run test:boot`; it fails on the pre-fix source. The live flow is
`npm run test:hunt-lawful-kill-live`: PASS in disposable Chromium (accept a
Freehold hunt, the lawful-kill line on the card, the bound quarry
spawned/locked/broken/finished, the finishing blow run as the combat.js
witness shape — `npcHit` then `npcDestroyed` — so the kill is genuinely
player-caused, mood `keen` not `feral`, fear 0 after the kill, the record
settled `dead`, the witnessed contract PAID the quoted bounty inside the
delivery tick (credits rise by `payQuoted`, #283), and a clean console;
evidence under `out/issue-265-live/`).
# RIMWARD remaining work
## Playtest Agent API: engage stalls and unnamed overlay refusals — #267

Implemented on `dsh/issue-267-playtest-agent-api-engage-intent-stalls` (base
master `7036123`). Both playtest findings were real and reproduce headless:

- **Engage fire starvation.** `defenseSense` re-entry let a landed
`playerHit` bypass the `resumeAt` gate, so any quarry landing a shot every
`≤2.5 s` pinned the combat lease in no-fire evasion (measured: fire
`≈1.1 s` per 45 s lease against a 0.9 s-cadence shooter, evading
`≈41.6 s`; quiet baseline fire `≈13.2 s`). Freehold quarries
that stopped shooting recovered; Veridian reavers that kept shooting stalled
the lease, matching the playtest asymmetry. The bypass is gone — a fresh hit
re-enters evade through the same gate as every other cue (withdrawal keeps
its instant latch) — and `REACTIVE_DEFENSE.reengage` moved 1 s → 2 s so
the post-evade nose realignment fits inside the fire window (swept
0.67/0.9/1.5/2.5 s cadences × 1/2/3 s windows; 2 s was the material
peak: fire 6.1–10.2 s across cadences, quiet baseline unchanged).
- **`overlay` refusals name nothing.** `leaseGateToken` folded typing
focus, the settings panel, the title capture and the models browser into the
same token as the hail/chart/berth cards while `observe()` published only
the cards — the playtest saw 25 s of `overlay` refusals with no card open.
Every `overlay` refusal now records the owning surface (`hail card open`,
`galaxy chart open`, `berth panel open`, `typing owns the screen`,
`settings owns the screen`, `title owns the screen`,
`models owns the screen`) in the act() `detail`, and the
`observe().availability` entry for `setControl`/`setCombatIntent`
carries the same words, so the runner sees the cause from either side. The
token stays the enum; combat grants keep their explicit authority through an
open hail card.

Focused regressions are `scripts/issue-267-defense-starvation-test.mjs`
(3 checks) and `scripts/issue-267-overlay-detail-test.mjs` (5 checks),
appended to `npm run test:boot`; the live flow is
`npm run test:issue267-live` (disposable loopback Chromium: a spawned hostile
shoots at the 0.9 s playtest cadence while the lease keeps firing, and a
typing-focus overlay refusal reads `typing owns the screen` on both
channels). Parked: the raw-lease tick still drops with
the bare `overlay` token (drop paths carry no detail channel); a runner can
read the cause from `observe().availability` instead.

## A tracking phase: last-seen lanes and a marked quarry — #271

Implemented on `dsh/issue-271-playtest-hunter-hunts-have-no-tracking-p` (base
master `0400bae`, the #272 supply work). The #249 frame was real: the only
location a hunt gave was "haunts the lanes of this system", quarries read like
bystanders, and two bystanders hit by stray fire became the next posted
quarries. Three decisions in `docs/Msn02HuntDesign.md` (the tracking-phase
section of 2026-11-05), all inside the existing hunt family — no new job kind,
no new persist key, no new event, no `state.js` edit:

- **Last seen on the card.** `huntHauntPhrase` derives a STATIC lane phrase
  (station–gate lane, ore field, or a named gate) from the record's own route
  waypoints against the authored geography — the #239 "route geometry off a
  sheet, not a sighting" law; no coordinate, no live position, no handle.
  Cards render "Last seen: <phrase>."
- **Ask around answers fresher.** The People desk's free Ask around answers a
  live local hunt before the ordinary rumor: the same lane phrase plus a
  coarse freshness bucket (recently / a while back / some days ago). Keepers
  still read their ledger first; off-home docks are unchanged.
- **CONTRACT on the bracket.** `isHuntQuarry` (hunt recordId binds only — the
  overlay bounty purse never marks a hull) appends a CONTRACT word to the
  locked bracket meta, the target rail name, and the matching
  `targets.current`/`targets.nearby` observe rows. A word, not a gauge; no
  colour-only cue; a masked Q-ship's cover shows it too (the mark never
  unmasks).

Focused regression is `npm run test:hunt-tracking` (8 checks, appended to
`npm run test:boot`). Parked: quarries holding away from the station and
gate-running under approach are the existing #68 escape behaviour, exercised
but not re-tuned here; a live-browser playtest pass of the full loop is the
next natural evidence after merge.
## Hunt supply and danger tiers: the cast is a population — #272

Implemented on `dsh/issue-272-playtest-hunter-hunt-supply-runs-dry-aft` (base
master `ff56e1e`). The #249 frame was real: the boards emptied after ~4 kills
because the authored pirate cast was a one-time spawn table, and every card
played at the same flat danger. Two decisions in `docs/Msn02HuntDesign.md`
(the supply-rhythm section of 2026-11-05): the cast is a steady-state
population — `world.js` replenishes an existing bank whose living pirates sit
below cast on a migration-style gated cadence (one hull per pick, band-
stretched, ~150 s), with a fresh #270 name unique across every bank, no bank
generation, no Q-ship, and a one-line comm only in the player's system; and
tier rides the record — `huntTierOf` marks a quarry hardened at bounty ≥ 700
or a stamped `reaverTier: 'veteran'`, the replenish rolls 70/30
standard/veteran (375/750 UU posted, resolve seed 70 on veterans), and the
hunt card says so before accept. The empty board tells the player the supply
refills as new names drift in. Focused regression is
`npm run test:hunt-supply` (10 checks, appended to `npm run test:boot`), and
`npm run build` passes. Live browser evidence is
`npm run test:hunt-supply-live`: PASS in disposable Chromium (the Freehold
board, the kill-out to the empty-board line, the replenish pick refilling the
board, the hardened-quarry row, and a clean console).
## The arrival handoff: nav 'arrived' names the fade window — #268

Implemented on `dsh/issue-268-playtest-agent-api-nav-reads-arrived-in` (draft PR
#278). The #249 frame was real: the jump midpoint swap emits `systemLoaded`
mid-fade and nav.js's `recalcOnLoad` rewrote the route bag as `arrived` with
the helm dropped, so every public poll for the rest of the charge time read
arrived-and-ready while `approachDock` still refused token `jumping`. The
final-arrival recalc now holds the nav lease through the fade; the flag is
actuation, not history (it runs flyTick's `arrive` disengage and the issue
#183 queued-dock handoff, and `sanitizeNav` re-flags it false on restore, so
no save resumes a helm), and the flight contract is otherwise the pre-#268
one. `observe()` publishes a transient `nav.settling: true` on arrived reads
while `ctx.gate.jumping`, and the `approachDock` capability note names the
wait-on-`gate.jumping` contract. Focused regression is
`npm run test:arrival-handoff` (every-frame audit between the swap and the
ready state, plus the playtest refused/accepted pairing on the same reads);
passes seeds 1-8, is appended to `npm run test:boot`, and `npm run build`
and the full `npm run test:boot` pass. Parked follow-up: the same transient
could also be published on intermediate-hop recalcs if a runner ever polls
mid-fade there; not observed in any playtest.

## Hunt survivors: the employer dock takes prisoners — #273

Design decision (2026-11-04): hunt survivors get a contract-linked outlet on the
hunter's route. The dock that posted the hunt takes the quarry's crew as
prisoners for a small fee and employer standing, so scooping is part of the hunt
instead of dead weight in the hold. The tie is the quarry's own dead or captured
ordinary-pirate record in the origin system's persistent record bank
(`world.recordBanks`, JSON-plain, retained after a kill); it is deliberately not
the accepted hunt job, because `huntPayComplete` sets the job `failed` and
`replaceHuntJob` splices that row out of `world.jobs` at the 0.5 s payout tick,
before the player can dock. This choice needs no new persisted field, save key,
frozen event, digit, equipment SKU or `state.js` edit.

Implemented on `dsh/issue-273-survivor-prisoner-outlet` (base master
`c69c82c`). New headless module `src/game/prisoners.js` (the trafficking.js
pattern: no DOM, own frozen tuning) exposes `PRISONER_HANDOVER`
(60 UU and +1 employer standing per head), `prisonerFactions`,
`prisonerUnits` and `applyPrisonerHandover`. Only player-killed crew
(`source === 'playerKill'`) of a faction that owns a dead or captured
non-ace pirate record in that system's bank is eligible; unknowables, Named
Guns, corrupt over-cap rows and other-faction or rescued rows are left alone.
The handover removes the rows in place, pays once, banks standing for the dock
faction, emits only a `commLine` receipt and fails closed on a missing world,
bank, cargo or non-finite credit balance. `renderRescue` in `station.js` adds a
click-only `Hand over prisoners` row (no new digit; the existing `Return
survivors` button shares the same placement, including the level-1 dock menu),
and the other-faction line now tells the player where those people can go: their
own docks will take them home, or a Gilded fence will buy them.

Focused regression is `npm run test:survivor-prisoners` (8 groups: the record
tie and exclusions, player-kill only, merged and corrupt rows, one fee/standing
receipt, idempotence, fail-closed cases, invalid dock faction, the live
current-system bank fallback, and JSON-safe cargo). It is appended to
`npm run test:boot`, which passes with it, and `npm run build` passes with the
production bundle policy. Live browser evidence is
`npm run test:survivor-prisoners-live`: PASS in disposable Chromium (the
People-pane line, the click-only action, its receipt, credits 350 → 470,
employer standing +2, the hold emptied, a second refusal, and the other-faction
outlet wording at a non-employer dock; zero console errors or exceptions;
screenshots under `out/issue-273-live/survivor-prisoners`). The probe fixtures
the berth, the dead quarry record and the scooped survivor row; the focused test
pins the record tie at module level, so a natural hunt → kill → scoop →
employer-dock playthrough is still owed.

Build note: `vite.config.js` keeps esbuild's transform temp files under the
ignored `out/build-tmp` when the platform temp directory cannot delete them
(Windows file sandbox); this is an environment-only build fix with no runtime
bundle or gameplay change. `npm run build` now routes through
`scripts/build.mjs` (#286): the native config loader removes the
config-bundling esbuild child, and when the sandbox refuses even the
transpile/minify service spawn the wrapper fails with a named, actionable
error instead of raw EPERM noise — never a silent partial `dist/`.

Tooling note (#286): `scripts/lib/git-identity.mjs` is the shared
spawn-refusal-robust source-identity capture used by the boot-harness
suites and the live probes — piped `spawnSync('git', …)` on normal machines,
a clearly labeled filesystem-only identity (HEAD from the gitdir files, tree
hash over `src/`, `dirtyUnknown` instead of a guessed dirty flag) when the
sandbox refuses child spawns. `test:boot` completes under a restricted
sandbox; the WAVE181/182 boot-pin children relay their result line through
`WAVE_RESULT_FILE` when piped stdio is refused. Parked follow-up: piped
`spawnSync` children that pass stdin (issue-71/73/74-recovery/176/181
F-legs) still need an unrestricted spawn and fail loudly naming the
refusal; a stdin relay design touches five more suites.

Parked follow-ups (deliberately not in this issue): the tie is faction-level,
so an independent trader/miner/patrol crew can be taken once an independent
pirate died locally, and an ace kill's crew can ride on an ordinary dead pirate
of the same faction; survivor rows carry no origin, so crew can be redeemed at
another system that happens to have a dead pirate of that faction; merged
survivor rows keep only one quarry name; and a strict per-contract tie would
need one JSON-safe `recordId`/`huntId` stamped on the survivor row at spawn,
which AGENTS.md reserves for explicit scope. The People service string in
`agent-schema.js` does not mention prisoners; agents still discover the action
through `station.view.actions`.

## Ace bounty row names only a living ace — #269

Implemented on `dsh/issue-269-ace-bounty-row`, independently reviewed; this
revision closes the crew-gone derelict gap and adds a live withdrawal checkpoint:
an offered `bounty-ace` row now names only a living Named Gun record and carries
that record's own bounty, on every board. A system with no authored ace cast
borrows a living Named Gun from another system (the authored ace home first) and
says where that ace hunts; an ordinary local pirate can no longer appear at its
300 UU bounty under the ace title. When every ace is dead or a crew-gone derelict
the offered row is withdrawn from the Jobs board and the agent offer list instead
of being spliced, so a successor ace can re-offer it. An accepted agreement keeps
its named bearer while that bearer flies or while the player's kill on that name
is still owed, so a board read cannot retarget a pending claim; only a named
bearer that is gone with nothing owed is followed by a living Named Gun, and a
legacy save whose agreement named an ordinary pirate is never rewritten while
that record resolves and stays payable by that name. Settlement resolves the
current bearer of a reused lineage name (a living bearer blocks the claim, so a
dead predecessor's stale kill cannot pay the successor) and requires the latest
incident on that name to be the player's kill. A crew-gone derelict is a defeat
too: dead, captured and derelict all settle on the player-caused yield, and a
derelict record does not keep the offered posting.

Focused regression is `npm run test:ace-bounty` (18 checks: a sweep of all 101
boards, a dead ace, the aspirant cycle, lineage succession, accepted-agreement
freeze and follow, a legacy save, kill attribution, and a crew-gone derelict
withdrawal/successor and claim payout); it fails on the pre-fix source. The live
Chromium probe `npm run test:ace-bounty-live` passes the Freehold and Veridian
boards, the dead-ace withdrawal checkpoint, the accept receipt and a clean
console, and `npm run build` and the extended `npm run test:boot` (which now
includes the new focused test) pass. No new persisted field, key or save-schema
change. See the [hunt design](Msn02HuntDesign.md) for the board contract.

Parked follow-ups: the accepted-agreement follow still runs only on a board read,
so a successor killed before the next read is not credited and a row can stay
accepted while no live ace exists; a legacy pirate-named agreement whose pirate
died to the world stays accepted forever (bounty rows are not abandonable);
settlement attributes by name only, so a generated name that collides with an
ace name can pay or block the wrong claim; and the authored-default fallback
(a drifter/redmarch start before Freehold is generated) has no focused test.

## Explicit double-agent dossier choice — #240

Implemented and acceptance verified at runtime `c0a20d329f2ac759b1d6bb775d5b49f00fb8741a`.
One fresh Red Ledger dossier names a Veridian competing buyer, higher total and
-5/+2 standing consequences before acceptance. Honor, free decline and explicit
betrayal share strict evidence identity and one terminal settlement; unrelated
jobs and legacy contracts retain their terms. Independent code/security review,
24 focused groups, build, unchanged boot, natural earned sale/reload/original
return and controlled lifecycle/UI cases pass. Merged via PR #247 (`7862dfc`);
the tracker #233 close is recorded at the top of this file. No deployment.
Broader conflicts and #234 stay outside scope.
See [verification and limits](Issue240ImplementationReview.md) and
[approved design](Issue240DossierConflict.md).


## Contact briefings and scanner spy benefits — #239

Merged via PR #246 (`b8b2b5f`); the reviewed runtime was pinned at
`c510a7e03e79b862c070c8d61889c895aab8b0e8`. The owner selected
the recommended contact-plus-scanner slice from the approved design. A local
face at the employer or destination dock reads a free flight-plan briefing for
an accepted shadow assignment — static turnaround distance, the out-and-back
shuttle, the endpoint pivot and the match-straight / ease-turn tactic — with no
live telemetry and no cost. Mounted Wolfeye tiers lower the dossier-pursuit
suspicion rate to 4 / 3.5 / 3 inside the 150–400 unit band; crowding, basic
observation, prices and existing scanner capabilities are unchanged, and the
benefit is stated before purchase on every tier's row.

New `test:spy-benefits` (16 groups / 32 checks) plus 52 courier, 9 dossier,
agent-desk and refusal-token suites all exit 0 after the final scoped fix
(`out/issue-239/focused-*.log`). Those tests are synthetic: real pure
integrator and real booted desk, not natural flight. `npm run build` PASS in
10.26 s, full unchanged boot and independent Codex code/security review PASS
on the pinned runtime. Interim docs and controlled browser fixtures also PASS;
receipts are linked in the contract below. Natural stock payout of 840 UU once
plus reload and actual Mk I and Mk II purchases passed in one earned career.
Mk I reached partial dossier progress with reload preservation, then exposure
retained the basic payout; no natural Mk I dossier completion is claimed.
Mk II completed 30/30 using cooling bursts, paid 630 UU once, and retained
1360 UU across reload with no active job. An earlier unavailable courier and
failed wrapper remain recorded separately from the same-profile recovery.
Final evidence review and merge are complete; PR #246 carries the delivery.
A banked-favor write on the stale-briefing
refusal path was found and fixed narrowly, without changing global contact
semantics. No save, version, event, API schema or SKU changed; rollback is a
plain commit revert with no save migration. Concealed mounts and the #240
employer conflict stay parked. No deployment occurred. See
[the implemented contract and limits](Issue239SpyBenefits.md) and the
[implementation mission](missions/issue-239.md).

## Optional complete dossier — #238

Implemented on `codex/issue-238-deep-dossier`, runtime
`7838c9e21c7231dda5c77a853ebaefbf0e618edf`. The pilot explicitly chooses extra
courier evidence through the existing Galaxy Chart. Interrupted deep exposure
retains basic intelligence; complete evidence earns one frozen higher total at
the employer. Strict versioned saves and one-shot UI/API actions preserve terms.

Final independent code/security review, build, unchanged boot, 9 dossier groups
and 52 base courier groups pass. Natural deep play verified warning, cooling,
in-progress reload, reacquisition, 30/30 completion and 630 UU exactly once
(350 → 980), retained after post-payment reload. Source/harness identities stayed
stable; console/network checks and dedicated cleanup were clean. Earlier scoped
basic and exposed-deep runs each verified 420 UU once plus reload negatives.
The final native UI fixture passes held-Space release, explicit end/repeat
negatives, multiple-row identity, remapped binding and single-copy Jobs terms,
with clean console/network and cleanup. Implementation and acceptance were
verified before merge; merged via PR #245 (`b8c40a5`), with issue closure on that
merge. The narrow restore ownership repair is recorded and independently
reviewed. Tuning remains provisional; #234 is separate. No deployment is
claimed. See
[implementation evidence and limits](Issue238ImplementationReview.md).
## Courier shadowing and mission-local suspicion — #236 / #237

Merged via PR #244 (`a983981`); acceptance was verified on the isolated branch
`codex/issues-236-237-courier` with runtime candidate
`da1dc8cfa06e87eb0f3c16343b1e173bcd45e3c7`. The owner approved the schema and
scope on 2026-09-17. The separate **Shadow courier** posting adds named-target
observation, mission-local suspicion, warning/withdrawal, persisted grace,
exposure and employer-only basic payment while preserving introductory spy jobs.

Independent code/regression and bounded security reviews PASS. All 52 focused
grouped checks, build and unchanged boot pass. Natural starter-hull play verified
30 seconds of observation, lost/reacquired contact, a mixed introductory/shadow
career and exactly 840 UU combined settlement with no duplicate payment. A
second successful session verified warning, safe withdrawal, exact grace across
ordinary autosave reload, deliberate exposure and escape without forced combat.
Both successful scenarios had zero console errors/exceptions. Desktop and narrow
mission status were visually checked.

The courier's motion corridor, route/envelope clearance, strict save validation,
identity/lifecycle and per-job isolation have focused automated coverage.
Earlier review failures were repaired, including the HUD warning priority across
employers. The successful career's delayed browser shutdown is recorded honestly
with independent cleanup confirmation; the combined warning run completed with
clean harness shutdown. Existing #234 docking failures and provisional balance
remain separate limitations. Optional deep intelligence (#238) is also merged
(PR #245); see its separate verified acceptance entry above.

See the [final implementation review](Issue236237ImplementationReview.md) for
exact evidence and limits, the [implementation mission](missions/issue-236-237.md)
for history, and the [approved contract](Issue236237CourierShadowingDesign.md)
and [design review](Issue236237DesignReview.md) for scope. Merged via PR #244;
no deployment occurred.

## Light-hull arrival diagnosis and recovery guidance — #234

Closed by the owner on 2026-09-23 as not planned; not complete. The issue had
no measurable finish line, and each fix moved failures between classes. Merged
work: recovery wording for `impact` and `blocked`, the cruise turn-progress
fix, hub junction rings solid to the dock planner, and the child issues #255
(arrival faces the system and holds; later a 5 u/s drift out of the jump
zone), #258 (route dock test traffic isolated) and #261 (stage leg after a
traffic hold).

Census at `227ad8c` (seeds 1-8, 94 legs): 90 docked, 76 on the first attempt,
11 `impact` cancellations, 4 damaging contacts, and 22 `blocked` cancellations
on 9 legs. 9 of the 22 `blocked` had no hull within 120u. A suspected planner
pin at the sun keep sphere (seed 5 leg 7, seed 7 leg 8) is not proved. The
four original playtest failures stay unreproduced. The owner will file narrow
issues if necessary. See [diagnosis and evidence limits](Issue234LightDocking.md).

## Collected spy intel status — #235

Merged via PR #241 (`83ec515`) after independent QA: an accepted
espionage row whose objective is collected reports `Intel acquired—return to
<station> to file.` in `observe().jobs.active[]`, naming its own `payAt` and
agreeing with the Jobs desk card. The pre-collection briefing, destination
fields, other job families, rewards, deadlines and settlement are unchanged, and
nothing new is saved. Focused #203/#205/#209 coverage was extended with
before/after collection, two employers, and delivered/lapsed/abandoned records
with no duplicate payment; the live Chromium probe passes. Follow-up to closed
#205, under tracking issue #233. No deployment occurred; see
[scope and evidence](Issue235SpyStatus.md).

## Predictable freighter docking — #221

Implemented on `codex/issue-221-freighter-docking`, pending independent QA.
Explicit and queued dock approaches share arrival-gate clearance. The freighter
uses its available class-limited steering and a bounded outer-stage speed;
transient stalls get one same-helm replan, while persistent obstruction stops
safely with a lasting HUD reason. Mounted-freighter corridor and arrival pins
cover real ship physics. See [acceptance and evidence](Issue221FreighterDocking.md).

## Purchased hull identity — #225

Implemented on the `codex/issues-223-225` candidate, pending independent QA:
Yard purchases receive a ship name of their own, and Hangar rows show name
and class separately. The mounted ship uses its name in station copy.
See [scope and builder evidence](Issue225YardHullNames.md). Merge and deployment
remain separate.

## Stable posted haul quotes — #223

Implemented on `codex/issues-223-225`, pending independent QA: periodic Jobs
board refreshes preserve the haul reward the player read. The board, accept
notice, accepted card and `observe().jobs` retain that number despite price
or time drift. Explicit fresh board visits can post a new quote; accepted pay
remains frozen. Builder focused and live Chromium checks pass. Merge and
deployment remain separate; see [scope and evidence](Issue223-StableHaulQuote.md).


## Pirate demand comms at berth — #224

Implemented on `codex/issue-224-pirate-comms`, pending independent QA:
pirate demand lines stay silent while docked or in the berth hold. Identical
sender/text comm lines enter the shared event queue at most once per five
simulation seconds; distinct lines and senders remain independent. Debounce
state is session-only and resets on system load or clock rewind. The boot
command includes the docked/held demand regression and in-flight controls;
`npm run test:pirate-comms-live` runs the same fixtures in disposable Chromium.

## Repair cost scales with hull class — #208

Implemented on an isolated candidate, pending independent QA: the yard bill
still prices the integrity missing, linearly, but that bill is now multiplied by
an authored hull-class factor (light 3x, cutter 3x, heavy 4x, ace 5x,
freighter 6x, frigate 8x) before each channel is rounded. Cargo value and damage
source are not read, per the owner's ruling on the issue. `REPAIR_RATES` and the
class table moved to `src/game/state.js`; `repairAll`'s corruption-recovery
baseline was made own-property-safe so an unauthored or inherited class name
falls back to light on the payment path as well as the price path. No new
persisted field and no migration. Tuning burden over a full campaign is
unvalidated. See [the decision, arithmetic and evidence](Issue208RepairBalanceRecommendations.md).

## Ordinary job abandonment — #207

Implemented on an isolated candidate, pending independent QA: accepted mining,
trade, hunt, passenger, explore, espionage and war jobs can be abandoned at any
Jobs desk for -1 standing with the posting faction. The visible button and
`abandonJob` API share the same policy. Ferry, legacy haul, recovery, chain,
bounty and patrol remain excluded. See [the acceptance contract and verification](Issue207JobAbandonDesign.md).


Agent API scope refreshed 2026-09-14 against master
`0991593bd905d00451b9f7d2b5f58eea737d3ac2` (merge of PR #167).
The merged-outcome table retains the 2026-09-13 inventory at
`cc7be05969e0ad2514428454dd9057ddb5849052`; it is historical evidence,
not a claim that no issues remain open. The piracy aftermath set (#146–#159)
is merged, and its
[index at `cc7be059`](https://github.com/barryrwilson/Rimward/blob/cc7be059/docs/REMAINING-WORK.md)
retains the long per-issue prose.
[Consolidation PR #97](https://github.com/barryrwilson/Rimward/pull/97) is the
earlier documentation and verification repair; every issue it left in review
has since merged and moved to the completed table.

This is the compact current index. The assigned GitHub issue governs a selected
task; the wishlist preserves product intent and playtest observations.
`PROGRESS.md` and dated verification documents are historical evidence.
The [pre-consolidation index at `0dd7908e`](https://github.com/barryrwilson/Rimward/blob/0dd7908e3929725d646958d43f63de57b68dc7c8/docs/REMAINING-WORK.md)
retains the detailed implementation claims, trader acceptance contracts, artifact
identities, raw failures and intermediate review states; the
[index at `6bb15385`](https://github.com/barryrwilson/Rimward/blob/6bb15385/docs/REMAINING-WORK.md)
retains the long per-issue verification prose for #98–#125 that the table
below compresses. Final PR records supersede their stale pending-review and
not-yet-merged labels. Merge status alone is not fresh QA, release readiness,
or deployment evidence.


## Trader API clarity — #203, #205, #209

Implemented and verified on 2026-09-16: commodity identity on market actions,
return-dock payment instructions in accepted job observations, and a named
restricted-trade refusal token. Build, unchanged boot, focused regressions, live
Chromium and independent Claude review pass
on `codex/issues-203-205-209`; merge and deployment remain separate.
See [scope and evidence](Issues203205209TraderClarity.md).
## Implementation records and status

Historical records for #168–#186 below retain their implementation and review
evidence. Their pending labels are superseded by the merged PR records in the
completed table (PR #180 and #187–199); they are not outstanding implementation
tasks. Newer follow-ups and their limitations remain recorded below. This
reconciliation covers PRs #165, #167, #180 and #187–199 as of 2026-09-16
(local date), against master `357d4987724b8bc6afb2afe22be2fdd8a1d81f6a`.
It is not an open-issue census or new QA.

Issue [#206](https://github.com/barryrwilson/Rimward/issues/206) is implemented
on the isolated `codex/issue-206-haul-duplicates` candidate: the legacy
`haul-provisions` consignment is retired from the jobs board. The generated
trade rows already cover Provisions hauling; the original Freehold and Veridian
playtest found a generated row beside the legacy posting with matching pay and
the same destination, though generated routes may vary from board to board. The
legacy posting was also the weaker of the two, because it carried no
`commodity`, `destSystem`, `originSystem` or `deadline` for an agent to filter
on. `makeJobs` no longer seeds it, `boardJobs` never posts a row that is not an
ACCEPTED agreement, and `acceptJob` refuses the id outright so the last
handle-holding caller fails closed as well.

Scope held, and old saves are not rewritten. The retirement is a removal, not a
migration: `uniqueFourId`, the persist/handle plumbing, `save.js`'s unique-kind
contract and the whole `kind: 'haul'` settlement path are untouched, so a save
that was carrying the agreement when the posting went keeps its board card, its
named destination, its arrival-cargo guard (#182), its consignment-first
same-berth order (#181), its accept-time locked quote and its one-time payout. A
save that only held the stale OFFERED record keeps that record byte-for-byte; it
simply never posts and can never be taken.

The stated limitation: #179's buy-in line — the "Buy-in here: 5 Provisions at
100 UU" guidance that told a player what an un-fronted haul would cost before he
accepted it — was drawn only on the offered `haul-provisions` card, so it goes
with the posting. The generated trade rows are not fronted either and have never
carried that line. Restoring the guidance on them is real product work, is
deliberately outside this removal-only issue, and is proposed as a follow-up
rather than left implied; `haulBuyInFor` is kept intact in `station.js` as its
working copy.

Focused regression is `node --import ./scripts/with-css-stub.mjs
scripts/issue-206-haul-duplicates-test.mjs` (16 checks). `test:agent-desk`,
`test:market-pane`, `test:same-berth` and `test:arrival-cargo` pass with
explicitly injected legacy records in place of the retired accept call, and the
`WAVE181`/`WAVE182` boot pins still report every key true. The browser passes are
`test:same-berth-live` and `test:arrival-cargo-live`, plus a live Freehold and
Veridian board read under `out/issue-206/`. Independent QA is pending; this is
not a merge or deployment claim.

Issue [#204](https://github.com/barryrwilson/Rimward/issues/204) is implemented
on `codex/issue-204-origin-discovery`: origin ids are discoverable instead of
guessed. While `observe().session.phase === 'origin'` the block carries
`origins: [{ id, title, digit }]` in Digit order, built from the one
choosability predicate the overlay's Digit keys and click rows already obey
(`originChoices()` in `src/game/origins.js`), so the agent reads exactly the
rows a player sees. An `unknown` `chooseOrigin` refusal now carries `detail`
naming those live ids and pointing at the observation, and
`COMMAND_SPECS.chooseOrigin.args.id` says where the ids come from. The detail
never echoes the rejected id. Outside the origin phase the session block is
`{ phase }` exactly as before; the refusal tokens, the fail-closed argument
validation and every other observe field are unchanged, and no key, event,
tuning value or persisted field is added. Focused regression is
`scripts/issue-204-origin-discovery-test.mjs` (12 checks: live-list/overlay-row
parity, unknown/reserved/malformed ids leaving state untouched, detail
contents, JSON round trip and per-call copy isolation, absence outside the
origin phase, and each listed id accepted in its own clean boot). Evidence:
`out/issue-204/`. Build, `npm run test:boot`, independent QA and live browser
validation remain pending; this is not a merge or deployment claim.

Issue [#202](https://github.com/barryrwilson/Rimward/issues/202) is implemented
on `codex/issue-202-helm-events`: `autopilotDisengaged` and
`automineDisengaged` are KEEP_RING helm shutdown receipts, so a hull parked
beside an NPC-on-NPC fight still observes its own helm break instead of a ring
filled with chatter it never took part in. The 16-row cap, the eviction order
and every existing keep-class rule for combat receipts are unchanged; the
matching engage rows stay ordinary chatter. Focused regression is the issue
#202 section of `npm run test:agent-schema` (203 checks pass; 20 pinned
failures were recorded before the fix). See
[mission record](missions/issue-202-helm-events.md). Stage is testing:
`npm run build` passes (`.verification/issue-202/build.log`). Quinn's live
browser acceptance check passed: the production autopilot impact break and the
production automine hit break, under a `ctx.emit` combat saturation fixture,
harvested naturally by the running session, with both receipts read back from
the public `observe()` surface, the 16-row cap held, survival across later
chatter, eventual FIFO ageing, zero console errors or exceptions, and a
visually reviewed screenshot. Evidence:
`out/issue-202-evidence/live/results.json`, `run.log` and `live.png`.
`npm run test:boot` passes, exit 0 with `BOOT TEST PASS` and no update errors
(`.verification/issue-202/boot.log`). Independent Quinn QA of the exact commit
is pending. This is not a merge or deployment claim.

Issue [#200](https://github.com/barryrwilson/Rimward/issues/200) is implemented
on `codex/issue-200-harmless-dock-touch`: the dock autopilot's zero-damage touch
rule, added for the station berth in #184, now reads `damage` and `speed` alone.
A `bodyHit` row with `damage === 0` and a finite `|speed|` under 1 u/s keeps the
dock helm for every body kind and in every dock phase, so a cruise brush against
traffic or a rock no longer stops the hull in open space. Damage, a speed at or
above the floor, and any malformed or non-finite `speed`/`damage` still cancel as
`impact`, and every `bodyHit` row in the frame is still judged, so a harmless
touch cannot mask a real impact. Route helm behavior, the #173 cancellation full
stop and weapon-hit separation are unchanged; no key, event, tuning value or
persisted field is added. Focused regression is `npm run test:dock-corridor`
(250 issue-200 pins) plus a new `issue200` block in `npm run test:boot` covering
the playtest's ship and asteroid cruise touches; both fail on the pre-fix source.
`npm run build` and `npm run test:boot` pass. See
[evidence](playtests/2026-09-15-issue-200-harmless-touch.md). Independent QA and
live browser validation remain pending; this is not a merge or deployment claim.

Issue [#186](https://github.com/barryrwilson/Rimward/issues/186), owner decision
2, is implemented on `codex/issue-186-trader-shipyard`: the larger cargo hull
the yard already sells is made visible once the outfitter's two hold racks are
spent. The maxed-rack note still reads the real capacity; below it, when that
capacity is under `cargoHoldFor('freighter')`, the pane names the freighter's
stock hold and the Shipyard Yard pane, or says this yard stocks no freighter and
points at another dock. A maxed freighter is told nothing further. Yard cards
and the confirm box read `cargoHoldFor` / `cargoHoldMax`, so a buyer sees the
stock hold and the hold with racks before signing. No new hull, SKU, price,
stock, standing rule, save field or key. Focused regression is
`npm run test:bigger-hold`; `npm run build` and an unchanged `npm run test:boot`
pass. This is a visibility outcome: the trader's UU ceiling and market
liquidity are not claimed as solved. Independent Codex QA passed implementation
`15af18b9ad9d3cf04622c065e373d080a364eda0`: seven real headless Chrome
screenshots were visually inspected, with clean console output. Purchase checks
verified existing refusal gates and a 160-unit freighter with the expected debit.
Browser checks used disclosed fixtures; they do not claim natural progression.
Evidence: `out/issue-186-evidence/quinn-verdict.md`, `quinn-live/result.json` and
`quinn-purchase/result.json` in the local evidence workspace. No merge or
deployment is claimed.

Issue [#175](https://github.com/barryrwilson/Rimward/issues/175), owner-selected
Option B, is implemented on `codex/issue-175-counter-spread`: commodity sell
fills are capped at 95% of the same counter's buy fill, rounded down to whole
UU. Existing lower sell offers and all modifier chains remain intact. The pane,
agent observation and actual transactions share the fill; an unchanged-counter
round trip costs UU while inter-system price differences can still pay.
See [implementation evidence](Issue175CounterSpreadEvidence.md). Independent QA
is pending; this is not a merge or deployment claim.

Issues [#182](https://github.com/barryrwilson/Rimward/issues/182) and
[#219](https://github.com/barryrwilson/Rimward/issues/219): delivery cargo is
measured against one shared system-arrival manifest, spent down as goods leave
through `removeCargo`. Destination purchases cannot complete a trade agreement
or legacy `haul-provisions` consignment, even after launching, flying and
redocking in the same system. Same-system `systemLoaded` notifications do not
refresh eligibility. A different-system arrival captures the carried goods;
competing jobs still share the manifest and #181's consignment-first order.
Destination job rows show eligible units alongside units aboard, and posting
copy tells the player to buy or hold the goods before the jump.

The #219 candidate deliberately keeps eligibility session-only: no persisted
field or save-schema change. Initial boot and restored bank ownership initialize
from the current hold; in-game death recovery starts a fresh manifest too.
Saving local stock and reloading, or recovering after death with local stock
in the restored hold, can therefore still qualify it. Legacy same-system snapshots
without a replacement record-bank map can retain the existing session manifest.
Persisted cargo provenance remains follow-up scope, not a claim of this fix.

Focused regression is `npm run test:arrival-cargo`; its `WAVE182` boot pin now
requires the same-system redock refusal. Same-berth and retired-haul fixtures
explicitly cross systems when they represent a newly carried shipment.
Implementation candidate; independent review and live browser evidence are
recorded by the coordinating task. No merge or deployment is implied.

Issue [#181](https://github.com/barryrwilson/Rimward/issues/181) is implemented
on the isolated `codex/issue-181-same-berth-settlement` candidate: a delivered
unique consignment no longer fences the berth it paid in. `haul-provisions` is
settled first in a delivery pass whatever the job order is, and it reserves only
the five Provisions it was quoted on, so ordinary trade deliveries for other
commodities and every passenger party settle in the same berth with no relaunch.
The one remaining hold — units aboard but committed to the unique consignment —
is named on the desk row and in `observe().jobs.active[].holdReason`, derived per
read with no new persisted field. Destination, commodity, deadline and
idempotence checks are unchanged, and the shared fence helper still guards survey
filing, chain steps and the generic accepted branch; freeing those kinds is a
separate question. Destination-purchase provenance was parked at the
time and is now answered by
[#182](https://github.com/barryrwilson/Rimward/issues/182), above. See [the policy section](PassengerCommitmentPolicyDesign.md).
Focused regression is `npm run test:same-berth`; boot adds `WAVE181`; the browser
pass is `npm run test:same-berth-live`. Merged as
[PR #191](https://github.com/barryrwilson/Rimward/pull/191).

Issue [#176](https://github.com/barryrwilson/Rimward/issues/176) is implemented
on the isolated `codex/issue-176-two-gate-jobs` candidate: every authored
charted job board posts exactly one destination two gates away, shared across
the haul/trade, ferry and passenger families and never more than one. The
shortest-distance walk is confined to the charted authored ring, so no posting
names a procedural or unseen detour. Reward scales 140% -> 175% of buy cost and
the delivery window scales one generous window per gate; both card copy and the
reward line state the distance. The seat counts accepted work and is per origin,
so a long run cannot be farmed two at a time from one dock while another
origin's board keeps its own. Distance is derived from the posting's existing
`originSystem`/`destSystem` pair, so no new persisted field is added and
`sanitizeJobs` gained no new narrowing. The unique `haul-provisions` tutorial
contract deliberately stays a one-gate run. See
[the design section](Msn02TradeDesign.md) (§5a). Focused regression is
`npm run test:two-gate-jobs`; boot adds `WAVE176`. Independent QA, the final
build/boot gate and a live browser pass are pending; this is not a merge or
deployment claim.

Issue [#177](https://github.com/barryrwilson/Rimward/issues/177) is implemented
on the isolated `codex/issue-177-consignment` candidate: a ferry's fronted
Provisions are derived as consigned from the live contract, named in the hold
total, the market pane, the bulk preview, the HUD meter and `observe()`, and
kept out of every public sell path — `Sell All`, the row sell buttons, the
keyboard sells and the `trade` action. No new persisted field is added and the
short-landing settlement rule is unchanged. See
[evidence](../reviews/issue-177-consignment-evidence.md). Independent QA is
pending; this is not a merge or deployment claim. Delivery ordering between a
haul and an aboard consignment remains a separate question.

Issue [#183](https://github.com/barryrwilson/Rimward/issues/183) is implemented
on `codex/issue-183-route-dock`: an agent can ask for the station in one step.
`approachDock` sent while a route lease is engaged is accepted and queued
against that route's destination, with an `{ ok: true, status: 'queued' }`
receipt and `observe().autopilot.queuedDock` naming the bound system. The route
helm keeps the ship to the final arrival; the existing cruise/stage/corridor/
settle controller then takes the berth with no second command. The wish is
session-only (never persisted, never restored) and ends on any lease
cancellation, the Escape takeover, a manual break, `clearRoute`, or any
`plotRoute` — a same-destination replot included — so it can never ride a later
route. Every other refusal is unchanged, including `autopilot` for a repeat
while the dock helm is already flying. Only a queued route carries its lease
through the automatic per-jump recalc; an ordinary route still comes off the
helm at every jump. `npm run test:route-dock` flies the real system loop for a
one-hop and a two-hop case and runs as a checked child of `npm run test:boot`;
its queue pins fail on the pre-fix source. Independent QA and live browser
validation remain pending; this is not a merge or deployment claim.

Issue [#258](https://github.com/barryrwilson/Rimward/issues/258): the #183
runner passed only on its pinned seed, because live traffic could block or
strike its approaches (the open traffic class in #234). It now removes live
NPC traffic every tick as one disclosed fixture, takes `ISSUE183_SEED`
(default 7), and passes on seeds 1-8; the pre-fix runner fails seeds 4, 5, 6
and 8 on `master` at `0d45aa9f`. No assertion or boot-harness line changed.
Traffic-associated dock failures stay with #234.

Issue [#261](https://github.com/barryrwilson/Rimward/issues/261): after a
traffic hold stopped the light hull 79u from the Veridian station, the stage
leg hit the station at 27 u/s and cancelled as `impact`. Two faults caused it.
The detour side came from the cruise side hint, so the helm latched the far
way round; and a station detour kept creep while the nose still pointed at the
station. Now a hull at creep or slower latches the shorter clear side to the
stage point, and a stage detour turns in place while its nose is on the station
body. `issue-261-stage-hold-dock-test` pins it as a checked child of
`npm run test:boot` and fails on the pre-fix source. With the #255 arrival
drift applied, `issue-168-cruise-test` seeds 1-12 have no station impact; seed
12 still ends `blocked`, as on the base code (the #234 class).

Issue [#201](https://github.com/barryrwilson/Rimward/issues/201) is implemented
on `codex/issue-201-arrival-dock`. Only queued handovers that would start a
cruise leg enter the gate-departure guard: align while stopped, then clear the
bore at creep when necessary. Outbound courses release the guard after safe
plane clearance and alignment; return courses first clear the padded ring and
retain its outer rim in their private transit plan. Short-range stage handovers
and ordinary dock approaches keep their existing behavior and #183 timing.
Build, full boot (including the checked #201 child), the #183 regression, and
the declared-seed-7 bore-edge browser round trip pass. The browser run reaches
both berths with no body hits or console errors. Unseeded downstream asteroid
and traffic encounters remain outside this departure fix; #200 contact policy
is unchanged. [PR #211](https://github.com/barryrwilson/Rimward/pull/211) is the
authoritative record for final independent review and natural-arrival browser
verification. This is not a merge or deployment claim.
Issue [#185](https://github.com/barryrwilson/Rimward/issues/185) is implemented
on `codex/issue-185-dock-receipts`: successful docking no longer produces an
in-range `dock-range` miss or the helm's own already-docked refusal. Manual
out-of-range and explicit already-docked refusals remain. See
[evidence](Issue185DockReceiptsEvidence.md); independent review remains pending.

Issue [#184](https://github.com/barryrwilson/Rimward/issues/184) is implemented
on `codex/issue-184-station-touch`: in the dock autopilot `stage` and `settle`
phases only, a `bodyHit` row against the station with `damage === 0` and a
finite `|speed|` under 1 u/s no longer cancels the approach. Every other row
still cancels, including a malformed or non-finite speed or damage, another
body kind, a speed at or above the floor, and any other phase. All `bodyHit`
rows in the frame are judged, so a harmless touch cannot mask a real impact.
The #173 cancellation full stop and weapon-hit separation are unchanged, and
other autopilot modes are untouched. `scripts/issue-139-dock-corridor-test.mjs`
pins the new cases; its ten keep-the-helm pins fail on the pre-fix source.
Independent QA and live browser validation remain pending; this is not a merge
or deployment claim.

Issue [#173](https://github.com/barryrwilson/Rimward/issues/173) is implemented
on `fix/issue-173-dock-cancel`: impact, blocked, and stale dock cancellations
latch full stop unless hail or a combat lease owns the helm. The impact notice
names hull contact. Real weapon projectiles remain distinct from physical
contact; simultaneous contact still cancels. See [evidence](Issue173DockCancelEvidence.md).
Independent review and publication remain pending; zero-damage contact policy
belongs to #184.

Issue [#172](https://github.com/barryrwilson/Rimward/issues/172) is implemented
on the local `fix/issue-172-dock-sun` candidate; independent QA is pending.
PR #180 already retained solar detours. This follow-up scans all valid planner
keep-out bodies and adds the five authored-gate solar approach cases to the
boot gate. The cases use real jump arrival positions, a stationary hull facing
the station stage, and isolated NPC traffic; solar damage, asteroids, station
collision and actual berth completion remain active. Arrival-turn gate-ring
contacts and zero-damage contact cancellation are outside this issue.

The five Agent API playtest outcomes below are implemented on the local
`codex/agent-api-fixes` candidate. Focused builder checks and live evidence
are recorded; **final integrated QA and publication remain pending**. This
status is not a merge or deployment claim. See the
[mission record](AgentApiFixes20260914.md) for artifact identity and gates.

| Outcome | Issue | Evidence |
|---|---|---|
| Cruise-speed current-station approach with braking and sun/body avoidance | [#168](https://github.com/barryrwilson/Rimward/issues/168) | [Cruise evidence](Issue168CruiseEvidence.md), [bounded station-detour progress](Issue168DetourProgressEvidence.md), [parked-hull exit](Issue168CruisePadExitEvidence.md); final combined verification pending; retains planned sun detours overlapping #172. |
| Documented raw pitch sign and real-hull steering regressions | [#169](https://github.com/barryrwilson/Rimward/issues/169) | [Steering evidence](Issue169SteeringEvidence.md); original no-turn symptom unreplicated in isolated Chrome. |
| Named desk refusals, service-pane launch and station-local offered work | [#170](https://github.com/barryrwilson/Rimward/issues/170) | [Desk evidence](Issue170DeskEvidence.md). |
| Raw burner pulse without flee ownership, with immediate dock handoff | [#171](https://github.com/barryrwilson/Rimward/issues/171) | [Desk/burner evidence](Issue170DeskEvidence.md); combat retreat authorization unchanged. |
| One displayed haul quote across desk, observation and acceptance | [#178](https://github.com/barryrwilson/Rimward/issues/178) | [Quote evidence](Issue170DeskEvidence.md); accepted pay stays fixed. |

Unrelated dock-cancellation, market presentation, consignment, and new mission
work remains governed by its own issues. This refresh does not claim their
completion or a census of every open GitHub issue.

[#163](https://github.com/barryrwilson/Rimward/issues/163), Agent Play mouse
ownership, merged in [PR #165](https://github.com/barryrwilson/Rimward/pull/165).
[#166](https://github.com/barryrwilson/Rimward/issues/166), station-hold
pressure, is included in this base through
[PR #167](https://github.com/barryrwilson/Rimward/pull/167). The 300 u hold
radius and a dwell readout remain design candidates, not part of this task.

Parked follow-ups recorded by the merged issues, none promoted to a task:

- Station security reacting to a hostile hunter near the dock, ace demand
  behaviour and starter cruise speed versus an ace (#125); a job that sends a
  patrol across a gate (#125).
- The optional fear-rating suppression of rival pirate interest (#123).
- A visible prize crew flying a captured hull to the station, the
  pirate-faction Q-ship re-entry, and a boarding that survives a save/restore
  or a range cull (#147).
- A visible salvage tug for the NPC derelict claim; the salvage hail (H) on a
  derelict still keys on `disabled` (#148).
- Rare-ore respawn weighting and respawn size for a reseeded asteroid slot
  (#149).
- A pirate scooping a spill it did not cause, and a pirate purse that is ever
  spent (#151).
- Strip-and-keep of weapons before a hull sale, selling the mounted hull, and
  buying back a sold hull (#158).
- Flying a claimed hull back physically, repairs or refits as part of a keep,
  and NPC claimants of a derelict (#159).

## Completed and merged outcomes

All issue numbers in this table are closed. Linked PRs are merged into the
snapshot above; their review and verification records apply to their named
artifacts, with their stated limitations.

| Outcome | Issue / merged PR | Durable design or evidence |
|---|---|---|
| Name the restricted-locker gate and its unlocks; add the People-desk fence restricted-cargo sell row | [#317](https://github.com/barryrwilson/Rimward/issues/317) / [PR #321](https://github.com/barryrwilson/Rimward/pull/321) | [Evidence](Issue317RestrictedFenceEvidence.md); `npm run test:restricted-fence` inside `test:boot`; live browser check 2026-11-16. |
| Clarify haul buy-in, market refusals, and temporary price events | [#179](https://github.com/barryrwilson/Rimward/issues/179) / [PR #199](https://github.com/barryrwilson/Rimward/pull/199) | [Existing design and evidence](Issue179MarketPane.md); merge alone does not establish new QA. |
| Remember visited station sell prices for trade planning | [#174](https://github.com/barryrwilson/Rimward/issues/174) / [PR #198](https://github.com/barryrwilson/Rimward/pull/198) | [Existing design and evidence](Issue174PriceMemory.md); merge alone does not establish new QA. |
| Make larger cargo hulls discoverable after maxing hold racks | [#186](https://github.com/barryrwilson/Rimward/issues/186) / [PR #197](https://github.com/barryrwilson/Rimward/pull/197) | Merged outcome; see PR for recorded scope and evidence. |
| Fix false failure messages after automatic docking | [#185](https://github.com/barryrwilson/Rimward/issues/185) / [PR #196](https://github.com/barryrwilson/Rimward/pull/196) | [Existing design and evidence](Issue185DockReceiptsEvidence.md); merge alone does not establish new QA. |
| Add a real commodity counter buy/sell spread | [#175](https://github.com/barryrwilson/Rimward/issues/175) / [PR #195](https://github.com/barryrwilson/Rimward/pull/195) | [Existing design and evidence](Issue175CounterSpreadEvidence.md); merge alone does not establish new QA. |
| Queue station docking behind agent routes | [#183](https://github.com/barryrwilson/Rimward/issues/183) / [PR #194](https://github.com/barryrwilson/Rimward/pull/194) | Merged outcome; see PR for recorded scope and evidence. |
| Fix harmless station touches cancelling dock approach | [#184](https://github.com/barryrwilson/Rimward/issues/184) / [PR #193](https://github.com/barryrwilson/Rimward/pull/193) | Merged outcome; see PR for recorded scope and evidence. |
| Fix haul payouts for destination purchases during a berth | [#182](https://github.com/barryrwilson/Rimward/issues/182) / [PR #192](https://github.com/barryrwilson/Rimward/pull/192) | [Existing design and evidence](playtests/2026-09-15-issue-182-arrival-cargo.md); merge alone does not establish new QA. |
| Fix same-berth settlement after unique haul delivery | [#181](https://github.com/barryrwilson/Rimward/issues/181) / [PR #191](https://github.com/barryrwilson/Rimward/pull/191) | [Existing design and evidence](PassengerCommitmentPolicyDesign.md); merge alone does not establish new QA. |
| Add two-gate transport jobs with distance-scaled pay and deadlines | [#176](https://github.com/barryrwilson/Rimward/issues/176) / [PR #190](https://github.com/barryrwilson/Rimward/pull/190) | [Existing design and evidence](Msn02TradeDesign.md); merge alone does not establish new QA. |
| Protect ferry consignment cargo from market sales | [#177](https://github.com/barryrwilson/Rimward/issues/177) / [PR #189](https://github.com/barryrwilson/Rimward/pull/189) | [Existing design and evidence](../reviews/issue-177-consignment-evidence.md); merge alone does not establish new QA. |
| Stop the ship after failed dock approaches | [#173](https://github.com/barryrwilson/Rimward/issues/173) / [PR #188](https://github.com/barryrwilson/Rimward/pull/188) | [Existing design and evidence](Issue173DockCancelEvidence.md); merge alone does not establish new QA. |
| Fix docking stage detours for all keep-out bodies | [#172](https://github.com/barryrwilson/Rimward/issues/172) / [PR #187](https://github.com/barryrwilson/Rimward/pull/187) | Merged outcome; see PR for recorded scope and evidence. |
| Fix Agent API station approach, controls, and desk consistency | [#168](https://github.com/barryrwilson/Rimward/issues/168), [#169](https://github.com/barryrwilson/Rimward/issues/169), [#170](https://github.com/barryrwilson/Rimward/issues/170), [#171](https://github.com/barryrwilson/Rimward/issues/171), [#178](https://github.com/barryrwilson/Rimward/issues/178) / [PR #180](https://github.com/barryrwilson/Rimward/pull/180) | [Existing design and evidence](AgentApiFixes20260914.md); merge alone does not establish new QA. |
| Station hold: only live pursuit presses the dwell (#166) | [#166](https://github.com/barryrwilson/Rimward/issues/166) / [PR #167](https://github.com/barryrwilson/Rimward/pull/167) | Merged outcome; see PR for recorded scope and evidence. |
| Only Escape takes the ship back from Agent Play; pointer motion, clicks, flight keys and the fire button are discarded while a lease or an agent-engaged helm owns it, and the HUD says so | [#163](https://github.com/barryrwilson/Rimward/issues/163) / [PR #165](https://github.com/barryrwilson/Rimward/pull/165) | `agentOwnsShip` / `markAgentHelm` in `src/systems/controls.js`; `observe().control.input === 'escape'`; the Escape-only contract in [AgentApiDesign.md](AgentApiDesign.md) and [AgentReactiveDefenseDesign.md](AgentReactiveDefenseDesign.md); issue #163 pins in `test:combat-intent`, `test:reactive-defense`, wave 132/141 of `test:boot`; live check 2026-09-13. |
| A claimed derelict is kept as an owned hull, sold, or returned at the shipyard desk by the player's choice; a kept hull carries the kit its class implies and `hot: true` | [#159](https://github.com/barryrwilson/Rimward/issues/159) / [#161](https://github.com/barryrwilson/Rimward/pull/161) | `settleClaimedHull` in `src/game/derelict.js`; **Claimed hulls** pane in `shipyard-desk.js`; `npm run test:prize` section 8 inside `test:boot`; live check 2026-09-13. Nothing settles on dock any more. |
| The shipyard buys an unmounted hull back from the hangar (`HULL_RESALE` home/foreign rates; a hot hull sells anywhere at the fence rate) | [#158](https://github.com/barryrwilson/Rimward/issues/158) / [#160](https://github.com/barryrwilson/Rimward/pull/160) | `sellHangarHull` in `src/game/shipyard.js`; `npm run test:hull-sale` (58 pins) inside `test:boot`; live check 2026-09-13. |
| An NPC pirate may claim the crew and the hull of a yielded trader and fence the prize; a crewless hull is claimable by the player (H on a locked derelict) onto `world.claimedHulls` | [#147](https://github.com/barryrwilson/Rimward/issues/147) / [#157](https://github.com/barryrwilson/Rimward/pull/157) | `src/game/prize.js`, `PRIZE` / `PRIZE_CLAIM` in `state.js`; `npm run test:prize` inside `test:boot`. A named quarry is never a prize; a prize sale does not feed the market. |
| An NPC pirate scoops the pods it took and sells the haul at the local station fence | [#151](https://github.com/barryrwilson/Rimward/issues/151) / [#156](https://github.com/barryrwilson/Rimward/pull/156) | `src/game/pirate-haul.js`, `PIRATE_HAUL` in `state.js`; `npm run test:pirate-haul` (38 pins) inside `test:boot`. Receipts `npcPodCollected` / `npcFenced` stay off the agent ring. |
| An unclaimed yielded hull is a derelict that anyone can claim and that folds away after 30 minutes | [#148](https://github.com/barryrwilson/Rimward/issues/148) / [#155](https://github.com/barryrwilson/Rimward/pull/155) | `src/game/derelict.js`, `DERELICT` in `state.js`; `npm run test:derelict` (45 pins) inside `test:boot`; live check 2026-09-12. |
| The wave-142 war scenario in `npm run test:boot` is deterministic | [#153](https://github.com/barryrwilson/Rimward/issues/153) / [#154](https://github.com/barryrwilson/Rimward/pull/154) | Harness-only: `pickWarQuarry` reads the war dest bank first; the fixture parks at the head of the dest bank. No player-facing change. |
| A mined-out asteroid breaks up, leaves the field, and a rock of another ore reseeds its slot after 3–5 minutes of world time | [#149](https://github.com/barryrwilson/Rimward/issues/149) / [#152](https://github.com/barryrwilson/Rimward/pull/152) | `ASTEROID_RESPAWN` in `state.js`, `world.fieldRespawn`; pinned in `test:boot` (section "Issue #149"); live check 2026-09-12. |
| A trader that yields its cargo runs for a refuge instead of parking dead-stick | [#146](https://github.com/barryrwilson/Rimward/issues/146) / [#150](https://github.com/barryrwilson/Rimward/pull/150) | `capitulate` in `npc.js` routes every crew-aboard yield through the #68 escape plan; pinned in `test:boot` (section "Issue #146"); live check 2026-09-12. |
| Built hulls trail a velocity-driven drive plume in the faction's glow colour | [#145](https://github.com/barryrwilson/Rimward/pull/145) | `src/systems/thruster-fx.js`; pinned in `test:boot`. Organic hulls keep their bioluminescent surge. |
| The Assembly fleet is redesigned: survey head, can spine, report dish | [#144](https://github.com/barryrwilson/Rimward/pull/144) | Wave-16 ship art; approved studies under `reviews/`. |
| Station loiterers keep clear of the +X docking lane (the intermittent fresh-Greenhand `approachDock` collision) | [#139](https://github.com/barryrwilson/Rimward/issues/139) / [#142](https://github.com/barryrwilson/Rimward/pull/142) | [Reproduction and evidence](Issue139DockCorridorEvidence.md); `npm run test:dock-corridor`; ten consecutive local bridge smoke runs docked. |
| `test:refusal-tokens` pins the #120 burner contract and runs in the release-focused runner | [#138](https://github.com/barryrwilson/Rimward/issues/138) / [#141](https://github.com/barryrwilson/Rimward/pull/141) | Test and docs only; [#118 evidence](Issue118RefusalTokensEvidence.md) notes the pin follows #120. |
| Death inside an encounter returns to the last berth with a rewind and hold receipt; patrol standing law is local | [#125](https://github.com/barryrwilson/Rimward/issues/125) / [#137](https://github.com/barryrwilson/Rimward/pull/137) | [Evidence](Issue125DeathRecoveryEvidence.md); `npm run test:death-recovery`. |
| The fence's marker banks on a paying pirate outcome, not only a bounty claim | [#124](https://github.com/barryrwilson/Rimward/issues/124) / [#136](https://github.com/barryrwilson/Rimward/pull/136) | [Evidence](Issue124FenceMarkerEvidence.md); `npm run test:fence-marker`. |
| At most two NPC pirates work traders at once; a prize the player engages is yielded | [#123](https://github.com/barryrwilson/Rimward/issues/123) / [#135](https://github.com/barryrwilson/Rimward/pull/135) | `PIRACY` tuning in `state.js`; `npm run test:shared-lane` (21 checks). Fear-rating suppression of rival interest parked. |
| A deliberate hail demands terms from a willing hull | [#122](https://github.com/barryrwilson/Rimward/issues/122) / [#134](https://github.com/barryrwilson/Rimward/pull/134) | [Design](Hail03PlayerTermsDesign.md); [evidence](Issue122PlayerTermsEvidence.md). |
| `frameAgeMs` / `flags.suspended`; a wall expiry during a stall reads `suspended` | [#121](https://github.com/barryrwilson/Rimward/issues/121) / [#133](https://github.com/barryrwilson/Rimward/pull/133) | [Evidence](Issue121SuspendedClockEvidence.md). |
| A `retreat` or `break-off` intent may hold the afterburner (`burner: true`) | [#120](https://github.com/barryrwilson/Rimward/issues/120) / [#132](https://github.com/barryrwilson/Rimward/pull/132) | [Evidence](Issue120RetreatBurnerEvidence.md). Left the #118 burner pin stale → [#138](https://github.com/barryrwilson/Rimward/issues/138). |
| NPC miner `mineHit` receipts stay off the agent ring | [#119](https://github.com/barryrwilson/Rimward/issues/119) / [#128](https://github.com/barryrwilson/Rimward/pull/128) | [Evidence](Issue119MinerReceiptsEvidence.md). |
| `setCombatIntent` target refusals split (`no-sample`, `stale-lock`, `lock-kind`) with receipt `detail` | [#118](https://github.com/barryrwilson/Rimward/issues/118) / [#129](https://github.com/barryrwilson/Rimward/pull/129) | [Evidence](Issue118RefusalTokensEvidence.md). Suite was red on master until [#138](https://github.com/barryrwilson/Rimward/issues/138). |
| `playerHit` / `playerDestroyed` name the attacker under the bracket identity law | [#117](https://github.com/barryrwilson/Rimward/issues/117) / [#130](https://github.com/barryrwilson/Rimward/pull/130) | [Evidence](Issue117AttackerIdentityEvidence.md). |
| Prize-ranking fields on nearby rows; station and gate bearings | [#116](https://github.com/barryrwilson/Rimward/issues/116) / [#131](https://github.com/barryrwilson/Rimward/pull/131) | [Evidence](Issue116NearbyRowsEvidence.md). |
| Scoop receipts are keep-class; refused pods report `podBlocked` | [#115](https://github.com/barryrwilson/Rimward/issues/115) / [#126](https://github.com/barryrwilson/Rimward/pull/126) | [Evidence](Issue115PodReceiptsEvidence.md). |
| A combat intent clears the full-stop latch and names it when it holds | [#114](https://github.com/barryrwilson/Rimward/issues/114) / [#127](https://github.com/barryrwilson/Rimward/pull/127) | [Evidence](Issue114CombatFullStopEvidence.md). |
| Persistent raw-control throttle and the verified stop sequence are documented and observable | [#103](https://github.com/barryrwilson/Rimward/issues/103) / [#112](https://github.com/barryrwilson/Rimward/pull/112) | [Evidence](Issue103ThrottleEvidence.md). |
| Solar hazards and damage are visible to agents | [#102](https://github.com/barryrwilson/Rimward/issues/102) / [#111](https://github.com/barryrwilson/Rimward/pull/111) | [Evidence](Issue102SolarHazardsEvidence.md). |
| Completed station encounters no longer starve traffic | [#101](https://github.com/barryrwilson/Rimward/issues/101) / [#110](https://github.com/barryrwilson/Rimward/pull/110) | [Evidence](Issue101TrafficRetirementEvidence.md). |
| Hail cards stay off docked station menus | [#100](https://github.com/barryrwilson/Rimward/issues/100) / [#106](https://github.com/barryrwilson/Rimward/pull/106) | [Evidence](Issue100DockedHailsEvidence.md); [API contract](AgentApiDesign.md#issue-100--docked-hails). Bundle bytes ride the #100/#107 approved exception. |
| A surrendered hull can hand over its holds (`demandCargo`) | [#98](https://github.com/barryrwilson/Rimward/issues/98) / [#109](https://github.com/barryrwilson/Rimward/pull/109) | [Evidence](Issue98SurrenderCargoEvidence.md). |
| Surrender is attributed to the last effective damage; a world-caused break pays nothing | [#99](https://github.com/barryrwilson/Rimward/issues/99) / [#108](https://github.com/barryrwilson/Rimward/pull/108) | [Evidence](Issue99SurrenderAttributionEvidence.md). |
| Bundle byte caps doubled by owner request | [#107](https://github.com/barryrwilson/Rimward/pull/107) | [#100 measured decision](releases/issue-100-measured-decision.md); [performance contract](ProductionPerformanceBudget.md). |
| Freighter quantity, Buy Max and selected-commodity Sell All through ordinary bounded orders | [#56](https://github.com/barryrwilson/Rimward/issues/56) / [#96](https://github.com/barryrwilson/Rimward/pull/96) | [Bulk evidence](Issue56BulkTradingEvidence.md); [measured decisions](releases/issue-56-measured-decision.md). PR #96 records final independent QA on `7cb7e7951afe670b2b14fc6701f6e6f667706fb2`. |
| Fresh-start heading away from the sun, preserving saved headings and Drifter pose | [#95](https://github.com/barryrwilson/Rimward/pull/95) | [Starter evidence](StarterSunDriftEvidence.md). Final policy QA on `6f32b2e8b51d5037f5ea857c24847786361679c1` is recorded in the PR. |
| Reassess starter pacing and retain the existing protection | [#10](https://github.com/barryrwilson/Rimward/issues/10) / [#94](https://github.com/barryrwilson/Rimward/pull/94) | [Pacing evidence](Issue10StarterPacingEvidence.md). No additional safe bubble was justified by the samples. |
| Remove duplicate trade/survey offers while preserving distinct contracts and passenger parties | [#12](https://github.com/barryrwilson/Rimward/issues/12) / [#93](https://github.com/barryrwilson/Rimward/pull/93) | [Mission census](Issue12MissionDuplicateCensus.md) |
| Clear held fire when UI or pause owns input | [#11](https://github.com/barryrwilson/Rimward/issues/11) / [#92](https://github.com/barryrwilson/Rimward/pull/92) | [Fire ownership evidence](Issue11FireHeldEvidence.md) |
| Finite station stock and saved-time replenishment | [#55](https://github.com/barryrwilson/Rimward/issues/55) / [#91](https://github.com/barryrwilson/Rimward/pull/91) | [Liquidity design](MarketLiquidityProgressionDesign.md); [measured playtest](playtests/2026-09-09-issue-55-market-liquidity.md) |
| Reactive defense within the bounded combat lease | [#62](https://github.com/barryrwilson/Rimward/issues/62) / [#90](https://github.com/barryrwilson/Rimward/pull/90) | [Defense design](AgentReactiveDefenseDesign.md); [verification](playtests/2026-09-09-issue-62-reactive-defense.md). Final policy QA on `8f24357ff388d2d66756413b56746c1096341903` is recorded in the PR. |
| Sustain target-specific dogfighting between agent decisions | [#61](https://github.com/barryrwilson/Rimward/issues/61) / [#89](https://github.com/barryrwilson/Rimward/pull/89) | [Combat contract](AgentCombatIntentDesign.md); [playtest](playtests/2026-09-09-agent-combat-results.md) |
| Discoverable salvage guidance, accepted recovery markers and guarded recovery lifecycle | [#74](https://github.com/barryrwilson/Rimward/issues/74) / [#88](https://github.com/barryrwilson/Rimward/pull/88) | [Salvage contract](SalvageOnboardingDesign.md). Natural incidental cargo collection is distinct from a naturally offered recovery job. |
| Explain capacity-free passenger commitments, locked fares and independent parties | [#73](https://github.com/barryrwilson/Rimward/issues/73) / [#87](https://github.com/barryrwilson/Rimward/pull/87) | [Passenger policy](PassengerCommitmentPolicyDesign.md) |
| Persistent NPC flight to a real gate or station refuge | [#68](https://github.com/barryrwilson/Rimward/issues/68) / [#86](https://github.com/barryrwilson/Rimward/pull/86) | PR evidence distinguishes real gate departure from external station shelter. |
| Capitulation status and actionable hail feedback agree | [#67](https://github.com/barryrwilson/Rimward/issues/67) / [#85](https://github.com/barryrwilson/Rimward/pull/85) | Willingness and completed surrender remain distinct. |
| Accepted survey objective navigation through visible marker and public API | [#69](https://github.com/barryrwilson/Rimward/issues/69) / [#84](https://github.com/barryrwilson/Rimward/pull/84) | [API contract](AgentApiDesign.md#issue-69--accepted-survey-navigation) |
| Award First Scare only for player-earned intimidation | [#63](https://github.com/barryrwilson/Rimward/issues/63) / [#83](https://github.com/barryrwilson/Rimward/pull/83) | PR records attribution, persistence and live verification. |
| Shared outward, collision-clear station launch | [#65](https://github.com/barryrwilson/Rimward/issues/65) / [#82](https://github.com/barryrwilson/Rimward/pull/82) | Blocked clearance holds the berth with a retry. Extended by [#105](https://github.com/barryrwilson/Rimward/issues/105) ([evidence](Issue105LaunchHoldEvidence.md)): the hold notice and agent receipt name the blocking hull and range; a pirate/ace camping the lane draws a throttled security hail and physical clearance response. Every retry still requires full clearance. #105 passes focused checks, build, unchanged boot and all five live browser checks with a clean console. Independent Codex QA passed `b0e68ddc`; merged in [PR #113](https://github.com/barryrwilson/Rimward/pull/113). |
| Persist completed dock transactions | [#71](https://github.com/barryrwilson/Rimward/issues/71) / [#81](https://github.com/barryrwilson/Rimward/pull/81) | Normal reload/graceful restart evidence does not establish forced-process crash durability. |
| Refuse duplicate ferry acceptance without cargo or agreement mutation | [#70](https://github.com/barryrwilson/Rimward/issues/70) / [#80](https://github.com/barryrwilson/Rimward/pull/80) | Legitimate completed-consignment reacceptance remains. |
| Restore the real player hull after cold asset load | [#54](https://github.com/barryrwilson/Rimward/issues/54) / [#79](https://github.com/barryrwilson/Rimward/pull/79) | Cold-load and stale-completion evidence in the PR. |
| Prevent same-station profitable buy/sell loops | [#53](https://github.com/barryrwilson/Rimward/issues/53) / [#78](https://github.com/barryrwilson/Rimward/pull/78) | Legitimate inter-system trading remains. |
| Separate successful station notices from errors | [#64](https://github.com/barryrwilson/Rimward/issues/64) / [#77](https://github.com/barryrwilson/Rimward/pull/77) | Additive immediate `notice` receipt; failure semantics retain their documented limits. |
| Identify hail speaker/conversation and reject stale responses | [#66](https://github.com/barryrwilson/Rimward/issues/66) / [#76](https://github.com/barryrwilson/Rimward/pull/76) | [API contract](AgentApiDesign.md) |
| Preserve fresh save/dock events under event-ring saturation | [#72](https://github.com/barryrwilson/Rimward/issues/72) / [#75](https://github.com/barryrwilson/Rimward/pull/75) | Bounded retention; no persistence schema change. |
| Agent Play v2 parity and integration repairs | [#57](https://github.com/barryrwilson/Rimward/pull/57) | Versioned public API, bounded control ownership and station parity; bridge remains loopback-only. |
| Reviewed Beautiful Ones production fleet | [#58](https://github.com/barryrwilson/Rimward/pull/58) | Approved studies in `reviews/beautiful-ones/`; player living ship remains the quality benchmark. |
| Models role/scale/lore summary card (RW-003 PR3) | [#28](https://github.com/barryrwilson/Rimward/issues/28) / [#46](https://github.com/barryrwilson/Rimward/pull/46) | [Models design](Mdl01ShipReferenceDesign.md). PR1/PR2 already merged as #25/#27. |
| Pause recovery/input, private ship-material disposal, bridge 413 and missing-token rejection | [#47–#51 via #52](https://github.com/barryrwilson/Rimward/pull/52) | Focused reliability checks and live evidence in the PR. |

Earlier completed work remains closed: RW-001 outer-pad approach and its #31
repair; RW-002 settings/rebinding; RW-004 runtime-error UX; RW-005 zero-cost
recovery policy; RW-006/RW-007 and #20 boot fixtures; OPT-001/OPT-002; and
REL-001 through REL-006. Their issue, PR and historical evidence links are
preserved in the immutable index above. The published
[v0.1.0 artifact](https://github.com/barryrwilson/Rimward/releases/tag/v0.1.0)
is historical and does not include all subsequent changes.

## Remaining candidates and evidence limits

These entries are not filed implementation issues or incomplete acceptance
criteria for already closed work. Reproduce on current code and bound the next
outcome before implementation; preserve the original product intent.

| Candidate | State and next action |
|---|---|
| Intermittent live dock approach collision | **Resolved by [#139](https://github.com/barryrwilson/Rimward/issues/139) / [PR #142](https://github.com/barryrwilson/Rimward/pull/142)**: the collider was a station-anchored loitering NPC hull on a ring whose first waypoint sat on the +X docking axis; loiterers now sweep the far side of the station. Kept here only as the record of the baseline observation ([run 34498199689](https://github.com/barryrwilson/Rimward/actions/runs/34498199689)); no follow-up remains. |
| Smoke/capture reliability | One of ten local #139 bridge smoke runs (2026-09-12) timed out only on the later `systemTransition` jump pin (90 s) with docking and console clean, so the flake is real and unrelated to docking. [Intermediate run 34499466594](https://github.com/barryrwilson/Rimward/actions/runs/34499466594) had no eligible public combat target (`attempted:false`) and a Models `captureScreenshot` timeout with four missing flows. The final run passed; retain these as bounded smoke/capture diagnostic follow-ups, not independently confirmed gameplay bugs. |
| Performance headroom | The enforceable byte caps are now 3,671,906 minified / 1,098,526 gzip bytes: the owner approved doubling the #100 artifact counts by direct request on 2026-09-10, superseding the earlier 1,800,000 / 537,600 limits. Historic measurements are unchanged: #56 measured 1,835,632 minified / 549,169 gzip with a 7,340.4 ms startup median and one of five runs at 8,280 ms against 8,000 ms. The exact descriptor still pins the #100 artifact `assets/index-CY-oCepC.js` at 1,835,953 minified / 549,263 gzip for that exact bundle only. The 8,000 ms startup limit and the browser dependency boundary are unchanged and unwaived. Use the [#56](releases/issue-56-measured-decision.md) and [#100](releases/issue-100-measured-decision.md) measured decisions and the [performance contract](ProductionPerformanceBudget.md) when assessing new evidence. The frame-time instrumentation protocol, measured baseline and Phase 1–4 budgets are now in the same contract (#337). |
| Agent Play mouse ownership | **Implemented for [#163](https://github.com/barryrwilson/Rimward/issues/163)** (owner report 2026-09-06; owner decision 2026-09-13: Escape is the only takeover). `controls.js` no longer drops a lease on pointer motion, clicks, flight keys or fire; an agent-engaged helm (autopilot, dock approach, automine, flee) is marked by the bridge and released only by Escape. Kept here as the record of the observation; the completed table carries the durable evidence. |
| Historical raw afterburner/flee report (local PIR-02) | The old raw command acquired a flee helm. #171 replaces that command with a single burner pulse, so its old flee-timer observations do not describe the new raw path. Tactical combat withdrawal retains its separate bounded authorization. See merged PR #180 and its live evidence before filing any remaining motion or station-contact defect. |
| Supported resumable API playtest runner (local PIR-07) | Local tooling proposal: expected build/API version, isolated profile, durable sequence recovery, acknowledged safe handoffs and sanitized evidence. Existing scenario probes do not by themselves establish the full resumable-runner contract. Scope only if selected; no browser credentials or in-game LLM runner. |
| Models loading/retry/disposal (RW-003 PR4) | Optional, unfiled follow-up retained from the [accepted design](Mdl01ShipReferenceDesign.md). PR3 is merged; its narrow-phone sidebar and side-by-side scale comparison remain separately parked. Inspect current loading and resource ownership before writing a new issue. |
| Historical station/Bloom visuals | [Preservation PR #60](https://github.com/barryrwilson/Rimward/pull/60) is closed **without merge**. Original work is preservation evidence, not current-master implementation. Any selected outcome needs a deliberate port and fresh QA; do not replay old source or backlog wholesale. |
| Other recorded limitations | #95's death-respawn heading half is closed by [#307](https://github.com/barryrwilson/Rimward/issues/307): fresh starts and death rewinds now face the restored hull away from the live sun, and sunward berth releases clear the heat zone; the focused boot test is `scripts/issue-307-respawn-heading-test.mjs`. #95 still parks a recovery-pod boot-fixture hypothesis; #57 parks broad Chrome cleanup in its smoke runner; #96 parks quote-refresh/tiny-hold/live-region observations. See those PRs for precise scope and evidence; none is silently promoted to an implementation task here. |

The preserved local September 6–7 role playtests cover nine attempted careers,
not nine completed acceptance suites. Their filed findings map to #61–#74,
now closed and merged above. PIR-01/03/04/05/06/08/09 map to
#65/#66/#67/#63/#64/#61/#62 respectively; PIR-02 is superseded by #171 in
PR #180; PIR-07 remains the optional runner proposal above. Subsequent focused fixes do not turn the old interrupted attempts into
successful campaigns or justify cross-role balance conclusions. Broader repeat
campaigns and long-term progression remain optional evidence work.

## Not remaining work

- Wishlist outcomes that later waves or the merged records above close.
- NAV-11 route persistence: the earlier reported loss was stale versus code.
- An in-repository LLM runner, browser-bundled credentials, teleport-to-pad,
  a third helm, incidental gauges/keys/SKUs/save fields/kit mutation, or
  owner-omitted content.
- General refactoring or tooling with no selected player/reliability outcome.
- Historical OPEN/later/optional prose superseded by CLOSED/DONE/CONSUME.

## Converting a candidate into a task

Use standard GitHub issue handling outside Orca. A selected implementation
issue must name one player-visible or reliability outcome, current evidence,
bounded scope/exclusions, acceptance criteria, required tests and live flows,
dependencies/owner decisions, and likely overlapping files. Create external
issues only with user or task authorization. Orca auto-start applies only to
`orca:ready`; design, decision and optional items need their respective gates.

### Issue #174 — remembered station prices (merged in PR #198)

The branch adds historical SELL quotes captured when viewing a docked market,
a Market toggle naming the best remembered station and age per commodity,
chart hover/selection readouts, save normalization and agent row parity.
[Contract and current verification](Issue174PriceMemory.md). Build, boot and
focused regressions and ten live browser checks pass in the existing evidence.
Merged in [PR #198](https://github.com/barryrwilson/Rimward/pull/198).

### Issue #179 — market pane costs, caps and transient prices (merged in PR #199)

The branch states an offered haul's buy-in and affordability before acceptance,
stops a bulk-trade refusal outliving the condition that caused it, and labels an
event-driven quote as temporary on the row it moved. Owner decision: label the
event, do NOT slow price reversion; no economy tuning constant changed. Issue
item 2 (20-capacity rows showing capacity and refill) was already delivered by
issue #91 and is now locked by regression coverage instead of re-implemented.
[Contract and current verification](Issue179MarketPane.md). Build, boot, the new
focused suite and the affected market/haul regressions pass, and nine live
browser checks pass with zero console errors. Independent Codex QA passed the implementation, including live stock-refusal and timed event-expiry checks; merged in
[PR #199](https://github.com/barryrwilson/Rimward/pull/199). The later #206
retirement removed the legacy haul buy-in line; generated-haul cost disclosure
remains a separate candidate, as described above.

### Issue #218 — supply-sensitive market fills (implemented; pending independent QA)

Sales now retain surplus above the nominal stock target and lower the next sell
quote. Both surplus and depletion recover toward nominal stock at the existing
saved-simulation-time rate. A linear pressure curve raises buy quotes by up to
50% from full to empty, and lowers sell quotes by up to 50% from nominal to twice
nominal stock. Each side stays anchored at its neutral quote to prevent pumping
resale prices by first draining the dock. The same-dock spread remains intact.

Each confirmed order settles at its displayed unit quote; a human bulk intent
keeps that supply quote across its synchronous ordinary-order chunks. Separate
confirmations reprice, while bulk checks for changed external quotes and actual
stock remain active. No new save fields are required. Focused coverage:
`scripts/issue-218-market-pricing-test.mjs`, market liquidity, spread and bulk tests.

## Trader income curve — #220 (decision recorded; balance unvalidated)

The chosen target is a fresh, careful Freehold Greenhand affording the existing
freighter in **45–60 simulation minutes**, followed by larger cargo commitments
and diversified routes as markets saturate. [Decision, current-source evidence,
reproducible arithmetic and measurement contract](Issue220TraderIncomeCurve.md).
This closes the requested decision, not a claim that current tuning reaches it.
The historical 10:42 purchase predates merged #218/#219; it already included
#208 repair scaling. No replacement campaign time has been measured.

Priority: measure current baseline; if it misses the target, tune existing
job distance/return-work pay before considering a shared per-berth cap or further
saturation changes. Hauls already require player-sourced cargo; no second
buy-in, artificial repair burden, hull-price increase or new progression sink
is selected. Generated haul cost disclosure remains a separate UX candidate.
Any runtime balancing needs a bounded follow-up and independent campaign QA;
the selected decision adds no source changes or external issue automatically.
