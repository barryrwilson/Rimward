# Issue 56 — bulk trading verification

Freighter-scale bulk trading is implemented and verified locally on
`codex/issue-56-complete`, source/probe commit
`d0b032e9dc0d664b1e9c733ed4a3ea1db3bd2dad`, based on master
`fb93a7c87f28fe37b4e73238b460cbf9ffa1cc07`. Focused tests, full boot and all
57 final live checks pass. Independent source, CSS/probe and evidence review pass. The
normal production build fails its unchanged byte policy, and one of five final
startup measurements exceeds 8,000 ms. Separate owner decisions on the exact
byte artifact and measured startup overrun remain required. No exception is
activated and no publication, merge or deployment is claimed.

The owner approved the [bulk design](Trade004BulkTradingDesign.md) originally
committed as `d8339c821f723c5d48c5b5149a676bfc0b8c6134`. Quantity entry, Buy Max
and selected-commodity Sell All prepare explicit confirmations with displayed
unit prices and totals. The executor submits ordinary orders of at most 99 units,
stops before accepting a changed quote, and reports actual completed quantities
and money. Existing small-lot controls and the public single-order ceiling remain.

## Exact artifact and fixes

The prior feature was replayed cleanly onto current master in a new worktree;
the original worktree, pending documents and probe were preserved. The accepted
1,024-order defensive execution bound is committed in the design. Final source
consists of the integrated bulk implementation, the native-activation fix
`0d59a5e19b2d47b0aa126ac22c00b8f71abcdb0f`, and the CSS-only readability fix
`d34f2cc22bb2c34893467401b49660133ec093c2`. Commit `d0b032e9` adds the final probe.

Live testing found and fixed two concrete problems:

- A periodic panel rebuild could remove a pressed native control before release,
  swallowing the click. Only the periodic refresh now waits while a bulk native
  activation is held; release/cancel/lost capture/click/blur and explicit renders
  clear the hold. Explicit actions and stale-quote validation remain active.
- At native 200% zoom, enabled Sell text and the order-stop note could not scroll
  clear of the existing badge. A composer-only rule adds bottom scroll room at
  viewport heights up to 480 px. The badge and six-column market grid are unchanged.

The final runtime source SHA256 is
`48ed6b5539e33140512c37eff32537a5e94e30015107c686065bb17ddfec8333`;
full production-source census SHA256 is
`88dd101c7d0e31d9f6ffa9310396a438596d94db199a84600f324cbe06d1e08b`.
Candidate-02 contains 447 files / 39,402,057 bytes, manifest SHA256
`43318a9d5d9a846faef259318e049fc421cde07eb2f4fc064f99a77c8cf9e082`.
Its sole generated JavaScript chunk is `assets/index-BX1kNgWb.js`, SHA256
`4134afb68df39ea99131293313b96bd4e43b172782c3dd30c26620ea576e7416`.
The candidate was emitted at `d34f2cc2`; startup ran at `d0b032e9`. The intervening
commit adds only the non-runtime probe, and both production-source hashes match.

## Automated checks

The final JavaScript fix passed `npm run test:bulk-trade` (11 grouped contracts),
`npm run test:fire-held` (256/256), and `npm run test:safe-launch` (11 checks).
`npm run test:boot` passed with `BOOT TEST PASS — no update errors`; it was not
weakened or retried until green. Subsequent CSS and probe commits do not change
Node boot's JavaScript source. Raw logs are under
`C:/Projects/WebSim/out/issue-56-completion-evidence/`:

| Check | Raw log |
| --- | --- |
| Bulk trade, including native hold lifecycle | `bulk-activation-fix-final.log` |
| Fire-held regression | `fire-held-activation-fix.log` |
| Safe launch | `safe-launch-activation-fix.log` |
| Full boot | `boot-activation-fix.log` |

The integrated baseline also passed market liquidity, same-dock spread, agent
schema and agent hardening; retained raw logs are respectively `liquidity.log`,
`spread.log`, `schema.log` and `hardening.log` under
`C:/Projects/WebSim/out/issue-56-evidence/rex/resume/`. Later changes are limited
to native activation deferral, its regression, composer scroll room and the live
probe. `git diff --check` passed for the implementation changes.

The bulk suite drives the real station DOM/captured-action closures and ordinary
trade path. Disclosed fixtures cover 160 as 99+61, cash/room/stock limits, invalid
and excessive quantities, closed access, immutable stale previews, repeated
activation, partial refusal/context loss, the actual fixer trust threshold,
equivalent public-agent economics, read-only observations and oversized imported
holdings. The new hold test checks real listener behavior and node identity across
the refresh, plus release elsewhere, cancel, lost capture, blur, SELECT Escape
without pointerup, Space repeat/release and post-release refresh. The browser
checks separately prove native click synthesis.

## Final live B10/B11 verification

`live-08/results.json` records **57/57 pins PASS**, no readability failures,
zero console errors/exceptions, stable source census and successful owned-process
teardown. The browser scenario restores an unmodified earned save whose 160-unit
freighter and working capital were acquired through ordinary game flows, then
uses Continue and ordinary docking. No credits, cargo, stock, hull or time
fixtures were injected. This report includes no save payload or browser-profile
data.

Actual Chromium mouse/key input and native clipboard paste operate the real
controls. Read-only listeners record trusted input targets and ordinary autosave
notifications. No synthetic DOM click or hidden confirmation retry is used.

| Round trip | Activations | Buy | Sell | Cash before / after | Fills per side |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop held-pointer preset, keyboard confirmation | 4 | 160 x 135 = 21,600 UU | 160 x 134 = 21,440 UU | 24,339 / 24,179 | 99+61 |
| Pointer at 560 px panel | 6 | 160 x 136 = 21,760 UU | 160 x 136 = 21,760 UU | 24,179 / 24,179 | 99+61 |
| Pointer at native 200% zoom | 6 | 160 x 135 = 21,600 UU | 160 x 134 = 21,440 UU | 24,339 / 24,179 | 99+61 |

The two six-activation checks deliberately include two additional diagnostic
presets for screenshots/readability, then fresh visible presets before actual
confirmation. They are not presented as four-action flows. Each transaction
matches its own fresh displayed quote, receipt and autosave deltas. Real prices
moved between some legs; contemporaneous sell<=buy checks passed at both
snapshots. All round trips ended empty with stock 160. The fixed 100/90 UU
four-activation example is covered by the separate focused fixture.

The single held Buy Max press lasted **1,623 ms / 1.1374 simulation seconds**,
crossed the periodic refresh, retained the original node through mouseup and
produced exactly one trusted click. The hold and preset changed neither cash nor
cargo; a separate confirmation executed the purchase. Slowly typed 160, native
paste, selection/cursor, Tab/Shift+Tab, arrows, Enter, Space and Escape survived
refresh and retained native ownership. Input-owned digits and B/Q/W/A/S caused no
seed action, navigation, launch, fire or accidental trade; invalid/excessive
values remained visible and unavailable. Repeated Enter did not confirm twice.

Verified layouts were native 1280x720, a 560x720 viewport producing the exact
560 px minimum panel, and actual native 200% browser zoom (CSS 640x360, DPR2,
visualViewport.scale1). Full preview fragments, enabled confirmation labels,
receipt text and input labels/values were checked with text-range geometry and
hit testing at actual native scroll positions, then visually inspected. All are
reachable without moving/hiding the badge. At 200%, the full Sell label reaches
y42.7-59.2 and the order-stop note y35.1-71.9, clear of the badge beginning at y140.

The committed [live probe](../scripts/issue-56-bulk-trade-live-probe.mjs) SHA256 is
`92a6cba84a099a65b5b9f8129bd24d3aae147edefc119ed19aeac05f0d907271`.
Raw results, screenshots and `FIONA-LIVE-VERDICT.md` are retained under
`C:/Projects/WebSim/out/issue-56-completion-evidence/`. Both temporary browser
profiles were removed, browser ports closed, and Vite was confirmed closed.
Screenshots, saves and profiles are excluded from the commit. Failed or partial
runs live-01 through live-07 are preserved; their setup failures, the two real
UI defects, and correct stale-state refusals during lengthy diagnostic scans are
not relabelled as passing final runs.

## Final production measurements and holds

The final JavaScript measures **1,835,632 minified / 549,169 gzip bytes**. Global
limits remain **1,800,000 / 537,600**. The current sun-drift approved descriptor is
**1,825,899 / 545,419**, so growth is **9,733 / 3,750 bytes**. It does not match
this artifact. The normal build remains a byte-policy FAIL.

Candidate-02 loads the actual production configuration and replaces only its
named audit hook to record the unchanged byte failure while emitting an isolated
candidate. Production transforms, minification and chunking are retained; browser
dependency auditing still runs and passes with `three` only and no forbidden
source. Diagnostic emission is not a passing ordinary build.

Final startup-02 measured five serial fresh-profile Chrome navigation-to-title
starts: **7,340.4; 7,596.8; 8,280.0; 6,240.6; and 6,971.5 ms**. Median is
**7,340.4 ms**, maximum **8,280.0 ms**. One exceeds the unchanged **8,000 ms** limit
by **280 ms**; the raw startup gate is **FAIL** and needs a separate owner decision.
The earlier startup-01 PASS belongs to the superseded runtime and cannot approve
this artifact. No rerun was used to replace the failed observation.

Browser cache was disabled and service workers bypassed; the platform GPU was
used. Browser launch time is excluded. Operating-system filesystem cache and
machine-wide CPU load were uncontrolled, so these measurements do not establish
that the fix caused the overrun. Every run recorded zero console/page errors and
zero cached responses, exited its owned Chrome process, closed its CDP port and
removed its temporary profile. The local static server closed. Source, helper
scripts and the complete candidate remained stable throughout measurement.

Raw `build-final-before-approval.log`, `release/candidate-02/result.json`,
`release/candidate-02/artifact-manifest.json`, and
`release/startup-02/result.json` are retained under
`C:/Projects/WebSim/out/issue-56-completion-evidence/`. The
[measured release decision](releases/issue-56-measured-decision.md) proposes the
exact byte exception and separate measured startup exception; neither is active.

## Independent review and remaining work

Independent Claude source/security review passed the integrated Codex-authored
baseline `9d23157` (`QA-SOURCE.md`). Independent Codex review passed the later
Claude-authored activation delta `0d59a5e` and independently reran its 11-group
bulk test (`QA-ACTIVATION-DELTA.md`). Final independent Codex CSS/probe/live and
production-evidence review passed on `d0b032e9` (`QA-LIVE-EVIDENCE.md`). Quinn
independently inspected all 57 pins, critical screenshots, hashes, cleanup and
final measurement method. Feature acceptance passes; release compliance remains
FAIL pending reduction or the applicable owner-approved exceptions.

The owner explicitly authorized scoped issue-56 source/test/report review in
Claude after an automatic approval rejection of external source/report disclosure.
That authority excludes saves/browser profiles and is separate from performance
exception approval. Raw unsuccessful/turn-limited review attempts are retained.
Earlier source authorship is recorded as Codex; no missing original implementation
fallback receipt is inferred. The activation and CSS/probe changes used designated
Claude harnesses, with raw receipts retained in the evidence directory.

After owner approval of both measured exceptions, only the exact byte descriptor
may be activated. Ordinary build/report and all emitted-file equivalence checks
must pass, followed by independent policy review. Global limits and the matcher
remain fixed. Merge/deployment require a separate gate.

Parked minor observations are silent stale-quote display until click, the inherited
capacity-derived single-order sell ceiling for malformed tiny-hold imports, and
possible live-region loss under a future new overlay-clear path. No persistent
field or save migration is introduced. Rollback uses the prior approved application
artifact; ordinary trades saved before a stopped batch remain valid.
