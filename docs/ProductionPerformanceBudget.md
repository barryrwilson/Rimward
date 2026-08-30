# Production performance budget

REL-006 replaces Vite's generic 500 kB warning with a Rimward-specific release
policy. Rimward is a Three.js game whose first flight needs the renderer, world,
ship builders, GLTF loader, and simulation systems. Removing gameplay or visual
quality to satisfy the framework default is not a release goal.

## Release limits

The production build must satisfy all of these limits:

| Measure | Release limit | Enforcement |
|---|---:|---|
| Total minified JavaScript | 1,800,000 bytes (1,757.81 KiB) | `npm run build` |
| Total gzip JavaScript | 537,600 bytes (525 KiB) | `npm run build` |
| Cold local title-ready startup | 8,000 ms | representative Chrome production probe |
| Browser dependency boundary | Runtime packages only; currently `three` | `npm run build` and `npm run bundle:report` |

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
owner-approved release exception to the release notes. Do not merely raise the
number.
