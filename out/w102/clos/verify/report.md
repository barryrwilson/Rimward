# Wave 102 CLOS — independent verify

Status: **CLEAN**

Date: 2026-08-23

Domain: mixed (helper + HUD rail). Browser skipped. **[NO BROWSER COVERAGE]**

## Verdict

WAVE102 CLOS pins are all true. There is no `WAVE102 CLOS FAIL`. Report CLEAN.

WAVE98 / WAVE99 / WAVE100 pins are all true.

WAVE92 BIO-02 pins are all true on this run. There is no `WAVE92 BIO-02 FAIL`.

`npm run test:boot` still exits 1 for `REDMARCH TEST FAIL` (`castMatches:false`). That pin is a known jump-cast flake. It runs long before WAVE102. CLOS did not cause it.

## Commands

1. `node out/w102/clos/probe.mjs` — exit 0. Log: `probe-log.txt`.
2. `npm run test:boot` — no other boot-test was running. Log: `boot-test.log`.

Did not start Vite or Chrome. Did not kill user Chrome.

## Static checks (helper + HUD rail)

| Rule | Result |
|---|---|
| No `innerHTML` in `hud.js` / `los-close.js` | Pass |
| No CLOS child on `.rw-reticle` (80 px hub) | Pass. Hub children stay pupil / cilia / RANGE |
| CLOS sits after DIST on `.rw-combat-target` | Pass (`tgtClosRow` after `tgtDistRow`) |
| Class is `.rw-combat-clos`, not contacts / edge / cue | Pass |
| No persist key | Pass. `WORLD_FIELDS` has no `closure` / `tgtRate` / `closRate` |
| Format `+N` / `-N` / `0 u/s` | Pass (`formatClosRate`) |
| First frame without vel sample | Pass (`haveTargetVel ? formatClosRate : '0 u/s'`) |
| Fail-closed on non-ship lock | Pass. Write is inside `shipTgt` DIST block; rail hide resets `railClos` |
| Contacts «/» still Mk II only | Pass. Floor 4 exclusive. Helper does not copy NPC 40 |
| `textContent` / `el()` only | Pass |
| No CLOS `@keyframes` | Pass. `.rw-combat-clos` is tabular-nums only |

Helper math: `along = relVel · los / |los|` when `|los|² > 1e-4`, else 0. Probe: approach -12, recede +9, perp 0, ε 0.

## WAVE102 pins (all true)

```
helperSign, helperEps, helperFailClosed, helperNotSpd, fmtDeputize,
hubEmpty, closAfterDist, liveShipLock, scanner0ShowsRail, nonShipNoRate,
noWorldField, noInnerHtml, digit0Shipyard, keyKEngine, contactsFloor,
noNewCtxField, noKeyframes, measureRails
```

## WAVE92 BIO-02

Not present as FAIL on this run. All `w92b` keys true, including `trainOffer`. If a later run fails on career copy (`Offer heavy` vs career words), treat that as the BIO-02 sibling, not CLOS. CLOS does not edit `shipyard-desk.js`.

## Bugs

None in CLOS scope.

## Env

- Probe exit 0.
- Boot exit 1, 1 error: `REDMARCH TEST FAIL` only.
- Vite 5173 not used.
- Graph `graph_resolve` returned `blocked_ambiguous` (spreadsheet / PDF / Word, coverage 0.05–0.14 on “verify”). Those workflows do not bind this HUD check. No Word or Drive artifact.

## Evidence

- Probe stdout: `out/w102/clos/verify/probe-log.txt`
- Boot stdout: `out/w102/clos/verify/boot-test.log`
- Helper: `src/game/los-close.js`
- Rail + format: `src/systems/hud.js` 252–257, 864–869, 1282–1287, 2062–2066
- CSS: `src/ui/hud.css` 184–193, 913–915
- Pins: `scripts/boot-test.mjs` 21576–21748
