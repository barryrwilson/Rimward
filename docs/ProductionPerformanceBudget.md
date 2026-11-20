# Production performance budget

REL-006 replaces Vite's generic 500 kB warning with a Rimward-specific release
policy. Rimward is a Three.js game whose first flight needs the renderer, world,
ship builders, GLTF loader, and simulation systems. Removing gameplay or visual
quality to satisfy the framework default is not a release goal.

## Release limits

The production build must satisfy all of these limits:

| Measure | Release limit | Enforcement |
|---|---:|---|
| Total minified JavaScript | 3,671,906 bytes (3,585.85 KiB) | `npm run build` |
| Total gzip JavaScript | 1,098,526 bytes (1,072.78 KiB) | `npm run build` |
| Cold local title-ready startup | 8,000 ms | representative Chrome production probe |
| Browser dependency boundary | Runtime packages only; currently `three` | `npm run build` and `npm run bundle:report` |

The release owner approved these byte caps on 2026-09-10 by direct request, to
double the 1,835,953 minified / 549,263 gzip counts measured for the issue-100
artifact. They supersede the earlier 1,800,000 / 537,600 limits, which are now
historical. The approval covers the enforceable caps only. It does not change
the exact-artifact fingerprint below, whose byte counts, filename, and SHA256
stay as measured, and it waives no startup or browser-boundary requirement.

Gzip is summed per emitted JavaScript chunk because an HTTP server compresses
chunks independently. The minified and gzip limits are totals, so code splitting
cannot make growth disappear. `vite.config.js` raises the framework warning to
the minified limit while its build plugin fails the build on either byte budget
or on a browser-boundary violation.

Title-ready means that a cold navigation to a production build has completed,
`window.__ctx` exists, the document is complete, and the enabled Models,
Settings, and New Game title controls exist. The local target is deliberately a
stable regression measure, not a promise for every player's network or GPU.

## Reproduce the composition report

From a clean lockfile install:

```powershell
npm ci
npm run bundle:report
npm run build
```

`bundle:report` performs an in-memory production build, lists the top 20 modules
by Rollup-rendered bytes, reports minified/gzip totals, and fails if a budget or
browser-boundary check fails. `npm run bundle:report -- --json` emits the same
data as JSON. Generated `dist/` and ad-hoc reports remain untracked.

Baseline on source `4e70a714` (2026-08-29, Node 24.14.1, Vite 6.4.3):

| Production result | Measured |
|---|---:|
| JavaScript chunks | 1 |
| Transformed modules | 135 (134 in the JavaScript chunk) |
| Minified JavaScript | 1,725,883 bytes |
| Gzip JavaScript | 511,192 bytes |
| Vite build wall time | 17.16 s |
| Browser packages | `three` only |

The leading Rollup-rendered module shares were `three.module.js` 29.1%,
`station.js` 7.2%, `galaxy.generated.js` 4.1%, `hud.js` 3.1%, and
`GLTFLoader.js` 3.0%. These percentages use pre-minification rendered module
bytes, so they explain composition but do not claim an exact compressed saving.

## Optional code and the release decision

The Models-only shell is the clearest post-start candidate:

- `modelsbrowser.js`: 46,271 Rollup-rendered bytes;
- `OrbitControls.js`: 31,991 bytes;
- `model-catalog.js`: 8,828 bytes.

The large Three.js core, GLTF loader, ship/station/gate builders, and world data
also reached by the Models catalog are first-flight dependencies and would stay
in the initial graph. Delaying only the roughly 87 KiB pre-minification shell
would require replacing the synchronous `ctx.models` initialization contract
with an asynchronous facade plus honest loading, retry, failure, focus, and
pause states. That risk and complexity are not justified for REL-006 while
the measured build is below both budgets. No lazy loading or initialization
reordering is introduced by REL-006. This is post-v0.1.0 work. It does not
change the published v0.1.0 artifact.

The production module census contains only the declared runtime package
`three`. Vite, GLTF Transform, Sharp, the KTX2 encoder, Meshoptimizer tooling,
PowerShell/Python asset scripts, the loopback agent bridge, credentials, and LLM
code are absent from the browser bundle.

## Startup measurement protocol

Serve a fresh production build at the origin root, use a blank Chrome profile
with cache disabled, and record five cold navigations. For each navigation,
sample `performance.now()` when the title-ready conditions above first become
true; report the median, the slowest run, Chrome version, machine/runner, and
console exception/error count. Do not compare a Vite development server with
this budget.

The REL-006 verification run used Chrome 151.0.7922.170 on the local Windows
workstation with a fresh temporary profile, cache disabled for every navigation,
and SwiftShader-compatible WebGL settings. Five production starts reached the
title in 6,601.3, 4,804.6, 4,105.6, 4,187.0, and 4,181.7 ms. The median was
4,187.0 ms and the slowest was 6,601.3 ms, both below the 8,000 ms release limit.
All five runs had zero console errors or uncaught exceptions.

If a future build exceeds a byte or startup limit, reduce it or add a measured,
owner-approved release exception to the release notes. Do not raise a number
without an explicit, recorded owner approval such as the 2026-09-10 one above.

An exact-artifact byte exception, when explicitly approved, is recorded in
`scripts/bundle-policy.mjs` with the owner's approval reference and release-note
path. It must match every emitted JavaScript chunk's filename, SHA256, exact
minified/gzip byte counts, and the exact aggregate counts. Both production build
and composition report use that same decision. Any changed, added, or removed
JavaScript chunk returns to the fixed global budgets; the exception is not an
allowance for later growth. Reports retain the raw global-budget pass/fail flags.
Browser dependency checks and startup requirements are never waived by this
byte exception. The descriptor is currently active for the issue-100 artifact;
when no artifact is approved it is `null` (inactive).

`releaseNotes` and `approvalReference` are reviewed repository metadata, not
authorization mechanisms. The matcher checks that these strings are nonempty;
it does not verify that the release-note path exists, inspect its contents, or
authenticate the owner's approval. Independent review and the authorized release
owner must verify the actual approval record and release note before activation.

## Frame-time budget — system scale/population Phase 0 (issue #337)

Issue #337 added the measurement gate for the system-scale/population phases
(#338–#341): a dev-only `?perf=1` overlay plus an unattended production-build
probe. It ships no gameplay, visual, tuning, save, HUD-key or aim-glass change.
The overlay is absent by default and creates no DOM when off.

### Instrumentation and reproduce

- `?perf=1` (combine with `&agent=1` for the probe) creates `#perf-overlay`
  and `window.__ctx.perf.snapshot()`. F3 hides/shows the overlay;
  `setVisible(bool)` is the programmatic form. The snapshot reports frame
  p50/p95/p99, `renderer.info` draw calls/triangles/points/lines/geometries/
  textures, live NPC counts by tier (near ≤ `U.INSTANTIATE_RANGE`, mid ≤ 2500 u,
  far beyond), abstract records for the current and generated banks, asteroid
  matrix writes per frame, CPU per subsystem, and renderer/JS memory.
- Session-only: no persisted field, no player keybinding, no aim-glass digit.
- Reproduce the baseline from a clean worktree:
  1. `npm run build` (the probe serves the production bundle with `vite preview`).
  2. `npm run test:perf-live` (isolated loopback Vite preview + headless Chrome,
     fresh profile, fixed route, 60 s sampling, cleanup, machine/build metadata).
  3. Evidence lands in `out/issue-337-live/perf-baseline/` (`result.json` and
     `evidence.json`, untracked). The probe fails on console errors, exceptions,
     cleanup failure, or a source change during the run.

### Measured baseline (2026-11-19, issue #337)

Named machine/build: Windows 10.0.26200 x64 on an Intel Core Ultra 9 285K
(24 threads, 136.77 GB RAM), Node v24.22.1, headless Chrome 157.0.8103.79,
GPU ANGLE NVIDIA GeForce RTX 4090 Direct3D11. The served artifact was the
production `dist/` build (447 files, 39,371,097 bytes; `index.html` 9,900
bytes; `assets/index-CkDBdGGd.js` 2,049,722 bytes) from base commit
`f0d15d2` with runtime source hash
`33a15277e77947a969d759c594ff25a99c09f48449d5d42a33e4b1b2f5af034c`
(stable start=end). Fixed route: fresh Greenhand → undock →
`plotRoute(veridian)` → `engageAutopilot` → queued `approachDock`; docked at
Veridian at 53.0 s wall / simT 94.46. 60 one-second samples over 59.0 s;
phase counts route 16, jump 3, dock 34, docked 7; systems Freehold 17,
Veridian 43. Console errors and exceptions were 0; Vite/Chrome cleanup and
port closure were verified.

| Measure | Phase-0 baseline |
|---|---:|
| Frame p50 | 31.2 ms median (max 31.3) |
| Frame p95 | 31.8 ms median (max 31.9) |
| Frame p99 | 32.0 ms median (max 32.5); worst single frame 107.4 ms |
| Renderer draw calls | 48.5 median / 106 max |
| Renderer triangles | 130,700 median / 198,844 max |
| Points / lines | 7,600 / 384 median; 7,800 / 641 max |
| Geometries / textures | 94 / 39 max |
| Live NPCs | 10 max (near 10, mid 8, far 0) |
| Abstract records | current bank 17 max; generated galaxy 31 max |
| Asteroid matrix writes | 112 median / 191 max per frame |
| CPU per subsystem (median of per-sample averages) | ship 0.46 ms, npc 0.18 ms, autopilot 0.07 ms, perf 0.06 ms, hud 0.06 ms, asteroids 0.06 ms (single 10.0 ms max), controls 0.05 ms, song 0.05 ms, galaxyChart 0.03 ms, agentApi 0.03 ms; 35 subsystems observed |
| Render CPU | 0.7 ms median / 75.6 ms max (startup spike) |
| Memory | geometries 94, textures 39; JS heap 77.3 MB median / 98.5 MB max / 84.3 MB last |

The headless frame cadence is ~31 ms (~32 fps), so p50/p95 here measure the
compositor's pacing, not game CPU. Summed subsystem CPU was ~1.1 ms and render
CPU 0.7 ms at this baseline. Use per-subsystem CPU, draw calls/triangles and
same-harness relative p50/p95 for regression decisions; the brainstorm's
earlier "≤ 20 ms p95" line was a placeholder and is not a headless measurement.

### Budgets for Phases 1–4

| Budget | Phase-0 baseline | Later-phase target |
|---|---|---|
| Frame p50/p95 (same probe, same machine) | 31.2 / 31.8 ms | no regression > 2 ms vs this baseline |
| CPU per subsystem | top ship 0.46 ms; total ~1.1 ms | no subsystem +> 1 ms; total +≤ 1 ms |
| Draw calls | 48.5 median / 106 max | +≤ 25 |
| Triangles | 130,700 median | +≤ 30k |
| Near full-detail NPCs | 10 max | 10–14 |
| Mid proxies | 0 (none yet) | 30–40 instanced, 5–10 Hz |
| Far impostors | 0 (none yet) | 150–300, 1 Hz |
| Abstract records | 17 max current bank | 40–80/system |
| Asteroid matrix writes | 112 median / 191 max | no growth without range-gating |
| Bundle growth | 2,049,722-byte JS | ≤ 50 KB per phase |
| Memory | shared geometry | no per-instance material clones |

No CI frame-time gate is added yet (issue #337 out of scope: baseline first,
enforce later). Each Phase 1–4 PR must attach before/after evidence from
`npm run test:perf-live` on the same named machine/build; a later CI gate can
pin these budgets. A low-end-profile baseline can be recorded separately
without changing this workstation baseline.

## Frame-time budget — system scale/population Phase 1 (issue #338)

Issue #338 ships the Phase 1 scale/population layer: a deterministic deep-field
backdrop, far-traffic impostors and a denser asteroid system. It adds no
persistent field, no save-format change, no HUD key and no aim-glass digit.

### What is added

- `src/systems/deepfield.js` builds 2–4 planet silhouettes, an optional
  companion star, 1–2 ring/megastructure silhouettes, one beacon/lights Points
  layer and 3–6 nebula sprites at 1,800–8,000 u. Measured across all 101
  systems: max 15 draw calls / 2,574 triangles (issue budget ≤20 / ≤30k).
  Rebuilt and disposed on `systemLoaded`; `reducedMotion` freezes rotation.
- `src/systems/far-traffic.js` renders abstract records outside the
  instantiation bubble as ONE 256-capacity instanced proxy layer, refreshed at
  1 Hz with per-instance faction colour; an impostor is hidden while its record
  is live or within the 900 u instantiation range, so the handoff never shows
  a duplicate hull.
- `src/game/asteroid-fields.js` + `src/systems/asteroids.js` raise the
  system-wide asteroid density to 600–800 objects: 2–3 deterministic far fields
  rendered as ONE Points layer (1 draw call, 0 triangles, no matrix writes),
  while the minable instanced belt keeps its 9-ore structure, 160 cap and save
  caps. Instance matrix writes are range-gated at 1,200 u.
- `src/systems/starfield.js` ties the shell scale to system extent (clamped
  0.9–1.15); `src/game/random-scope.js` keeps THREE's UUID-driven
  `Math.random` draws from shifting the harness's seeded content stream.

### Measured after (2026-11-19, same machine/build/harness as the Phase-0 baseline)

The after run used the same probe (`npm run test:perf-live`, production
`dist/`, `?agent=1&perf=1`, 60 one-second samples, fixed Greenhand → Veridian
route), the same named machine and the same headless Chrome/ANGLE RTX 4090
configuration. Evidence is in the untracked
`out/issue-338-live/perf-baseline/`. The same-probe Phase-0 artifact
(`result.json`) recorded draw calls 63 median / 94 max, triangles 158,628
median and asteroid matrix writes 113 median / 191 max; the contract table's
earlier 48.5/106 draw-call line came from a different first run, so deltas below
are against the artifact.

| Measure | Phase-0 artifact | Phase 1 measured | Delta |
|---|---:|---:|---:|
| Frame p50 | 31.3 ms | 32.5 ms | +1.2 ms |
| Frame p95 | 31.8 ms | 33.35 ms | +1.55 ms |
| Frame p99 | 32.1 ms | 33.7 ms | +1.6 ms |
| Draw calls | 63 median / 94 max | 65 median / 109 max | +2 / +15 |
| Triangles | 158,628 median | 147,834 median | −10,794 |
| Points | 7,600 median | 8,254 median | +654 (far belt) |
| Asteroid matrix writes | 113 median / 191 max | 113 median / 163 max | 0 / −28 |
| CPU per subsystem total | 1.13 ms | 1.10 ms | −0.03 ms |
| Asteroids CPU | 0.051 ms | 0.034 ms | −0.017 ms |
| Subsystems observed | 35 | 37 | +2 |
| Console errors / exceptions | 0 / 0 | 0 / 0 | 0 |
| Production JS | 2,049,722 bytes minified / 621,300 gzip | 2,061,710 bytes minified / 625,430 gzip | +11,988 / +4,130 |

All Phase 1 budgets pass: frame p50/p95 regression is under the 2 ms limit,
draw-call growth (+2 median / +15 max) is under +≤25, triangles are below the
Phase-0 median, asteroid matrix writes did not grow (range gating lowers the
max), CPU did not grow, and bundle growth (+11.7 KiB minified) is under the
≤50 KB per-phase budget. The probe verdict was PASS with zero console errors or
exceptions; the route produced 18 Freehold / 42 Veridian samples.

One first-use spike of 715.5 ms appears in the frame max (the new Points/Line
materials compile their shaders on the first jump frame); p50/p95/p99 are
unaffected. A live production visual probe
(`scripts/issue-338-live-visual-probe.mjs`, untracked evidence in
`out/issue-338-live/scale-visual/`) also passed with screenshots at the
station, lane, gate and route end: deep field 12 draw calls / 1,644 triangles
at Freehold, 256-capacity impostors with no duplicate of a live hull, and
481–639 far-belt points per system.

No CI frame-time gate is added yet (same Phase-0 decision: baseline first,
enforce later). The far belt is presentation-only by design (not minable, no
save data); Phase 2 (#339) can reuse the impostor infrastructure, and a
low-end-profile baseline can be recorded separately without changing this
workstation baseline.

## Frame-time budget — system scale/population Phase 2 (issue #339)

Issue #339 ships population tiering: deterministic cast growth to 25–50
abstract records/system, a mid-tier instanced proxy layer, AI tick LOD for
far live hulls, abstract-tick LOD and explicit coupling caps. It adds no
persistent record field, no save-format change, no HUD key and no aim-glass
digit.

### What is added

- Cast growth: content-only `crowd` counts in authored/generated systems, with
  crowd records appended by `world.js` from a per-system/per-role RNG that
  consumes zero global `Math.random` draws (the seeded boot stream and #201
  route fixture stay intact). Banks hold 25–47 records/system (galaxy 3,210 vs
  the 549 baseline); names are unique and deterministic, crowd pirates carry
  bounty 0 (board cap stays 2), and crowd ids use a separate namespace so
  legacy `rec-N` ids do not shift.
- `src/game/traffic-tiers.js` owns the derived tier constants: near ≤900 u,
  mid 900–2,500 u, far >2,500 u; near cap 10, mid cap 40, far cap 256.
- `src/systems/mid-traffic.js` renders the mid band as ONE 40-capacity
  instanced 8-triangle proxy layer at 8 Hz (per-instance faction colour, coarse
  heading to the next waypoint, `reducedMotion` parity), hides live/terminal
  and out-of-band records, re-hides promoted records every frame, and
  rebuilds/disposes on `systemLoaded`. Presentation-only: no AI, collision,
  combat, FX or persistent field.
- `src/systems/far-traffic.js` keeps the Phase 1 256-capacity impostor layer
  but starts it beyond 2,500 u so the mid and far layers never draw the same
  record.
- `src/systems/npc.js` adds AI tick LOD: near hulls (≤900 u) keep full-frame
  AI/physics/combat; live hulls beyond the bubble step at 8 Hz with a
  session-only accumulator, a dead-reckoned pose, an immediate boundary step,
  per-frame mesh animation and reduced-rate escape; combat, collision and hail
  stay near-only. `MAX_LIVE` remains 10.
- `src/game/world.js` adds abstract tick LOD: current-system bank 1 Hz, other
  visited banks 0.2 Hz with a session-only throttle; migration, transit
  registry, same-system restore and gate-linger paths are untouched.
- `src/systems/perf.js` publishes near/mid/far caps plus mid-proxy and
  far-impostor visible/capacity counters in the `?perf=1` overlay and
  `snapshot()`.
- Coupling caps reviewed and pinned, not raised: pirate bounty board 2, contact
  rows 24 (16 MK1), nearby rows 12, market walk 30 s, hangar 8, single-card
  hail. Ambient crowd traffic stays out of contact lists.

### Measured after (2026-11-20, same machine/build/harness as the Phase-0/1 baselines)

The after run used the same probe (`npm run test:perf-live`, production
`dist/`, `?agent=1&perf=1`, 60 one-second samples, fixed Greenhand → Veridian
route), the same named machine and the same headless Chrome/ANGLE RTX 4090
configuration. Evidence is in the untracked
`out/issue-337-live/perf-baseline/` (same probe path; Phase 2 overwrote the
Phase 1 artifact in this worktree).

| Measure | Phase 1 artifact | Phase 2 measured | Delta |
|---|---:|---:|---:|
| Frame p50 | 32.5 ms | 32.5 ms | 0.0 ms |
| Frame p95 | 33.35 ms | 33.3 ms | −0.05 ms |
| Frame p99 | 33.7 ms | 33.75 ms | +0.05 ms |
| Draw calls | 65 median / 109 max | 58 median / 115 max | −7 / +6 |
| Triangles | 147,834 median | 134,080 median / 214,412 max | −13,754 |
| Points | 8,254 median | 8,239 median | −15 |
| Asteroid matrix writes | 113 median / 163 max | 113 median / 163 max | 0 / 0 |
| CPU per subsystem total | 1.10 ms | ~1.05 ms (top-10 sum; ship 0.447, npc 0.169) | −0.05 ms |
| Subsystems observed | 37 | 38 | +1 |
| Console errors / exceptions | 0 / 0 | 0 / 0 | 0 |
| Production JS | 2,061,710 bytes minified / 625,430 gzip | 2,076,553 bytes minified / 628,119 gzip | +14,843 / +2,689 |

All Phase 2 budgets pass: frame p50/p95 regression is far under the 2 ms limit,
draw-call growth is under +≤25 (median actually fell because far impostors start
beyond 2,500 u), triangles are below the Phase 1 median, asteroid matrix writes
did not grow, CPU did not grow, and bundle growth (+14.8 kB minified / +2.7 kB
gzip) is under the ≤50 KB per-phase budget. The probe verdict was PASS with zero
console errors or exceptions and a stable runtime source hash. Tier observability
was live: live hulls max 10, near max 10/10, mid proxies max 4/40, far impostors
max 0/256, current bank max 47 records, galaxy bank total 89; the fixed route
produced 18 Freehold / 42 Veridian samples. The 60-second window ended on the
Veridian corridor approach (73 u) at simT 99.7 rather than docked, because the
heavier crowd traffic lengthened the dock leg past the probe window; the 600 s
sustained-flight probe on the same artifact completed all eight dockings, so the
dock lane is exercised rather than bypassed.

### Save-size delta (measured and accepted)

The coupling audit measured the persisted record-bank JSON with the real save
path: 289,322 bytes / 549 records before Phase 2, and 1,694,277 bytes / 3,210
records after (+1,404,955 bytes, +485.6%). The legacy 549-record subset is
byte-identical (crowd ids do not shift `rec-N`), and only visited systems
persist: a visited bank is 25–47 records / ~12–24 KB. This is accepted because
the abstract records are the population data the phase exists to add, no save
format or schema changed, and a normal playthrough visits a handful of systems
(2 visited banks / 89 records in the fixed probe route). A bank-compaction pass
is parked for a later phase if a full-galaxy save becomes a concern.

No CI frame-time gate is added yet (same Phase-0 decision: baseline first,
enforce later). Phase 3 (#340, extent + in-system chart) should reuse these
derived tiers and attach the same before/after probe evidence.

