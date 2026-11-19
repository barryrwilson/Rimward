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
