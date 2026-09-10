# Issue #100 — Docked hails stay off the station desk

[Issue #100](https://github.com/barryrwilson/Rimward/issues/100).

**Status: implementation and verification COMPLETE, AWAITING MERGE.** The runtime
change is implemented. The focused, boot, hail-identity and agent-hardening
suites pass locally, and the live browser probe passes **7/7 pins on 2026-09-10**
with a clean console. Independent behaviour and source QA at `1f9035c2` returned
**PASS** (`out/issue-100/qa-review.md`). The raw byte limits are still exceeded,
but `npm run build` and `npm run bundle:report -- --json` pass through the exact
approved exception for this artifact only. Independent QA of that activation
returned **PASS** at `17edf7ebabccb023b6df255eda47e5bf39176d93`
(`out/issue-100/qa-activation-review.md`).
[PR #106](https://github.com/barryrwilson/Rimward/pull/106) carries the final
review and the current CI record. Nothing here claims a merged, released or
deployed state, and no overall release or startup approval is claimed.

## Outcome

While `ctx.flags.docked` is true the berth owns the screen. No hail is drawn
over the station panel, none survives the docking frame, and no path resolves
one:

- An incoming surrender or bargaining hail does not open. `canShowHail`
  refuses outright rather than deferring, so the single defer slot is not held.
- A card that is already up is closed on the docking frame, and the deferred
  slot is emptied, so a swallowed call cannot reappear at launch.
- Every resolution path refuses and moves nothing — no credits, cargo, fear or
  NPC state: the card button, the number key, `ctx.hailApi.resolve` and the
  public `hailResolve`.
- The public `hailResolve` and `observe().availability.hailResolve` both report
  the stable token `docked`, the token `selectTarget` already uses. The token
  does not race the frame's dock close, so a planner never sees `closed` for
  one frame and `docked` for the next.
- A demand keeps its existing close semantics: the `docked` outcome and the
  demand-shaped `hailClosed` the HUD already narrates ("demand broken. You
  docked."). A demand that *arrives* at the desk fail-closes as `docked`, not
  `voided`.

Undocked behaviour is unchanged, including issue #66 conversation identity,
`stale` / `closed` precedence, the button and digit paths, and the miss toast.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/overlay-policy.js` | New `dockedAtBerth(ctx)` session-flag helper. `canShowHail` refuses while docked, `takeDeferredHail` returns null, `hailDigitsAllowed` is false. |
| `src/systems/hail.js` | One card boundary in `openCard`, one resolution boundary in `resolveIntent`, a `docked` answer in `resolve`, `closeForDock()` on the docking frame, an arriving demand fail-closes as `docked`, and the KeyH press is swallowed without a miss toast. |
| `src/systems/agent-api.js` | `hailResolve` refuses with `docked` before the overlay gate, so a docked planner reads the real reason instead of `no-service`. |
| `src/game/agent-observe.js` | `availability.hailResolve` reports `docked`, agreeing with `act()`. |
| `package.json` | Adds `test:docked-hails` and `test:docked-hails-live`. |

No change to NPC hail attribution ([#99](https://github.com/barryrwilson/Rimward/issues/99))
or to the persisted throttle and control-expiry work
([#103](https://github.com/barryrwilson/Rimward/issues/103)).
No new persisted field, event type, key, gauge or schema version; the public
API stays at `VERSION` 2. See the
[public API contract](AgentApiDesign.md#issue-100--docked-hails) and the
[demand lifecycle brief](Hail01DemandLifecycleDesign.md).

## Verification — automated, local

- `npm run test:docked-hails` (`node scripts/issue-100-docked-hails-test.mjs`):
  **PASS, 37 checks**. Covers the refused incoming card, the card closed by
  docking with nothing granted, the transition window across all four
  resolution paths, availability agreeing with `act()`, the dropped deferred
  hail before and after launch, unchanged demand close semantics, the demand
  arriving at the desk, and undocked parity including stale identity, bound
  resolve, button and digit paths.
- `npm run test:boot`: PASS. Not edited or weakened.
- `npm run test:hail-identity`: PASS. Issue #66 identity is intact.
- `npm run test:agent-hardening`: PASS.

Raw output is local and untracked: `out/issue-100/focused-test-restored.log`
and the harness log `out/issue-100/claude-finish.log`.

## Build and bundle — PASS under the exact approved exception

The ordinary `npm run build` and `npm run bundle:report -- --json` now exit 0.
The raw numeric limits are still exceeded: `minifiedPass` is `false` and
`gzipPass` is `false`. `bytePolicy.pass` is true only through the owner-approved
exact byte exception for this artifact.

| Field | Measured |
|---|---|
| JavaScript chunk | `assets/index-CY-oCepC.js` |
| Chunk SHA256 | `31e00966d7d17708ab99d0f81a31488bd3e45c4e0a998f062c09e9433ea36eb1` |
| Minified bytes | 1,835,953 (limit 1,800,000; +321 versus the previous exact exception) |
| Gzip bytes | 549,263 (limit 537,600; +94 versus the previous exact exception) |

On 2026-09-10 the owner approved an exact byte exception for this artifact only.
`APPROVED_BYTE_EXCEPTION` in `scripts/bundle-policy.mjs` now names this chunk,
its SHA256 and its exact aggregate and per-chunk bytes. The global
1,800,000 / 537,600 limits, the exact matcher, the browser dependency audit and
every other export are unchanged, and there is no future-growth allowance or
environment bypass. The approval covers only the exact new bundle; it grants no
startup exception, measurement, merge or deployment. See the
[performance contract](ProductionPerformanceBudget.md) and the
[issue-100 measured decision](releases/issue-100-measured-decision.md); the
[issue-56 record](releases/issue-56-measured-decision.md) stands as history.

The emitted `dist/assets/index-CY-oCepC.js` was measured directly after
activation and matches the approval exactly by SHA256, raw bytes and gzip bytes.
Logs: `out/issue-100/approved-build.log`,
`out/issue-100/approved-bundle-report.log`,
`out/issue-100/approved-bundle-report.json`. The earlier failing run is
preserved raw at `out/issue-100/build.log`, `out/issue-100/bundle-report.log`
and `out/issue-100/bundle-measurement-restored.json`.

The browser dependency boundary check passes: the bundle's only dependency is
Three.js, and no forbidden module is present.

## Verification — live browser, PASS

`npm run test:docked-hails-live` (`scripts/issue-100-live-probe.mjs`):
**PASS on 2026-09-10, 7/7 pins, 0 console errors, 0 uncaught exceptions.**
Headless Chrome over CDP, platform GPU (ANGLE / Intel UHD, D3D11).

| Pin | Result | Read from the live page |
|---|---|---|
| D1 ordinary docking | PASS | The real station panel is up, `berthOpen` false, no card. |
| D2 incoming surrender | PASS | No card painted at the desk; credits, fear, cargo and NPC state all unmoved. |
| D3 card closes on dock | PASS | A surrender open in flight is gone after docking, with nothing granted. |
| D4 attempts after real docking | PASS | The card had already closed (`stillUp: false`, `dockedNow: true`). A click on the retained button (`clicked: true`), a digit key, `ctx.hailApi.resolve` and public `hailResolve` all have no hail effect; nothing moves. |
| D5 stable `docked` token | PASS | `hailResolve`, bound `hailResolve`, `selectTarget` and `availability` all answer `docked`. |
| D6 deferred hail dropped | PASS | A hail deferred behind the chart is discarded on docking and never returns at launch. |
| D7 undocked unchanged | PASS | The same hull is heard again; a bound resolve pays the printed 120 UU demand. |

What live D4 does and does not prove. The final `probes.json` records
`stillUp: false`, `clicked: true`, `dockedNow: true`: by the first instant the
berth held the ship the card had already closed, so the battery fired against a
retained button and a live digit handler. Live D4 therefore proves that button
and digit attempts *after* a real docking, plus the direct `ctx.hailApi.resolve`
and public `hailResolve` paths, produce no hail effect and move nothing, and
that the two API paths answer `docked`. The human handlers simply ignore the
input — only the direct and public APIs return a `docked` token, so no token is
asserted for the click or the key. The true pre-update, still-visible transition
race — a card painted on screen at the moment the berth takes the ship — is
proven by the focused regression suite above, not by this live sample.

Docking and launching go through the real station panel; the probe never
writes `ctx.flags.docked`. Screenshots: `out/issue-100/live/`
(`02-d2-incoming-refused.png` shows the station desk alone under an emitted
surrender; `03-d3-card-in-flight.png` shows the real four-intent hail card in
flight; `04-d4-transition-refused.png` shows the digit key driving the station
menu instead of the card, with credits unchanged). Ledger and console:
`out/issue-100/live/probes.json`, `console.txt`, `run.log`.

Two limitations belong on the record:

- **Dev-server workaround.** The probe starts Vite through `createServer` with
  `server: { watch: null }` and `optimizeDeps: { noDiscovery: true,
  include: [] }`. On this workspace the cold dependency scan holds
  `/src/main.js` and `/src/core/ctx.js` open, and the chokidar watcher startup
  separately consumes about 1.2 GB and 80 CPU seconds and starves the server
  (independent CPU profile: `out/issue-100/quinn-vite-profile.json`). The
  dependency scan is not the sole cause. This is a harness-only override for a
  one-shot run that needs no HMR. `vite.config.js`, the production build and
  the bundle budget are unchanged.
- **Rare-fixture staging.** A surrender or demand card cannot be waited for in
  a live session, so a labelled fixture (`privilegedFixture`) spawns the hull,
  parks ambient traffic, pins the player hull and emits the ordinary
  `hailOpened` the game itself emits. The fixture stages only the rare hail. It
  never sets `ctx.flags.docked`, and every assertion reads the rendered DOM or
  the public `window.rimward` handle.

## Independent QA — behaviour and source, PASS

`out/issue-100/qa-review.md` records an independent review at
`1f9035c255afa9ddd0d4dd4dd17d1a4c92bb51a2`: **behaviour verdict PASS**, with
focused (37 checks), hail-identity, agent-hardening, capitulation-feedback and
boot suites rerun independently, plus 12 added boundary assertions. That review
also recorded the then-current build FAIL as the blocking release finding, and
it is not approval of the byte exception now activated.

## Independent QA — byte-exception activation, PASS

`out/issue-100/qa-activation-review.md` records a second independent review
(Quinn / Codex) at `17edf7ebabccb023b6df255eda47e5bf39176d93`: **PASS for the
issue behaviour and the authorized exact-byte build gate**. Ordinary
`npm run build` and `npm run bundle:report -- --json` both exit 0
(`qa-activation-build.log`, `qa-activation-report.log`). The emitted
`dist/assets/index-CY-oCepC.js` measures 1,835,953 raw / 549,263 gzip bytes with
SHA256 `31e00966…3ea36eb1`, exactly the approved artifact. The fixed
1,800,000 / 537,600 limits stand, `minifiedPass` and `gzipPass` remain `false`,
and `bytePolicy.pass` is true solely through the exact exception. Nine negative
matching cases — changed hash, changed filename, aggregate raw and gzip totals,
individual raw and gzip bytes, extra chunk, missing chunk and duplicate chunk —
each reject the exception and stay failed, and the browser boundary checks pass.
Runtime source, tests, probes, package files and `vite.config.js` are unchanged
from `1f9035c2`, and the policy file is byte-identical outside the descriptor,
so the existing focused (37 checks), boot, hail-identity, agent-hardening and
7/7 live PASS evidence carries forward with no gameplay retest.

The review is not an overall release, startup, merge or deployment approval. The
earlier remote TGT-07 failure on run 34513272635 remains failed historical
evidence, diagnosed in `out/issue-100/qa-ci-diagnosis.md` as a preexisting
fixture timing race; it is distinct from the latest checks on
[PR #106](https://github.com/barryrwilson/Rimward/pull/106) and no claim is made
that all remote CI passed.

## Remaining before done

Live acceptance passes, so criterion 4 of the `AGENTS.md` definition of done is
met. Criterion 2 passes through the exact approved byte exception, with the raw
limits still exceeded as recorded above. Runtime source, tests and the probe are
unchanged from the QA-approved state at `1f9035c2`, so no gameplay, boot or live
rerun was needed for the activation, and the activation itself is independently
QA-passed at `17edf7eb`. Implementation and verification are complete; the work
is **awaiting merge**. [PR #106](https://github.com/barryrwilson/Rimward/pull/106)
owns the final review handoff and the current CI record. No merge, release or
deployment is claimed.
